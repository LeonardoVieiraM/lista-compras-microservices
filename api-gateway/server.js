const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
const path = require('path');

// Importar service registry
const serviceRegistry = require('../shared/serviceRegistry');

class ApiGateway {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.serviceName = 'api-gateway';
        this.serviceUrl = `http://localhost:${this.port}`;
        
        // Circuit breaker state
        this.circuitBreakers = {
            'user-service': { failures: 0, state: 'CLOSED', lastFailure: 0 },
            'item-service': { failures: 0, state: 'CLOSED', lastFailure: 0 },
            'list-service': { failures: 0, state: 'CLOSED', lastFailure: 0 }
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.startHealthChecks();
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan('combined'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Service info headers
        this.app.use((req, res, next) => {
            res.setHeader('X-Service', this.serviceName);
            res.setHeader('X-Service-Version', '1.0.0');
            res.setHeader('X-Gateway', 'Express');
            next();
        });

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
            next();
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', this.healthCheck.bind(this));

        // Service registry endpoint
        this.app.get('/registry', this.getRegistry.bind(this));

        // Service endpoints
        this.app.use('/api/auth', this.proxyToService('user-service'));
        this.app.use('/api/users', this.proxyToService('user-service'));
        this.app.use('/api/items', this.proxyToService('item-service'));
        this.app.use('/api/lists', this.proxyToService('list-service'));

        // Aggregated endpoints
        this.app.get('/api/dashboard', this.getDashboard.bind(this));
        this.app.get('/api/search', this.globalSearch.bind(this));

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                service: 'API Gateway',
                version: '1.0.0',
                description: 'Gateway para Sistema de Listas de Compras com Microsserviços',
                endpoints: [
                    'GET /health - Status dos serviços',
                    'GET /registry - Serviços registrados',
                    'GET /api/dashboard - Dashboard do usuário',
                    'GET /api/search - Busca global',
                    '/api/auth/* - User Service',
                    '/api/users/* - User Service', 
                    '/api/items/* - Item Service',
                    '/api/lists/* - List Service'
                ]
            });
        });
    }

    setupErrorHandling() {
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint não encontrado',
                service: this.serviceName
            });
        });

        this.app.use((error, req, res, next) => {
            console.error('API Gateway Error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do gateway',
                service: this.serviceName
            });
        });
    }

    // Health check for all services
    async healthCheck(req, res) {
        try {
            const services = serviceRegistry.getAllServices();
            const healthResults = {};
            
            for (const [serviceName, serviceInfo] of Object.entries(services)) {
                try {
                    const response = await axios.get(`${serviceInfo.url}/health`, { timeout: 3000 });
                    healthResults[serviceName] = {
                        status: 'healthy',
                        data: response.data
                    };
                    
                    // Reset circuit breaker on success
                    if (this.circuitBreakers[serviceName]) {
                        this.circuitBreakers[serviceName].failures = 0;
                        this.circuitBreakers[serviceName].state = 'CLOSED';
                    }
                } catch (error) {
                    healthResults[serviceName] = {
                        status: 'unhealthy',
                        error: error.message
                    };
                    
                    // Update circuit breaker on failure
                    if (this.circuitBreakers[serviceName]) {
                        this.circuitBreakers[serviceName].failures++;
                        this.circuitBreakers[serviceName].lastFailure = Date.now();
                        
                        if (this.circuitBreakers[serviceName].failures >= 3) {
                            this.circuitBreakers[serviceName].state = 'OPEN';
                            console.warn(`Circuit breaker OPEN for ${serviceName}`);
                        }
                    }
                }
            }
            
            res.json({
                gateway: {
                    service: this.serviceName,
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime()
                },
                services: healthResults,
                circuitBreakers: this.circuitBreakers
            });
        } catch (error) {
            res.status(503).json({
                service: this.serviceName,
                status: 'unhealthy',
                error: error.message
            });
        }
    }

    // Get service registry
    getRegistry(req, res) {
        const services = serviceRegistry.getAllServices();
        res.json({
            success: true,
            data: services,
            count: Object.keys(services).length
        });
    }

    // Proxy requests to services
    proxyToService(serviceName) {
        return async (req, res) => {
            // Check circuit breaker
            if (this.circuitBreakers[serviceName]?.state === 'OPEN') {
                const timeSinceLastFailure = Date.now() - this.circuitBreakers[serviceName].lastFailure;
                
                // Try to close circuit after 30 seconds
                if (timeSinceLastFailure > 30000) {
                    this.circuitBreakers[serviceName].state = 'HALF-OPEN';
                    console.log(`Circuit breaker HALF-OPEN for ${serviceName}`);
                } else {
                    return res.status(503).json({
                        success: false,
                        message: `Serviço ${serviceName} temporariamente indisponível`,
                        circuitBreaker: 'OPEN'
                    });
                }
            }
            
            try {
                // Discover service
                const service = serviceRegistry.discover(serviceName);
                if (!service) {
                    return res.status(503).json({
                        success: false,
                        message: `Serviço ${serviceName} não encontrado`
                    });
                }
                
                // Build target URL
                const targetUrl = `${service.url}${req.originalUrl.replace(`/api/${serviceName.split('-')[0]}`, '')}`;
                
                // Forward request
                const response = await axios({
                    method: req.method,
                    url: targetUrl,
                    data: req.body,
                    headers: {
                        ...req.headers,
                        host: new URL(service.url).host
                    },
                    timeout: 10000
                });
                
                // If circuit was half-open, close it on success
                if (this.circuitBreakers[serviceName]?.state === 'HALF-OPEN') {
                    this.circuitBreakers[serviceName].state = 'CLOSED';
                    this.circuitBreakers[serviceName].failures = 0;
                    console.log(`Circuit breaker CLOSED for ${serviceName}`);
                }
                
                // Forward response
                res.status(response.status).json(response.data);
            } catch (error) {
                console.error(`Proxy error for ${serviceName}:`, error.message);
                
                // Update circuit breaker
                if (this.circuitBreakers[serviceName]) {
                    this.circuitBreakers[serviceName].failures++;
                    this.circuitBreakers[serviceName].lastFailure = Date.now();
                    
                    if (this.circuitBreakers[serviceName].failures >= 3) {
                        this.circuitBreakers[serviceName].state = 'OPEN';
                        console.warn(`Circuit breaker OPEN for ${serviceName}`);
                    } else if (this.circuitBreakers[serviceName].state === 'HALF-OPEN') {
                        this.circuitBreakers[serviceName].state = 'OPEN';
                        console.warn(`Circuit breaker OPEN for ${serviceName} (half-open failed)`);
                    }
                }
                
                if (error.response) {
                    // Forward error response from service
                    res.status(error.response.status).json(error.response.data);
                } else {
                    res.status(503).json({
                        success: false,
                        message: `Serviço ${serviceName} indisponível`,
                        error: error.message
                    });
                }
            }
        };
    }

    // Dashboard endpoint (aggregates data from multiple services)
    async getDashboard(req, res) {
        try {
            const authHeader = req.header('Authorization');
            
            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'Token obrigatório'
                });
            }
            
            const token = authHeader.replace('Bearer ', '');
            
            // Validate token and get user info
            const userService = serviceRegistry.discover('user-service');
            const userResponse = await axios.post(`${userService.url}/auth/validate`, { token }, { timeout: 5000 });
            
            if (!userResponse.data.success) {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }
            
            const user = userResponse.data.data.user;
            
            // Get user's lists
            const listService = serviceRegistry.discover('list-service');
            const listsResponse = await axios.get(`${listService.url}/lists`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
            
            const lists = listsResponse.data.success ? listsResponse.data.data : [];
            
            // Get active items count
            const itemService = serviceRegistry.discover('item-service');
            const itemsResponse = await axios.get(`${itemService.url}/items?active=true&limit=1`, { timeout: 5000 });
            
            const totalItems = itemsResponse.data.success ? itemsResponse.data.pagination.total : 0;
            
            // Calculate dashboard statistics
            const activeLists = lists.filter(list => list.status === 'active').length;
            const completedLists = lists.filter(list => list.status === 'completed').length;
            const totalEstimated = lists.reduce((sum, list) => sum + list.summary.estimatedTotal, 0);
            
            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        preferences: user.preferences
                    },
                    statistics: {
                        totalLists: lists.length,
                        activeLists,
                        completedLists,
                        totalItems,
                        totalEstimated: parseFloat(totalEstimated.toFixed(2))
                    },
                    recentLists: lists.slice(0, 5).map(list => ({
                        id: list.id,
                        name: list.name,
                        status: list.status,
                        itemCount: list.summary.totalItems,
                        purchasedCount: list.summary.purchasedItems,
                        estimatedTotal: list.summary.estimatedTotal,
                        updatedAt: list.updatedAt
                    }))
                }
            });
        } catch (error) {
            console.error('Dashboard error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Erro ao carregar dashboard',
                error: error.message
            });
        }
    }

    // Global search across services
    async globalSearch(req, res) {
        try {
            const { q } = req.query;
            
            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro de busca (q) é obrigatório'
                });
            }
            
            const results = {};
            
            // Search items
            try {
                const itemService = serviceRegistry.discover('item-service');
                const response = await axios.get(`${itemService.url}/search?q=${encodeURIComponent(q)}&limit=10`, { timeout: 5000 });
                
                if (response.data.success) {
                    results.items = response.data.data;
                }
            } catch (error) {
                console.error('Item search error:', error.message);
                results.itemsError = error.message;
            }
            
            // If authenticated, search lists too
            const authHeader = req.header('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                try {
                    const token = authHeader.replace('Bearer ', '');
                    const listService = serviceRegistry.discover('list-service');
                    
                    // Get all user's lists and filter by name
                    const response = await axios.get(`${listService.url}/lists`, {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 5000
                    });
                    
                    if (response.data.success) {
                        const lists = response.data.data;
                        results.lists = lists.filter(list => 
                            list.name.toLowerCase().includes(q.toLowerCase())
                        ).slice(0, 5);
                    }
                } catch (error) {
                    console.error('List search error:', error.message);
                    results.listsError = error.message;
                }
            }
            
            res.json({
                success: true,
                data: results,
                search: {
                    query: q,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Global search error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro na busca global',
                error: error.message
            });
        }
    }

    // Start periodic health checks
    startHealthChecks() {
        setInterval(async () => {
            try {
                const services = serviceRegistry.getAllServices();
                
                for (const [serviceName, serviceInfo] of Object.entries(services)) {
                    try {
                        await axios.get(`${serviceInfo.url}/health`, { timeout: 3000 });
                        serviceRegistry.updateHealth(serviceName, true);
                    } catch (error) {
                        console.warn(`Health check failed for ${serviceName}:`, error.message);
                        serviceRegistry.updateHealth(serviceName, false);
                    }
                }
            } catch (error) {
                console.error('Health check interval error:', error);
            }
        }, 30000); // Check every 30 seconds
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('=====================================');
            console.log(`API Gateway iniciado na porta ${this.port}`);
            console.log(`URL: ${this.serviceUrl}`);
            console.log(`Health: ${this.serviceUrl}/health`);
            console.log(`Registry: ${this.serviceUrl}/registry`);
            console.log('=====================================');
        });
    }
}

// Start gateway
if (require.main === module) {
    const apiGateway = new ApiGateway();
    apiGateway.start();
}

module.exports = ApiGateway;