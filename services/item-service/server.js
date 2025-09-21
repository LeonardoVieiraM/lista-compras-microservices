const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const axios = require('axios');

// Importar banco NoSQL e service registry
const JsonDatabase = require('../../shared/JsonDatabase');
const serviceRegistry = require('../../shared/serviceRegistry');

class ItemService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3002;
        this.serviceName = 'item-service';
        this.serviceUrl = `http://127.0.0.1:${this.port}`;
        
        this.setupDatabase();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.seedInitialData();
    }

    setupDatabase() {
        const dbPath = path.join(__dirname, 'database');
        this.itemsDb = new JsonDatabase(dbPath, 'items');
        console.log('Item Service: Banco NoSQL inicializado');
    }

    async seedInitialData() {
        // Aguardar inicialização e criar produtos exemplo
        setTimeout(async () => {
            try {
                const existingItems = await this.itemsDb.find();
                
                if (existingItems.length === 0) {
                    const sampleItems = [
                        {
                            id: uuidv4(),
                            name: 'Smartphone Premium',
                            description: 'Smartphone tela 6.1", 128GB, câmera 48MP',
                            price: 1299.99,
                            stock: 15,
                            category: {
                                name: 'Eletrônicos',
                                slug: 'eletronicos'
                            },
                            images: [
                                'https://via.placeholder.com/300x300?text=Smartphone+1',
                                'https://via.placeholder.com/300x300?text=Smartphone+2'
                            ],
                            tags: ['smartphone', 'tecnologia', 'celular'],
                            specifications: {
                                brand: 'TechBrand',
                                model: 'Premium X1',
                                storage: '128GB',
                                ram: '8GB',
                                camera: '48MP'
                            },
                            active: true,
                            featured: true
                        },
                        {
                            id: uuidv4(),
                            name: 'Notebook Gamer',
                            description: 'Notebook Intel i7, 16GB RAM, RTX 3060',
                            price: 3499.99,
                            stock: 8,
                            category: {
                                name: 'Eletrônicos',
                                slug: 'eletronicos'
                            },
                            images: [
                                'https://via.placeholder.com/300x300?text=Notebook+1'
                            ],
                            tags: ['notebook', 'gamer', 'computador'],
                            specifications: {
                                brand: 'GameTech',
                                processor: 'Intel i7',
                                ram: '16GB',
                                graphics: 'RTX 3060',
                                storage: '512GB SSD'
                            },
                            active: true,
                            featured: false
                        },
                        {
                            id: uuidv4(),
                            name: 'Fone Bluetooth',
                            description: 'Fone sem fio com cancelamento de ruído',
                            price: 299.99,
                            stock: 25,
                            category: {
                                name: 'Acessórios',
                                slug: 'acessorios'
                            },
                            images: [
                                'https://via.placeholder.com/300x300?text=Fone+1'
                            ],
                            tags: ['fone', 'bluetooth', 'audio'],
                            specifications: {
                                brand: 'AudioMax',
                                connectivity: 'Bluetooth 5.0',
                                battery: '30h',
                                noiseCancellation: true
                            },
                            active: true,
                            featured: true
                        },
                        {
                            id: uuidv4(),
                            name: 'Camiseta Básica',
                            description: 'Camiseta 100% algodão, várias cores',
                            price: 39.99,
                            stock: 50,
                            category: {
                                name: 'Roupas',
                                slug: 'roupas'
                            },
                            images: [
                                'https://via.placeholder.com/300x300?text=Camiseta+1'
                            ],
                            tags: ['camiseta', 'básica', 'algodão'],
                            specifications: {
                                material: '100% Algodão',
                                sizes: ['P', 'M', 'G', 'GG'],
                                colors: ['Branco', 'Preto', 'Azul', 'Verde']
                            },
                            active: true,
                            featured: false
                        }
                    ];

                    for (const item of sampleItems) {
                        await this.itemsDb.create(item);
                    }

                    console.log('Produtos de exemplo criados no Item Service');
                }
            } catch (error) {
                console.error('Erro ao criar dados iniciais:', error);
            }
        }, 1000);
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
            res.setHeader('X-Database', 'JSON-NoSQL');
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', async (req, res) => {
            try {
                const itemCount = await this.itemsDb.count();
                const activeItems = await this.itemsDb.count({ active: true });
                
                res.json({
                    service: this.serviceName,
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    version: '1.0.0',
                    database: {
                        type: 'JSON-NoSQL',
                        itemCount: itemCount,
                        activeItems: activeItems
                    }
                });
            } catch (error) {
                res.status(503).json({
                    service: this.serviceName,
                    status: 'unhealthy',
                    error: error.message
                });
            }
        });

        // Service info
        this.app.get('/', (req, res) => {
            res.json({
                service: 'Item Service',
                version: '1.0.0',
                description: 'Microsserviço para gerenciamento de produtos com NoSQL',
                database: 'JSON-NoSQL',
                endpoints: [
                    'GET /items',
                    'GET /items/:id',
                    'POST /items',
                    'PUT /items/:id',
                    'DELETE /items/:id',
                    'PUT /items/:id/stock',
                    'GET /categories',
                    'GET /search'
                ]
            });
        });

        // Item routes
        this.app.get('/items', this.getItems.bind(this));
        this.app.get('/items/:id', this.getItem.bind(this));
        this.app.post('/items', this.authMiddleware.bind(this), this.createItem.bind(this));
        this.app.put('/items/:id', this.authMiddleware.bind(this), this.updateItem.bind(this));
        this.app.delete('/items/:id', this.authMiddleware.bind(this), this.deleteItem.bind(this));
        this.app.put('/items/:id/stock', this.authMiddleware.bind(this), this.updateStock.bind(this));

        // Category routes (extraídas dos produtos)
        this.app.get('/categories', this.getCategories.bind(this));

        // Search route
        this.app.get('/search', this.searchItems.bind(this));
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
            console.error('Item Service Error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do serviço',
                service: this.serviceName
            });
        });
    }

    // Auth middleware (valida token com User Service)
    async authMiddleware(req, res, next) {
        const authHeader = req.header('Authorization');
        
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token obrigatório'
            });
        }

        try {
            // Descobrir User Service
            const userService = serviceRegistry.discover('user-service');
            
            // Validar token com User Service
            const response = await axios.post(`${userService.url}/auth/validate`, {
                token: authHeader.replace('Bearer ', '')
            }, { timeout: 5000 });

            if (response.data.success) {
                req.user = response.data.data.user;
                next();
            } else {
                res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }
        } catch (error) {
            console.error('Erro na validação do token:', error.message);
            res.status(503).json({
                success: false,
                message: 'Serviço de autenticação indisponível'
            });
        }
    }

    // Get items (com filtros e paginação)
    async getItems(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                category, 
                minPrice, 
                maxPrice, 
                search,
                active = true,
                featured
            } = req.query;
            
            const skip = (page - 1) * parseInt(limit);
            
            // Filtros NoSQL flexíveis
            const filter = { active: active === 'true' };

            // Filtrar por categoria
            if (category) {
                filter['category.slug'] = category;
            }

            // Filtrar por destaque
            if (featured !== undefined) {
                filter.featured = featured === 'true';
            }

            // Filtrar por preço
            if (minPrice) {
                filter.price = { $gte: parseFloat(minPrice) };
            }
            if (maxPrice) {
                if (filter.price) {
                    filter.price.$lte = parseFloat(maxPrice);
                } else {
                    filter.price = { $lte: parseFloat(maxPrice) };
                }
            }

            let items;
            
            // Se há busca por texto, usar método de search
            if (search) {
                items = await this.itemsDb.search(search, ['name', 'description', 'tags']);
                // Aplicar outros filtros manualmente
                items = items.filter(item => {
                    for (const [key, value] of Object.entries(filter)) {
                        if (key === 'price') {
                            if (value.$gte && item.price < value.$gte) return false;
                            if (value.$lte && item.price > value.$lte) return false;
                        } else if (key.includes('.')) {
                            // Campos aninhados (ex: category.slug)
                            const keys = key.split('.');
                            const itemValue = keys.reduce((obj, k) => obj?.[k], item);
                            if (itemValue !== value) return false;
                        } else if (item[key] !== value) {
                            return false;
                        }
                    }
                    return true;
                });
                // Aplicar paginação manual
                items = items.slice(skip, skip + parseInt(limit));
            } else {
                items = await this.itemsDb.find(filter, {
                    skip: skip,
                    limit: parseInt(limit),
                    sort: { createdAt: -1 }
                });
            }

            const total = await this.itemsDb.count(filter);

            res.json({
                success: true,
                data: items,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Get item by ID
    async getItem(req, res) {
        try {
            const { id } = req.params;
            const item = await this.itemsDb.findById(id);

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado'
                });
            }

            res.json({
                success: true,
                data: item
            });
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Create item (demonstrando schema NoSQL flexível)
    async createItem(req, res) {
        try {
            const { 
                name, 
                description, 
                price, 
                stock, 
                category, 
                images, 
                tags, 
                specifications,
                featured = false
            } = req.body;

            if (!name || !price) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome e preço são obrigatórios'
                });
            }

            // Criar produto com schema NoSQL flexível
            const newItem = await this.itemsDb.create({
                id: uuidv4(),
                name,
                description: description || '',
                price: parseFloat(price),
                stock: parseInt(stock) || 0,
                category: category || { name: 'Geral', slug: 'geral' },
                images: Array.isArray(images) ? images : (images ? [images] : []),
                tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
                specifications: specifications || {},
                active: true,
                featured: featured,
                metadata: {
                    createdBy: req.user.id,
                    createdByName: `${req.user.firstName} ${req.user.lastName}`
                }
            });

            res.status(201).json({
                success: true,
                message: 'Produto criado com sucesso',
                data: newItem
            });
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Update item (demonstrando flexibilidade NoSQL)
    async updateItem(req, res) {
        try {
            const { id } = req.params;
            const { 
                name, 
                description, 
                price, 
                stock, 
                category, 
                images, 
                tags, 
                specifications,
                active,
                featured
            } = req.body;

            const item = await this.itemsDb.findById(id);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado'
                });
            }

            // Updates flexíveis com NoSQL
            const updates = {};
            if (name !== undefined) updates.name = name;
            if (description !== undefined) updates.description = description;
            if (price !== undefined) updates.price = parseFloat(price);
            if (stock !== undefined) updates.stock = parseInt(stock);
            if (category !== undefined) updates.category = category;
            if (images !== undefined) {
                updates.images = Array.isArray(images) ? images : (images ? [images] : []);
            }
            if (tags !== undefined) {
                updates.tags = Array.isArray(tags) ? tags : (tags ? [tags] : []);
            }
            if (specifications !== undefined) {
                // Merge com especificações existentes
                updates.specifications = { ...item.specifications, ...specifications };
            }
            if (active !== undefined) updates.active = active;
            if (featured !== undefined) updates.featured = featured;

            // Adicionar metadata de atualização
            updates['metadata.lastUpdatedBy'] = req.user.id;
            updates['metadata.lastUpdatedByName'] = `${req.user.firstName} ${req.user.lastName}`;
            updates['metadata.lastUpdatedAt'] = new Date().toISOString();

            const updatedItem = await this.itemsDb.update(id, updates);

            res.json({
                success: true,
                message: 'Produto atualizado com sucesso',
                data: updatedItem
            });
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Delete item (soft delete)
    async deleteItem(req, res) {
        try {
            const { id } = req.params;

            const item = await this.itemsDb.findById(id);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado'
                });
            }

            // Soft delete - desativar produto
            await this.itemsDb.update(id, { 
                active: false,
                'metadata.deletedBy': req.user.id,
                'metadata.deletedByName': `${req.user.firstName} ${req.user.lastName}`,
                'metadata.deletedAt': new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Produto removido com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Update stock
    async updateStock(req, res) {
        try {
            const { id } = req.params;
            const { quantity, operation = 'set' } = req.body;

            const item = await this.itemsDb.findById(id);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado'
                });
            }

            let newStock = item.stock;
            
            switch (operation) {
                case 'add':
                    newStock += parseInt(quantity);
                    break;
                case 'subtract':
                    newStock = Math.max(0, newStock - parseInt(quantity));
                    break;
                case 'set':
                default:
                    newStock = parseInt(quantity);
                    break;
            }

            await this.itemsDb.update(id, { 
                stock: newStock,
                'metadata.lastStockUpdate': new Date().toISOString(),
                'metadata.lastStockUpdateBy': req.user.id
            });

            res.json({
                success: true,
                message: 'Estoque atualizado com sucesso',
                data: {
                    itemId: id,
                    previousStock: item.stock,
                    newStock: newStock,
                    operation: operation,
                    quantity: parseInt(quantity)
                }
            });
        } catch (error) {
            console.error('Erro ao atualizar estoque:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Get categories (extraídas dos produtos)
    async getCategories(req, res) {
        try {
            const items = await this.itemsDb.find({ active: true });
            
            // Extrair categorias únicas dos produtos (demonstrando flexibilidade NoSQL)
            const categoriesMap = new Map();
            items.forEach(item => {
                if (item.category) {
                    const key = item.category.slug || item.category.name;
                    if (!categoriesMap.has(key)) {
                        categoriesMap.set(key, {
                            name: item.category.name,
                            slug: item.category.slug || item.category.name.toLowerCase().replace(/\s+/g, '-'),
                            itemCount: 0
                        });
                    }
                    categoriesMap.get(key).itemCount++;
                }
            });

            const categories = Array.from(categoriesMap.values())
                .sort((a, b) => a.name.localeCompare(b.name));
            
            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Search items (demonstrando busca NoSQL)
    async searchItems(req, res) {
        try {
            const { q, limit = 20, category } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro de busca "q" é obrigatório'
                });
            }

            // Busca full-text NoSQL
            let items = await this.itemsDb.search(q, ['name', 'description', 'tags']);
            
            // Filtrar apenas produtos ativos
            items = items.filter(item => item.active);

            // Filtrar por categoria se especificada
            if (category) {
                items = items.filter(item => 
                    item.category?.slug === category || item.category?.name === category
                );
            }

            // Aplicar limite
            items = items.slice(0, parseInt(limit));

            res.json({
                success: true,
                data: {
                    query: q,
                    category: category || null,
                    results: items,
                    total: items.length
                }
            });
        } catch (error) {
            console.error('Erro na busca de produtos:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Register with service registry
    registerWithRegistry() {
        serviceRegistry.register(this.serviceName, {
            url: this.serviceUrl,
            version: '1.0.0',
            database: 'JSON-NoSQL',
            endpoints: ['/health', '/items', '/categories', '/search']
        });
    }

    // Start health check reporting
    startHealthReporting() {
        setInterval(() => {
            serviceRegistry.updateHealth(this.serviceName, true);
        }, 30000);
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('=====================================');
            console.log(`Item Service iniciado na porta ${this.port}`);
            console.log(`URL: ${this.serviceUrl}`);
            console.log(`Health: ${this.serviceUrl}/health`);
            console.log(`Database: JSON-NoSQL`);
            console.log('=====================================');
            
            // Register with service registry
            this.registerWithRegistry();
            this.startHealthReporting();
        });
    }
}

// Start service
if (require.main === module) {
    const itemService = new ItemService();
    itemService.start();

    // Graceful shutdown
    process.on('SIGTERM', () => {
        serviceRegistry.unregister('item-service');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        serviceRegistry.unregister('item-service');
        process.exit(0);
    });
}

module.exports = ItemService;