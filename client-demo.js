const axios = require('axios');

class MicroservicesClient {
    constructor(gatewayUrl = 'http://127.0.0.1:3000') {
        this.gatewayUrl = gatewayUrl;
        this.authToken = null;
        this.user = null;
        
        // Configurar axios
        this.api = axios.create({
            baseURL: gatewayUrl,
            timeout: 10000,
            family: 4  // Forçar IPv4
        });

        // Interceptor para adicionar token automaticamente
        this.api.interceptors.request.use(config => {
            if (this.authToken) {
                config.headers.Authorization = `Bearer ${this.authToken}`;
            }
            return config;
        });

        // Interceptor para log de erros
        this.api.interceptors.response.use(
            response => response,
            error => {
                console.error('Erro na requisição:', {
                    url: error.config?.url,
                    method: error.config?.method,
                    status: error.response?.status,
                    message: error.response?.data?.message || error.message
                });
                return Promise.reject(error);
            }
        );
    }

    // Registrar usuário
    async register(userData) {
        try {
            console.log('\nRegistrando usuário...');
            const response = await this.api.post('/api/users/auth/register', userData);
            
            if (response.data.success) {
                this.authToken = response.data.data.token;
                this.user = response.data.data.user;
                console.log('Usuário registrado:', this.user.username);
                return response.data;
            } else {
                throw new Error(response.data.message || 'Falha no registro');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            console.log('Erro no registro:', message);
            throw error;
        }
    }

    // Fazer login
    async login(credentials) {
        try {
            console.log('\nFazendo login...');
            const response = await this.api.post('/api/users/auth/login', credentials);
            
            if (response.data.success) {
                this.authToken = response.data.data.token;
                this.user = response.data.data.user;
                console.log('Login realizado:', this.user.username);
                return response.data;
            } else {
                throw new Error(response.data.message || 'Falha no login');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            console.log('Erro no login:', message);
            throw error;
        }
    }

    // Buscar produtos
    async getProducts(filters = {}) {
        try {
            console.log('\nBuscando produtos...');
            const response = await this.api.get('/api/products', { params: filters });
            
            if (response.data.success) {
                const products = response.data.data;
                console.log(`Encontrados ${products.length} produtos`);
                products.forEach((product, index) => {
                    const tags = product.tags ? ` [${product.tags.join(', ')}]` : '';
                    console.log(`  ${index + 1}. ${product.name} - R$ ${product.price} (Estoque: ${product.stock})${tags}`);
                });
                return response.data;
            } else {
                console.log('Resposta inválida do servidor');
                return { data: [] };
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            console.log('Erro ao buscar produtos:', message);
            return { data: [] };
        }
    }

    // Criar produto (requer autenticação)
    async createProduct(productData) {
        try {
            console.log('\nCriando produto...');
            
            if (!this.authToken) {
                throw new Error('Token de autenticação necessário');
            }

            const response = await this.api.post('/api/products', productData);
            
            if (response.data.success) {
                console.log('Produto criado:', response.data.data.name);
                return response.data;
            } else {
                throw new Error(response.data.message || 'Falha na criação do produto');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            console.log('Erro ao criar produto:', message);
            throw error;
        }
    }

    // Buscar categorias
    async getCategories() {
        try {
            console.log('\nBuscando categorias...');
            const response = await this.api.get('/api/products/categories');
            
            if (response.data.success) {
                const categories = response.data.data;
                console.log(`Encontradas ${categories.length} categorias`);
                categories.forEach((category, index) => {
                    console.log(`  ${index + 1}. ${category.name} - ${category.productCount} produtos`);
                });
                return response.data;
            } else {
                console.log('Resposta inválida do servidor');
                return { data: [] };
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            console.log('Erro ao buscar categorias:', message);
            return { data: [] };
        }
    }

    // Dashboard agregado
    async getDashboard() {
        try {
            console.log('\nBuscando dashboard...');
            
            if (!this.authToken) {
                throw new Error('Token de autenticação necessário para o dashboard');
            }

            const response = await this.api.get('/api/dashboard');
            
            if (response.data.success) {
                const dashboard = response.data.data;
                console.log('Dashboard carregado:');
                console.log(`   Timestamp: ${dashboard.timestamp}`);
                console.log(`   Arquitetura: ${dashboard.architecture}`);
                console.log(`   Banco de Dados: ${dashboard.database_approach}`);
                console.log(`   Status dos Serviços:`);
                
                if (dashboard.services_status) {
                    Object.entries(dashboard.services_status).forEach(([serviceName, serviceInfo]) => {
                        const status = serviceInfo.healthy ? 'SAUDÁVEL' : 'INDISPONÍVEL';
                        console.log(`     ${serviceName}: ${status} (${serviceInfo.url})`);
                    });
                }

                console.log(`   Usuários disponíveis: ${dashboard.data?.users?.available ? 'Sim' : 'Não'}`);
                console.log(`   Produtos disponíveis: ${dashboard.data?.products?.available ? 'Sim' : 'Não'}`);
                console.log(`   Categorias disponíveis: ${dashboard.data?.categories?.available ? 'Sim' : 'Não'}`);
                
                return response.data;
            } else {
                throw new Error(response.data.message || 'Falha ao carregar dashboard');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            console.log('Erro ao buscar dashboard:', message);
            throw error;
        }
    }

    // Busca global
    async search(query) {
        try {
            console.log(`\nBuscando por: "${query}"`);
            const response = await this.api.get('/api/search', { params: { q: query } });
            
            if (response.data.success) {
                const results = response.data.data;
                console.log(`Resultados para "${results.query}":`);
                
                if (results.products?.available) {
                    console.log(`   Produtos encontrados: ${results.products.results.length}`);
                    results.products.results.forEach((product, index) => {
                        console.log(`     ${index + 1}. ${product.name} - R$ ${product.price}`);
                    });
                } else {
                    console.log('   Serviço de produtos indisponível');
                }

                if (results.users?.available) {
                    console.log(`   Usuários encontrados: ${results.users.results.length}`);
                    results.users.results.forEach((user, index) => {
                        console.log(`     ${index + 1}. ${user.firstName} ${user.lastName} (@${user.username})`);
                    });
                } else if (results.users?.error) {
                    console.log('   Busca de usuários requer autenticação');
                }
                
                return response.data;
            } else {
                throw new Error(response.data.message || 'Falha na busca');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            console.log('Erro na busca:', message);
            throw error;
        }
    }

    // Verificar saúde dos serviços
    async checkHealth() {
        try {
            console.log('\nVerificando saúde dos serviços...');
            
            const [gatewayHealth, registryInfo] = await Promise.allSettled([
                this.api.get('/health'),
                this.api.get('/registry')
            ]);

            if (gatewayHealth.status === 'fulfilled') {
                const health = gatewayHealth.value.data;
                console.log('API Gateway: healthy');
                console.log(`Arquitetura: ${health.architecture}`);
                
                if (registryInfo.status === 'fulfilled') {
                    const services = registryInfo.value.data.services;
                    console.log('Serviços registrados:');
                    
                    Object.entries(services).forEach(([name, info]) => {
                        const status = info.healthy ? 'SAUDÁVEL' : 'INDISPONÍVEL';
                        const uptime = Math.floor(info.uptime / 1000);
                        console.log(`   ${name}: ${status} (${info.url}) - uptime: ${uptime}s`);
                    });
                } else {
                    console.log('   Erro ao buscar registry:', registryInfo.reason?.message);
                }
            } else {
                console.log('API Gateway indisponível:', gatewayHealth.reason?.message);
            }
            
            return { gatewayHealth, registryInfo };
        } catch (error) {
            console.log('Erro ao verificar saúde:', error.message);
            throw error;
        }
    }

    // Demonstração completa
    async runDemo() {
        console.log('=====================================');
        console.log('Demo: Microsserviços com NoSQL');
        console.log('=====================================');

        try {
            // 1. Verificar saúde dos serviços
            await this.checkHealth();
            await this.delay(2000);

            // 2. Registrar usuário
            const uniqueId = Date.now();
            const userData = {
                email: `demo${uniqueId}@microservices.com`,
                username: `demo${uniqueId}`,
                password: 'demo123456',
                firstName: 'Demo',
                lastName: 'User'
            };

            let authSuccessful = false;
            try {
                await this.register(userData);
                authSuccessful = true;
            } catch (error) {
                // Se registro falhar, tentar login com admin
                console.log('\nTentando login com usuário admin...');
                try {
                    await this.login({
                        identifier: 'admin@microservices.com',
                        password: 'admin123'
                    });
                    authSuccessful = true;
                } catch (loginError) {
                    console.log('Login com admin falhou, continuando sem autenticação...');
                    authSuccessful = false;
                }
            }

            await this.delay(1000);

            // 3. Buscar produtos
            await this.getProducts({ limit: 5 });
            await this.delay(1000);

            // 4. Buscar categorias
            await this.getCategories();
            await this.delay(1000);

            // 5. Fazer busca
            await this.search('smartphone');
            await this.delay(1000);

            // 6. Se autenticado, fazer operações que requerem auth
            if (authSuccessful && this.authToken) {
                // Buscar dashboard
                try {
                    await this.getDashboard();
                    await this.delay(1000);
                } catch (error) {
                    console.log('Dashboard não disponível:', error.message);
                }

                // Criar produto de teste
                try {
                    const newProduct = await this.createProduct({
                        name: 'Produto Demo NoSQL',
                        description: 'Produto criado via demo com banco NoSQL',
                        price: 99.99,
                        stock: 10,
                        category: {
                            name: 'Demo',
                            slug: 'demo'
                        },
                        tags: ['demo', 'nosql', 'teste'],
                        specifications: {
                            material: 'Digital',
                            cor: 'Virtual'
                        },
                        featured: true
                    });

                    if (newProduct.success) {
                        await this.delay(1000);
                        console.log(`Produto criado: ${newProduct.data.name} (ID: ${newProduct.data.id})`);
                    }
                } catch (error) {
                    console.log('Criação de produto falhou:', error.message);
                }
            } else {
                console.log('\nOperações autenticadas puladas (sem token válido)');
            }

            console.log('\n=====================================');
            console.log('Demonstração concluída com sucesso!');
            console.log('=====================================');
            console.log('Padrões demonstrados:');
            console.log('   Service Discovery via Registry');
            console.log('   API Gateway com roteamento');
            console.log('   Circuit Breaker pattern');
            console.log('   Comunicação inter-service');
            console.log('   Aggregated endpoints');
            console.log('   Health checks distribuídos');
            console.log('   Database per Service (NoSQL)');
            console.log('   JSON-based document storage');
            console.log('   Full-text search capabilities');
            console.log('   Schema flexível com documentos aninhados');

        } catch (error) {
            console.error('Erro na demonstração:', error.message);
            console.log('\nVerifique se todos os serviços estão rodando:');
            console.log('   User Service: http://127.0.0.1:3001/health');
            console.log('   Product Service: http://127.0.0.1:3002/health');
            console.log('   API Gateway: http://127.0.0.1:3000/health');
        }
    }

    // Helper para delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Executar demonstração
async function main() {
    // Verificar se os argumentos foram passados
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log('Uso: node client-demo.js [opções]');
        console.log('');
        console.log('Opções:');
        console.log('  --health    Verificar apenas saúde dos serviços');
        console.log('  --products  Listar apenas produtos');
        console.log('  --search    Fazer busca (requer termo: --search=termo)');
        console.log('  --help      Mostrar esta ajuda');
        console.log('');
        console.log('Sem argumentos: Executar demonstração completa');
        return;
    }

    const client = new MicroservicesClient();
    
    try {
        if (args.includes('--health')) {
            await client.checkHealth();
        } else if (args.includes('--products')) {
            await client.getProducts();
        } else if (args.some(arg => arg.startsWith('--search'))) {
            const searchArg = args.find(arg => arg.startsWith('--search'));
            const searchTerm = searchArg.includes('=') ? searchArg.split('=')[1] : 'smartphone';
            await client.search(searchTerm);
        } else {
            // Demonstração completa
            await client.runDemo();
        }
    } catch (error) {
        console.error('Erro na execução:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(error => {
        console.error('Erro crítico:', error.message);
        process.exit(1);
    });
}

module.exports = MicroservicesClient;