# Roteiro 3: Microsserviços com API Gateway e NoSQL 

**Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas**  
**Curso de Engenharia de Software - PUC Minas**  
**Professores:** Artur Mol, Cleiton Tavares e Cristiano Neto

---

## Objetivos

- Implementar arquitetura de microsserviços com 2 serviços básicos (User e Product)
- Utilizar bancos NoSQL independentes baseados em JSON
- Implementar API Gateway com service discovery
- Demonstrar comunicação REST entre serviços
- Aplicar padrões fundamentais: Circuit Breaker, Service Registry, Database per Service

## Fundamentação Teórica

Microsserviços representam uma abordagem arquitetural que estrutura uma aplicação como uma coleção de serviços fracamente acoplados. Esta implementação utiliza bancos NoSQL independentes para cada serviço, demonstrando o princípio de **Database per Service**.

### Características Implementadas

- **Service Discovery**: Registry centralizado para localização de serviços
- **API Gateway**: Ponto único de entrada com roteamento e agregação
- **Circuit Breaker**: Proteção contra falhas em cascata
- **Database per Service**: Cada serviço possui seu próprio banco NoSQL
- **Schema Flexível**: Documentos JSON adaptáveis sem migração

### Padrões Demonstrados

- **API Gateway Pattern**: Centralização do acesso aos serviços
- **Service Registry Pattern**: Descoberta automática de serviços
- **Circuit Breaker Pattern**: Resiliência contra falhas
- **Aggregator Pattern**: Combinação de dados de múltiplos serviços
- **Database per Service**: Isolamento de dados por contexto

---

## **PASSO 1: Setup do Projeto**

### 1.1 Estrutura do Projeto

```bash
# Criar estrutura do projeto
mkdir lab03-microservices-nosql
cd lab03-microservices-nosql

mkdir services
cd services 

mkdir user-service
mkdir product-service

cd .. 
mkdir api-gateway
mkdir shared
```

### 1.2 Package.json Principal

```json
{
  "name": "lab03-microservices-nosql",
  "version": "1.0.0",
  "description": "Sistema de Microsserviços com API Gateway e NoSQL - PUC Minas",
  "main": "client-demo.js",
  "scripts": {
    "start": "concurrently \"npm run start:user\" \"npm run start:product\" \"npm run start:gateway\"",
    "start:user": "cd services/user-service && npm start",
    "start:product": "cd services/product-service && npm start",
    "start:gateway": "cd api-gateway && npm start",
    "dev": "concurrently \"npm run dev:user\" \"npm run dev:product\" \"npm run dev:gateway\"",
    "dev:user": "cd services/user-service && npm run dev",
    "dev:product": "cd services/product-service && npm run dev",
    "dev:gateway": "cd api-gateway && npm run dev",
    "demo": "node client-demo.js",
    "health": "curl -s http://localhost:3000/health",
    "install:all": "npm install && cd services/user-service && npm install && cd ../product-service && npm install && cd ../../api-gateway && npm install",
    "clean": "rm -rf node_modules services/*/node_modules api-gateway/node_modules",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "microservices",
    "nosql",
    "api-gateway",
    "service-discovery",
    "circuit-breaker",
    "sistemas-distribuidos",
    "puc-minas"
  ],
  "author": "Aluno PUC Minas",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/aluno-pucminas/lab03-microservices-nosql.git"
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "fs-extra": "^11.1.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
```

### 1.3 Package.json Principal (`api-gateway/package.json`)

```json
{
  "name": "api-gateway",
  "version": "1.0.0",
  "description": "API Gateway para Microsserviços com Circuit Breaker - PUC Minas",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1",
    "health": "curl -s http://localhost:3000/health",
    "registry": "curl -s http://localhost:3000/registry",
    "dashboard": "curl -s http://localhost:3000/api/dashboard"
  },
  "keywords": [
    "api-gateway",
    "microservices",
    "service-discovery",
    "circuit-breaker",
    "load-balancer",
    "routing",
    "aggregation",
    "puc-minas"
  ],
  "author": "Aluno PUC Minas",
  "license": "MIT",
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "nodemonConfig": {
    "watch": [
      "server.js",
      "../shared/"
    ],
    "ext": "js,json",
    "ignore": [
      "node_modules/"
    ]
  },
  "environment": {
    "PORT": 3000,
    "NODE_ENV": "development",
    "CIRCUIT_BREAKER_THRESHOLD": 3,
    "CIRCUIT_BREAKER_TIMEOUT": 30000,
    "HEALTH_CHECK_INTERVAL": 30000
  }
}
```

### 1.4 Package.json product-service (`services/product-service/package.json`)

```json
{
  "name": "product-service",
  "version": "1.0.0",
  "description": "Microsserviço de Produtos com Banco NoSQL - PUC Minas",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1",
    "health": "curl -s http://localhost:3002/health",
    "seed": "node seed-data.js"
  },
  "keywords": [
    "microservice",
    "product-management",
    "inventory",
    "catalog",
    "nosql",
    "json-database",
    "search",
    "puc-minas"
  ],
  "author": "Aluno PUC Minas",
  "license": "MIT",
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "uuid": "^9.0.0",
    "fs-extra": "^11.1.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "nodemonConfig": {
    "watch": [
      "server.js",
      "../../shared/"
    ],
    "ext": "js,json",
    "ignore": [
      "database/",
      "node_modules/"
    ]
  },
  "environment": {
    "PORT": 3002,
    "NODE_ENV": "development"
  }
}
```


### 1.5 Package.json user-service (`services/user-service/package.json`)

```json
{
  "name": "user-service",
  "version": "1.0.0",
  "description": "Microsserviço de Usuários com Banco NoSQL - PUC Minas",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1",
    "health": "curl -s http://localhost:3001/health"
  },
  "keywords": [
    "microservice",
    "user-management",
    "authentication",
    "nosql",
    "json-database",
    "jwt",
    "puc-minas"
  ],
  "author": "Aluno PUC Minas",
  "license": "MIT",
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.0",
    "fs": "^0.0.1-security",
    "fs-extra": "^11.1.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.0",
    "morgan": "^1.10.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "nodemonConfig": {
    "watch": [
      "server.js",
      "../../shared/"
    ],
    "ext": "js,json",
    "ignore": [
      "database/",
      "node_modules/"
    ]
  },
  "environment": {
    "PORT": 3001,
    "JWT_SECRET": "user-service-secret-key-puc-minas",
    "NODE_ENV": "development"
  }
}

```

### 1.6 Instalar Dependências

```bash
# Instalar concurrently para execução paralela
npm install

# Setup dos serviços individuais
npm run install:all
```

---

## **PASSO 2: Banco NoSQL Baseado em Arquivos JSON**

### 2.1 Database Manager Genérico (`shared/JsonDatabase.js`)

```javascript
// shared/JsonDatabase.js
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class JsonDatabase {
    constructor(dbPath, collectionName) {
        this.dbPath = dbPath;
        this.collectionName = collectionName;
        this.filePath = path.join(dbPath, `${collectionName}.json`);
        this.indexPath = path.join(dbPath, `${collectionName}_index.json`);

        this.ensureDatabase();
    }

    async ensureDatabase() {
        try {
            // Criar diretório do banco se não existir
            await fs.ensureDir(this.dbPath);

            // Criar arquivo da coleção se não existir
            if (!await fs.pathExists(this.filePath)) {
                await fs.writeJson(this.filePath, []);
            }

            // Criar índice se não existir
            if (!await fs.pathExists(this.indexPath)) {
                await fs.writeJson(this.indexPath, {});
            }
        } catch (error) {
            console.error('Erro ao inicializar banco:', error);
            throw error;
        }
    }

    // Criar documento
    async create(data) {
        try {
            const documents = await this.readAll();
            const document = {
                id: data.id || uuidv4(),
                ...data,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            documents.push(document);
            await this.writeAll(documents);
            await this.updateIndex(document);

            return document;
        } catch (error) {
            console.error('Erro ao criar documento:', error);
            throw error;
        }
    }

    // Buscar por ID
    async findById(id) {
        try {
            const documents = await this.readAll();
            return documents.find(doc => doc.id === id) || null;
        } catch (error) {
            console.error('Erro ao buscar documento:', error);
            throw error;
        }
    }

    // Buscar um documento com filtro
    async findOne(filter) {
        try {
            const documents = await this.readAll();
            return documents.find(doc => this.matchesFilter(doc, filter)) || null;
        } catch (error) {
            console.error('Erro ao buscar documento:', error);
            throw error;
        }
    }

    // Buscar múltiplos documentos
    async find(filter = {}, options = {}) {
        try {
            let documents = await this.readAll();

            // Aplicar filtro
            if (Object.keys(filter).length > 0) {
                documents = documents.filter(doc => this.matchesFilter(doc, filter));
            }

            // Aplicar ordenação
            if (options.sort) {
                documents = this.sortDocuments(documents, options.sort);
            }

            // Aplicar paginação
            if (options.skip || options.limit) {
                const skip = options.skip || 0;
                const limit = options.limit || documents.length;
                documents = documents.slice(skip, skip + limit);
            }

            return documents;
        } catch (error) {
            console.error('Erro ao buscar documentos:', error);
            throw error;
        }
    }

    // Contar documentos
    async count(filter = {}) {
        try {
            const documents = await this.readAll();
            if (Object.keys(filter).length === 0) {
                return documents.length;
            }
            return documents.filter(doc => this.matchesFilter(doc, filter)).length;
        } catch (error) {
            console.error('Erro ao contar documentos:', error);
            throw error;
        }
    }

    // Atualizar documento
    async update(id, updates) {
        try {
            const documents = await this.readAll();
            const index = documents.findIndex(doc => doc.id === id);

            if (index === -1) {
                return null;
            }

            documents[index] = {
                ...documents[index],
                ...updates,
                id: documents[index].id, // Preservar ID
                createdAt: documents[index].createdAt, // Preservar data de criação
                updatedAt: new Date().toISOString()
            };

            await this.writeAll(documents);
            await this.updateIndex(documents[index]);

            return documents[index];
        } catch (error) {
            console.error('Erro ao atualizar documento:', error);
            throw error;
        }
    }

    // Deletar documento
    async delete(id) {
        try {
            const documents = await this.readAll();
            const index = documents.findIndex(doc => doc.id === id);

            if (index === -1) {
                return false;
            }

            documents.splice(index, 1);
            await this.writeAll(documents);
            await this.removeFromIndex(id);

            return true;
        } catch (error) {
            console.error('Erro ao deletar documento:', error);
            throw error;
        }
    }

    // Busca de texto
    async search(query, fields = []) {
        try {
            const documents = await this.readAll();
            const searchTerm = query.toLowerCase();

            return documents.filter(doc => {
                // Se campos específicos foram fornecidos, buscar apenas neles
                if (fields.length > 0) {
                    return fields.some(field => {
                        const value = this.getNestedValue(doc, field);
                        return value && value.toString().toLowerCase().includes(searchTerm);
                    });
                }

                // Buscar em todos os campos de string do documento
                return this.searchInObject(doc, searchTerm);
            });
        } catch (error) {
            console.error('Erro na busca:', error);
            throw error;
        }
    }

    // Métodos auxiliares
    async readAll() {
        try {
            return await fs.readJson(this.filePath);
        } catch (error) {
            return [];
        }
    }

    async writeAll(documents) {
        await fs.writeJson(this.filePath, documents, { spaces: 2 });
    }

    async updateIndex(document) {
        try {
            const index = await fs.readJson(this.indexPath);
            index[document.id] = {
                id: document.id,
                updatedAt: document.updatedAt
            };
            await fs.writeJson(this.indexPath, index, { spaces: 2 });
        } catch (error) {
            console.error('Erro ao atualizar índice:', error);
        }
    }

    async removeFromIndex(id) {
        try {
            const index = await fs.readJson(this.indexPath);
            delete index[id];
            await fs.writeJson(this.indexPath, index, { spaces: 2 });
        } catch (error) {
            console.error('Erro ao remover do índice:', error);
        }
    }

    matchesFilter(document, filter) {
        return Object.entries(filter).every(([key, value]) => {
            const docValue = this.getNestedValue(document, key);

            if (typeof value === 'object' && value !== null) {
                // Operadores especiais
                if (value.$regex) {
                    const regex = new RegExp(value.$regex, value.$options || 'i');
                    return regex.test(docValue);
                }
                if (value.$in) {
                    return value.$in.includes(docValue);
                }
                if (value.$gt) {
                    return docValue > value.$gt;
                }
                if (value.$lt) {
                    return docValue < value.$lt;
                }
                if (value.$gte) {
                    return docValue >= value.$gte;
                }
                if (value.$lte) {
                    return docValue <= value.$lte;
                }
            }

            return docValue === value;
        });
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    sortDocuments(documents, sortOptions) {
        return documents.sort((a, b) => {
            for (const [field, direction] of Object.entries(sortOptions)) {
                const valueA = this.getNestedValue(a, field);
                const valueB = this.getNestedValue(b, field);

                let comparison = 0;
                if (valueA < valueB) comparison = -1;
                if (valueA > valueB) comparison = 1;

                if (comparison !== 0) {
                    return direction === -1 ? -comparison : comparison;
                }
            }
            return 0;
        });
    }

    searchInObject(obj, searchTerm) {
        for (const value of Object.values(obj)) {
            if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
                return true;
            }
            if (typeof value === 'object' && value !== null && this.searchInObject(value, searchTerm)) {
                return true;
            }
        }
        return false;
    }
}

module.exports = JsonDatabase;
```

### 2.2 Service Registry (`shared/serviceRegistry.js`)

```javascript
// shared/serviceRegistry.js - VERSÃO COM ARQUIVO COMPARTILHADO
const fs = require('fs');
const path = require('path');

class FileBasedServiceRegistry {
    constructor() {
        this.registryFile = path.join(__dirname, 'services-registry.json');
        this.ensureRegistryFile();
        console.log('File-based Service Registry inicializado:', this.registryFile);
    }

    ensureRegistryFile() {
        if (!fs.existsSync(this.registryFile)) {
            this.writeRegistry({});
        }
    }

    readRegistry() {
        try {
            const data = fs.readFileSync(this.registryFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Erro ao ler registry file:', error.message);
            return {};
        }
    }

    writeRegistry(services) {
        try {
            fs.writeFileSync(this.registryFile, JSON.stringify(services, null, 2));
        } catch (error) {
            console.error('Erro ao escrever registry file:', error.message);
        }
    }

    // Registrar um serviço
    register(serviceName, serviceInfo) {
        const services = this.readRegistry();
        
        services[serviceName] = {
            ...serviceInfo,
            registeredAt: Date.now(),
            lastHealthCheck: Date.now(),
            healthy: true,
            pid: process.pid
        };
        
        this.writeRegistry(services);
        console.log(`Serviço registrado: ${serviceName} - ${serviceInfo.url} (PID: ${process.pid})`);
        console.log(`Total de serviços: ${Object.keys(services).length}`);
    }

    // Descobrir um serviço
    discover(serviceName) {
        const services = this.readRegistry();
        console.log(`Procurando serviço: ${serviceName}`);
        console.log(`Serviços disponíveis: ${Object.keys(services).join(', ')}`);
        
        const service = services[serviceName];
        if (!service) {
            console.error(`Serviço não encontrado: ${serviceName}`);
            console.error(`Serviços registrados:`, Object.keys(services));
            throw new Error(`Serviço não encontrado: ${serviceName}`);
        }
        
        if (!service.healthy) {
            console.error(`Serviço indisponível: ${serviceName}`);
            throw new Error(`Serviço indisponível: ${serviceName}`);
        }
        
        console.log(`Serviço encontrado: ${serviceName} - ${service.url}`);
        return service;
    }

    // Listar todos os serviços
    listServices() {
        const services = this.readRegistry();
        const serviceList = {};
        
        Object.entries(services).forEach(([name, service]) => {
            serviceList[name] = {
                url: service.url,
                healthy: service.healthy,
                registeredAt: new Date(service.registeredAt).toISOString(),
                uptime: Date.now() - service.registeredAt,
                pid: service.pid
            };
        });
        
        return serviceList;
    }

    // Remover serviço
    unregister(serviceName) {
        const services = this.readRegistry();
        if (services[serviceName]) {
            delete services[serviceName];
            this.writeRegistry(services);
            console.log(`Serviço removido: ${serviceName}`);
            return true;
        }
        return false;
    }

    // Health check de um serviço
    updateHealth(serviceName, healthy) {
        const services = this.readRegistry();
        if (services[serviceName]) {
            services[serviceName].healthy = healthy;
            services[serviceName].lastHealthCheck = Date.now();
            this.writeRegistry(services);
            const status = healthy ? 'OK' : 'FAIL';
            console.log(`Health check: ${serviceName} - ${status}`);
        }
    }

    // Health check de todos os serviços
    async performHealthChecks() {
        const axios = require('axios');
        const services = this.readRegistry();
        
        console.log(`Executando health checks de ${Object.keys(services).length} serviços...`);
        
        for (const [serviceName, service] of Object.entries(services)) {
            try {
                await axios.get(`${service.url}/health`, { 
                    timeout: 5000,
                    family: 4
                });
                this.updateHealth(serviceName, true);
            } catch (error) {
                console.error(`Health check falhou para ${serviceName}:`, error.message);
                this.updateHealth(serviceName, false);
            }
        }
    }

    // Debug: listar serviços registrados
    debugListServices() {
        const services = this.readRegistry();
        console.log('DEBUG - Serviços registrados:');
        Object.entries(services).forEach(([name, service]) => {
            console.log(`   ${name}: ${service.url} (${service.healthy ? 'healthy' : 'unhealthy'}) PID:${service.pid}`);
        });
    }

    // Verificar se um serviço existe
    hasService(serviceName) {
        const services = this.readRegistry();
        return services.hasOwnProperty(serviceName);
    }

    // Obter estatísticas
    getStats() {
        const services = this.readRegistry();
        const total = Object.keys(services).length;
        let healthy = 0;
        let unhealthy = 0;

        Object.values(services).forEach(service => {
            if (service.healthy) {
                healthy++;
            } else {
                unhealthy++;
            }
        });

        return { total, healthy, unhealthy };
    }

    // Limpar registry (útil para desenvolvimento)
    clear() {
        this.writeRegistry({});
        console.log('Registry limpo');
    }

    // Cleanup na saída do processo
    cleanup() {
        // Remove serviços deste PID ao sair
        const services = this.readRegistry();
        const currentPid = process.pid;
        let changed = false;

        Object.entries(services).forEach(([name, service]) => {
            if (service.pid === currentPid) {
                delete services[name];
                changed = true;
                console.log(`Removendo serviço ${name} do PID ${currentPid}`);
            }
        });

        if (changed) {
            this.writeRegistry(services);
        }
    }
}

// Criar instância singleton
const registry = new FileBasedServiceRegistry();

// Cleanup ao sair do processo
process.on('exit', () => registry.cleanup());
process.on('SIGINT', () => {
    registry.cleanup();
    process.exit(0);
});
process.on('SIGTERM', () => {
    registry.cleanup();
    process.exit(0);
});

module.exports = registry;
```

---

## **PASSO 3: User Service com NoSQL**

### 3.1 Implementação (`services/user-service/server.js`)

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Importar banco NoSQL e service registry
const JsonDatabase = require('../../shared/JsonDatabase');
const serviceRegistry = require('../../shared/serviceRegistry');

class UserService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;
        this.serviceName = 'user-service';
        this.serviceUrl = `http://localhost:${this.port}`;
        
        this.setupDatabase();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.seedInitialData();
    }

    setupDatabase() {
        const dbPath = path.join(__dirname, 'database');
        this.usersDb = new JsonDatabase(dbPath, 'users');
        console.log('User Service: Banco NoSQL inicializado');
    }

    async seedInitialData() {
        // Aguardar inicialização e criar usuário admin se não existir
        setTimeout(async () => {
            try {
                const existingUsers = await this.usersDb.find();
                
                if (existingUsers.length === 0) {
                    const adminPassword = await bcrypt.hash('admin123', 12);
                    
                    await this.usersDb.create({
                        id: uuidv4(),
                        email: 'admin@microservices.com',
                        username: 'admin',
                        password: adminPassword,
                        firstName: 'Administrador',
                        lastName: 'Sistema',
                        role: 'admin',
                        status: 'active'
                    });

                    console.log('Usuário administrador criado (admin@microservices.com / admin123)');
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
                const userCount = await this.usersDb.count();
                res.json({
                    service: this.serviceName,
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    version: '1.0.0',
                    database: {
                        type: 'JSON-NoSQL',
                        userCount: userCount
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
                service: 'User Service',
                version: '1.0.0',
                description: 'Microsserviço para gerenciamento de usuários com NoSQL',
                database: 'JSON-NoSQL',
                endpoints: [
                    'POST /auth/register',
                    'POST /auth/login', 
                    'POST /auth/validate',
                    'GET /users',
                    'GET /users/:id',
                    'PUT /users/:id',
                    'GET /search'
                ]
            });
        });

        // Auth routes
        this.app.post('/auth/register', this.register.bind(this));
        this.app.post('/auth/login', this.login.bind(this));
        this.app.post('/auth/validate', this.validateToken.bind(this));

        // User routes (protected)
        this.app.get('/users', this.authMiddleware.bind(this), this.getUsers.bind(this));
        this.app.get('/users/:id', this.authMiddleware.bind(this), this.getUser.bind(this));
        this.app.put('/users/:id', this.authMiddleware.bind(this), this.updateUser.bind(this));
        
        // Search route
        this.app.get('/search', this.authMiddleware.bind(this), this.searchUsers.bind(this));
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
            console.error('User Service Error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do serviço',
                service: this.serviceName
            });
        });
    }

    // Auth middleware
    authMiddleware(req, res, next) {
        const authHeader = req.header('Authorization');
        
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token obrigatório'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'user-secret');
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
    }

    // Register user
    async register(req, res) {
        try {
            const { email, username, password, firstName, lastName } = req.body;

            // Validações básicas
            if (!email || !username || !password || !firstName || !lastName) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos os campos são obrigatórios'
                });
            }

            // Verificar se usuário já existe
            const existingEmail = await this.usersDb.findOne({ email: email.toLowerCase() });
            const existingUsername = await this.usersDb.findOne({ username: username.toLowerCase() });

            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'Email já está em uso'
                });
            }

            if (existingUsername) {
                return res.status(409).json({
                    success: false,
                    message: 'Username já está em uso'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Criar usuário com schema NoSQL flexível
            const newUser = await this.usersDb.create({
                id: uuidv4(),
                email: email.toLowerCase(),
                username: username.toLowerCase(),
                password: hashedPassword,
                firstName,
                lastName,
                role: 'user',
                status: 'active',
                profile: {
                    bio: null,
                    avatar: null,
                    preferences: {
                        theme: 'light',
                        language: 'pt-BR'
                    }
                },
                metadata: {
                    registrationDate: new Date().toISOString(),
                    lastLogin: null,
                    loginCount: 0
                }
            });

            const { password: _, ...userWithoutPassword } = newUser;

            const token = jwt.sign(
                { 
                    id: newUser.id, 
                    email: newUser.email, 
                    username: newUser.username,
                    role: newUser.role 
                },
                process.env.JWT_SECRET || 'user-secret',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                message: 'Usuário criado com sucesso',
                data: { user: userWithoutPassword, token }
            });
        } catch (error) {
            console.error('Erro no registro:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Login user
    async login(req, res) {
        try {
            const { identifier, password } = req.body;

            if (!identifier || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Identificador e senha obrigatórios'
                });
            }

            const user = await this.usersDb.findOne({
                $or: [
                    { email: identifier.toLowerCase() },
                    { username: identifier.toLowerCase() }
                ]
            });

            if (!user || !await bcrypt.compare(password, user.password)) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciais inválidas'
                });
            }

            // Verificar se usuário está ativo
            if (user.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: 'Conta desativada'
                });
            }

            // Atualizar dados de login (demonstrando flexibilidade NoSQL)
            await this.usersDb.update(user.id, {
                'metadata.lastLogin': new Date().toISOString(),
                'metadata.loginCount': (user.metadata?.loginCount || 0) + 1
            });

            const { password: _, ...userWithoutPassword } = user;
            
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email, 
                    username: user.username,
                    role: user.role 
                },
                process.env.JWT_SECRET || 'user-secret',
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                data: { user: userWithoutPassword, token }
            });
        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Validate token
    async validateToken(req, res) {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token obrigatório'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'user-secret');
            const user = await this.usersDb.findById(decoded.id);

            if (!user || user.status !== 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário não encontrado ou inativo'
                });
            }

            const { password: _, ...userWithoutPassword } = user;

            res.json({
                success: true,
                message: 'Token válido',
                data: { user: userWithoutPassword }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
    }

    // Get users (com paginação)
    async getUsers(req, res) {
        try {
            const { page = 1, limit = 10, role, status } = req.query;
            const skip = (page - 1) * parseInt(limit);

            // Filtros NoSQL flexíveis
            const filter = {};
            if (role) filter.role = role;
            if (status) filter.status = status;

            const users = await this.usersDb.find(filter, {
                skip: skip,
                limit: parseInt(limit),
                sort: { createdAt: -1 }
            });

            // Remove passwords
            const safeUsers = users.map(user => {
                const { password, ...safeUser } = user;
                return safeUser;
            });

            const total = await this.usersDb.count(filter);

            res.json({
                success: true,
                data: safeUsers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Get user by ID
    async getUser(req, res) {
        try {
            const { id } = req.params;
            const user = await this.usersDb.findById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            // Verificar permissão (usuário só vê próprio perfil ou admin vê tudo)
            if (req.user.id !== id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            const { password, ...userWithoutPassword } = user;

            res.json({
                success: true,
                data: userWithoutPassword
            });
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Update user (demonstrando flexibilidade NoSQL)
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { firstName, lastName, email, bio, theme, language } = req.body;

            // Verificar permissão
            if (req.user.id !== id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            const user = await this.usersDb.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            // Updates flexíveis com schema NoSQL
            const updates = {};
            if (firstName) updates.firstName = firstName;
            if (lastName) updates.lastName = lastName;
            if (email) updates.email = email.toLowerCase();
            
            // Atualizar campos aninhados (demonstrando NoSQL)
            if (bio !== undefined) updates['profile.bio'] = bio;
            if (theme) updates['profile.preferences.theme'] = theme;
            if (language) updates['profile.preferences.language'] = language;

            const updatedUser = await this.usersDb.update(id, updates);
            const { password, ...userWithoutPassword } = updatedUser;

            res.json({
                success: true,
                message: 'Usuário atualizado com sucesso',
                data: userWithoutPassword
            });
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Search users (demonstrando busca NoSQL)
    async searchUsers(req, res) {
        try {
            const { q, limit = 10 } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro de busca "q" é obrigatório'
                });
            }

            // Busca full-text NoSQL
            const users = await this.usersDb.search(q, ['firstName', 'lastName', 'username', 'email']);
            
            // Filtrar apenas usuários ativos e remover passwords
            const safeUsers = users
                .filter(user => user.status === 'active')
                .slice(0, parseInt(limit))
                .map(user => {
                    const { password, ...safeUser } = user;
                    return safeUser;
                });

            res.json({
                success: true,
                data: {
                    query: q,
                    results: safeUsers,
                    total: safeUsers.length
                }
            });
        } catch (error) {
            console.error('Erro na busca de usuários:', error);
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
            endpoints: ['/health', '/auth/register', '/auth/login', '/users', '/search']
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
            console.log(`User Service iniciado na porta ${this.port}`);
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
    const userService = new UserService();
    userService.start();

    // Graceful shutdown
    process.on('SIGTERM', () => {
        serviceRegistry.unregister('user-service');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        serviceRegistry.unregister('user-service');
        process.exit(0);
    });
}

module.exports = UserService;
```

---

## **PASSO 4: Product Service com NoSQL**

### 4.1 Implementação (`services/product-service/server.js`)

```javascript
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

class ProductService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3002;
        this.serviceName = 'product-service';
        this.serviceUrl = `http://127.0.0.1:${this.port}`;
        
        this.setupDatabase();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.seedInitialData();
    }

    setupDatabase() {
        const dbPath = path.join(__dirname, 'database');
        this.productsDb = new JsonDatabase(dbPath, 'products');
        console.log('Product Service: Banco NoSQL inicializado');
    }

    async seedInitialData() {
        // Aguardar inicialização e criar produtos exemplo
        setTimeout(async () => {
            try {
                const existingProducts = await this.productsDb.find();
                
                if (existingProducts.length === 0) {
                    const sampleProducts = [
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

                    for (const product of sampleProducts) {
                        await this.productsDb.create(product);
                    }

                    console.log('Produtos de exemplo criados no Product Service');
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
                const productCount = await this.productsDb.count();
                const activeProducts = await this.productsDb.count({ active: true });
                
                res.json({
                    service: this.serviceName,
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    version: '1.0.0',
                    database: {
                        type: 'JSON-NoSQL',
                        productCount: productCount,
                        activeProducts: activeProducts
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
                service: 'Product Service',
                version: '1.0.0',
                description: 'Microsserviço para gerenciamento de produtos com NoSQL',
                database: 'JSON-NoSQL',
                endpoints: [
                    'GET /products',
                    'GET /products/:id',
                    'POST /products',
                    'PUT /products/:id',
                    'DELETE /products/:id',
                    'PUT /products/:id/stock',
                    'GET /categories',
                    'GET /search'
                ]
            });
        });

        // Product routes
        this.app.get('/products', this.getProducts.bind(this));
        this.app.get('/products/:id', this.getProduct.bind(this));
        this.app.post('/products', this.authMiddleware.bind(this), this.createProduct.bind(this));
        this.app.put('/products/:id', this.authMiddleware.bind(this), this.updateProduct.bind(this));
        this.app.delete('/products/:id', this.authMiddleware.bind(this), this.deleteProduct.bind(this));
        this.app.put('/products/:id/stock', this.authMiddleware.bind(this), this.updateStock.bind(this));

        // Category routes (extraídas dos produtos)
        this.app.get('/categories', this.getCategories.bind(this));

        // Search route
        this.app.get('/search', this.searchProducts.bind(this));
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
            console.error('Product Service Error:', error);
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

    // Get products (com filtros e paginação)
    async getProducts(req, res) {
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

            let products;
            
            // Se há busca por texto, usar método de search
            if (search) {
                products = await this.productsDb.search(search, ['name', 'description', 'tags']);
                // Aplicar outros filtros manualmente
                products = products.filter(product => {
                    for (const [key, value] of Object.entries(filter)) {
                        if (key === 'price') {
                            if (value.$gte && product.price < value.$gte) return false;
                            if (value.$lte && product.price > value.$lte) return false;
                        } else if (key.includes('.')) {
                            // Campos aninhados (ex: category.slug)
                            const keys = key.split('.');
                            const productValue = keys.reduce((obj, k) => obj?.[k], product);
                            if (productValue !== value) return false;
                        } else if (product[key] !== value) {
                            return false;
                        }
                    }
                    return true;
                });
                // Aplicar paginação manual
                products = products.slice(skip, skip + parseInt(limit));
            } else {
                products = await this.productsDb.find(filter, {
                    skip: skip,
                    limit: parseInt(limit),
                    sort: { createdAt: -1 }
                });
            }

            const total = await this.productsDb.count(filter);

            res.json({
                success: true,
                data: products,
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

    // Get product by ID
    async getProduct(req, res) {
        try {
            const { id } = req.params;
            const product = await this.productsDb.findById(id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado'
                });
            }

            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Create product (demonstrando schema NoSQL flexível)
    async createProduct(req, res) {
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
            const newProduct = await this.productsDb.create({
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
                data: newProduct
            });
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Update product (demonstrando flexibilidade NoSQL)
    async updateProduct(req, res) {
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

            const product = await this.productsDb.findById(id);
            if (!product) {
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
                updates.specifications = { ...product.specifications, ...specifications };
            }
            if (active !== undefined) updates.active = active;
            if (featured !== undefined) updates.featured = featured;

            // Adicionar metadata de atualização
            updates['metadata.lastUpdatedBy'] = req.user.id;
            updates['metadata.lastUpdatedByName'] = `${req.user.firstName} ${req.user.lastName}`;
            updates['metadata.lastUpdatedAt'] = new Date().toISOString();

            const updatedProduct = await this.productsDb.update(id, updates);

            res.json({
                success: true,
                message: 'Produto atualizado com sucesso',
                data: updatedProduct
            });
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Delete product (soft delete)
    async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            const product = await this.productsDb.findById(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado'
                });
            }

            // Soft delete - desativar produto
            await this.productsDb.update(id, { 
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

            const product = await this.productsDb.findById(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado'
                });
            }

            let newStock = product.stock;
            
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

            await this.productsDb.update(id, { 
                stock: newStock,
                'metadata.lastStockUpdate': new Date().toISOString(),
                'metadata.lastStockUpdateBy': req.user.id
            });

            res.json({
                success: true,
                message: 'Estoque atualizado com sucesso',
                data: {
                    productId: id,
                    previousStock: product.stock,
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
            const products = await this.productsDb.find({ active: true });
            
            // Extrair categorias únicas dos produtos (demonstrando flexibilidade NoSQL)
            const categoriesMap = new Map();
            products.forEach(product => {
                if (product.category) {
                    const key = product.category.slug || product.category.name;
                    if (!categoriesMap.has(key)) {
                        categoriesMap.set(key, {
                            name: product.category.name,
                            slug: product.category.slug || product.category.name.toLowerCase().replace(/\s+/g, '-'),
                            productCount: 0
                        });
                    }
                    categoriesMap.get(key).productCount++;
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

    // Search products (demonstrando busca NoSQL)
    async searchProducts(req, res) {
        try {
            const { q, limit = 20, category } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro de busca "q" é obrigatório'
                });
            }

            // Busca full-text NoSQL
            let products = await this.productsDb.search(q, ['name', 'description', 'tags']);
            
            // Filtrar apenas produtos ativos
            products = products.filter(product => product.active);

            // Filtrar por categoria se especificada
            if (category) {
                products = products.filter(product => 
                    product.category?.slug === category || product.category?.name === category
                );
            }

            // Aplicar limite
            products = products.slice(0, parseInt(limit));

            res.json({
                success: true,
                data: {
                    query: q,
                    category: category || null,
                    results: products,
                    total: products.length
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
            endpoints: ['/health', '/products', '/categories', '/search']
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
            console.log(`Product Service iniciado na porta ${this.port}`);
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
    const productService = new ProductService();
    productService.start();

    // Graceful shutdown
    process.on('SIGTERM', () => {
        serviceRegistry.unregister('product-service');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        serviceRegistry.unregister('product-service');
        process.exit(0);
    });
}

module.exports = ProductService;
```

---

## **PASSO 5: API Gateway**

### 5.1 Implementação (`api-gateway/server.js`)

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');

// Importar service registry
const serviceRegistry = require('../shared/serviceRegistry');

class APIGateway {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        
        // Circuit breaker simples
        this.circuitBreakers = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        setTimeout(() => {
            this.startHealthChecks();
        }, 3000); // Aguardar 3 segundos antes de iniciar health checks
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan('combined'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Gateway headers
        this.app.use((req, res, next) => {
            res.setHeader('X-Gateway', 'api-gateway');
            res.setHeader('X-Gateway-Version', '1.0.0');
            res.setHeader('X-Architecture', 'Microservices-NoSQL');
            next();
        });

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${req.method} ${req.originalUrl} - ${req.ip}`);
            next();
        });
    }

    setupRoutes() {
        // Gateway health check
        this.app.get('/health', (req, res) => {
            const services = serviceRegistry.listServices();
            res.json({
                service: 'api-gateway',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                architecture: 'Microservices with NoSQL',
                services: services,
                serviceCount: Object.keys(services).length
            });
        });

        // Gateway info
        this.app.get('/', (req, res) => {
            res.json({
                service: 'API Gateway',
                version: '1.0.0',
                description: 'Gateway para microsserviços com NoSQL',
                architecture: 'Microservices with NoSQL databases',
                database_approach: 'Database per Service (JSON-NoSQL)',
                endpoints: {
                    users: '/api/users/*',
                    products: '/api/products/*',
                    health: '/health',
                    registry: '/registry',
                    dashboard: '/api/dashboard',
                    search: '/api/search'
                },
                services: serviceRegistry.listServices()
            });
        });

        // Service registry endpoint
        this.app.get('/registry', (req, res) => {
            const services = serviceRegistry.listServices();
            res.json({
                success: true,
                services: services,
                count: Object.keys(services).length,
                timestamp: new Date().toISOString()
            });
        });

        // Debug endpoint para troubleshooting
        this.app.get('/debug/services', (req, res) => {
            serviceRegistry.debugListServices();
            res.json({
                success: true,
                services: serviceRegistry.listServices(),
                stats: serviceRegistry.getStats()
            });
        });

        // User Service routes - CORRIGIDO
        this.app.use('/api/users', (req, res, next) => {
            console.log(`🔗 Roteando para user-service: ${req.method} ${req.originalUrl}`);
            this.proxyRequest('user-service', req, res, next);
        });

        // Product Service routes - CORRIGIDO  
        this.app.use('/api/products', (req, res, next) => {
            console.log(`🔗 Roteando para product-service: ${req.method} ${req.originalUrl}`);
            this.proxyRequest('product-service', req, res, next);
        });

        // Endpoints agregados
        this.app.get('/api/dashboard', this.getDashboard.bind(this));
        this.app.get('/api/search', this.globalSearch.bind(this));
    }
    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint não encontrado',
                service: 'api-gateway',
                availableEndpoints: {
                    users: '/api/users',
                    products: '/api/products',
                    dashboard: '/api/dashboard',
                    search: '/api/search'
                }
            });
        });

        // Error handler
        this.app.use((error, req, res, next) => {
            console.error('Gateway Error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do gateway',
                service: 'api-gateway'
            });
        });
    }

    // Proxy request to service
    async proxyRequest(serviceName, req, res, next) {
        try {
            console.log(`🔄 Proxy request: ${req.method} ${req.originalUrl} -> ${serviceName}`);
            
            // Verificar circuit breaker
            if (this.isCircuitOpen(serviceName)) {
                console.log(`⚡ Circuit breaker open for ${serviceName}`);
                return res.status(503).json({
                    success: false,
                    message: `Serviço ${serviceName} temporariamente indisponível`,
                    service: serviceName
                });
            }

            // Descobrir serviço com debug
            let service;
            try {
                service = serviceRegistry.discover(serviceName);
            } catch (error) {
                console.error(`❌ Erro na descoberta do serviço ${serviceName}:`, error.message);
                
                // Debug: listar serviços disponíveis
                const availableServices = serviceRegistry.listServices();
                console.log(`📋 Serviços disponíveis:`, Object.keys(availableServices));
                
                return res.status(503).json({
                    success: false,
                    message: `Serviço ${serviceName} não encontrado`,
                    service: serviceName,
                    availableServices: Object.keys(availableServices)
                });
            }
            
            // Construir URL de destino corrigida
            const originalPath = req.originalUrl;
            let targetPath = '';
            
            // Extrair o path correto baseado no serviço
            if (serviceName === 'user-service') {
                // /api/users/auth/login -> /auth/login
                // /api/users -> /users
                // /api/users/123 -> /users/123
                targetPath = originalPath.replace('/api/users', '');
                if (!targetPath.startsWith('/')) {
                    targetPath = '/' + targetPath;
                }
                // Se path vazio, usar /users
                if (targetPath === '/' || targetPath === '') {
                    targetPath = '/users';
                }
            } else if (serviceName === 'product-service') {
                // /api/products -> /products
                // /api/products/123 -> /products/123
                targetPath = originalPath.replace('/api/products', '');
                if (!targetPath.startsWith('/')) {
                    targetPath = '/' + targetPath;
                }
                // Se path vazio, usar /products
                if (targetPath === '/' || targetPath === '') {
                    targetPath = '/products';
                }
            }
            
            const targetUrl = `${service.url}${targetPath}`;
            
            console.log(`🎯 Target URL: ${targetUrl}`);
            
            // Configurar requisição
            const config = {
                method: req.method,
                url: targetUrl,
                headers: { ...req.headers },
                timeout: 10000,
                family: 4,  // Força IPv4
                validateStatus: function (status) {
                    return status < 500; // Aceitar todos os status < 500
                }
            };

            // Adicionar body para requisições POST/PUT/PATCH
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                config.data = req.body;
            }

            // Adicionar query parameters
            if (Object.keys(req.query).length > 0) {
                config.params = req.query;
            }

            // Remover headers problemáticos
            delete config.headers.host;
            delete config.headers['content-length'];

            console.log(`📤 Enviando ${req.method} para ${targetUrl}`);

            // Fazer requisição
            const response = await axios(config);
            
            // Resetar circuit breaker em caso de sucesso
            this.resetCircuitBreaker(serviceName);
            
            console.log(`📥 Resposta recebida: ${response.status}`);
            
            // Retornar resposta
            res.status(response.status).json(response.data);

        } catch (error) {
            // Registrar falha
            this.recordFailure(serviceName);
            
            console.error(`❌ Proxy error for ${serviceName}:`, {
                message: error.message,
                code: error.code,
                url: error.config?.url,
                status: error.response?.status
            });
            
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                res.status(503).json({
                    success: false,
                    message: `Serviço ${serviceName} indisponível`,
                    service: serviceName,
                    error: error.code
                });
            } else if (error.response) {
                // Encaminhar resposta de erro do serviço
                console.log(`🔄 Encaminhando erro ${error.response.status} do serviço`);
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Erro interno do gateway',
                    service: 'api-gateway',
                    error: error.message
                });
            }
        }
    }
    // Circuit Breaker 
    isCircuitOpen(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (!breaker) return false;

        const now = Date.now();
        
        // Verificar se o circuito deve ser meio-aberto
        if (breaker.isOpen && (now - breaker.lastFailure) > 30000) { // 30 segundos
            breaker.isOpen = false;
            breaker.isHalfOpen = true;
            console.log(`Circuit breaker half-open for ${serviceName}`);
            return false;
        }

        return breaker.isOpen;
    }

    recordFailure(serviceName) {
        let breaker = this.circuitBreakers.get(serviceName) || {
            failures: 0,
            isOpen: false,
            isHalfOpen: false,
            lastFailure: null
        };

        breaker.failures++;
        breaker.lastFailure = Date.now();

        // Abrir circuito após 3 falhas
        if (breaker.failures >= 3) {
            breaker.isOpen = true;
            breaker.isHalfOpen = false;
            console.log(`Circuit breaker opened for ${serviceName}`);
        }

        this.circuitBreakers.set(serviceName, breaker);
    }

    resetCircuitBreaker(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (breaker) {
            breaker.failures = 0;
            breaker.isOpen = false;
            breaker.isHalfOpen = false;
            console.log(`Circuit breaker reset for ${serviceName}`);
        }
    }

    // Dashboard agregado
    async getDashboard(req, res) {
        try {
            const authHeader = req.header('Authorization');
            
            if (!authHeader) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de autenticação obrigatório'
                });
            }

            // Buscar dados de múltiplos serviços
            const [userResponse, productsResponse, categoriesResponse] = await Promise.allSettled([
                this.callService('user-service', '/users', 'GET', authHeader, { limit: 5 }),
                this.callService('product-service', '/products', 'GET', null, { limit: 5 }),
                this.callService('product-service', '/categories', 'GET', null, {})
            ]);

            const dashboard = {
                timestamp: new Date().toISOString(),
                architecture: 'Microservices with NoSQL',
                database_approach: 'Database per Service',
                services_status: serviceRegistry.listServices(),
                data: {
                    users: {
                        available: userResponse.status === 'fulfilled',
                        data: userResponse.status === 'fulfilled' ? userResponse.value.data : null,
                        error: userResponse.status === 'rejected' ? userResponse.reason.message : null
                    },
                    products: {
                        available: productsResponse.status === 'fulfilled',
                        data: productsResponse.status === 'fulfilled' ? productsResponse.value.data : null,
                        error: productsResponse.status === 'rejected' ? productsResponse.reason.message : null
                    },
                    categories: {
                        available: categoriesResponse.status === 'fulfilled',
                        data: categoriesResponse.status === 'fulfilled' ? categoriesResponse.value.data : null,
                        error: categoriesResponse.status === 'rejected' ? categoriesResponse.reason.message : null
                    }
                }
            };

            res.json({
                success: true,
                data: dashboard
            });

        } catch (error) {
            console.error('Erro no dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao agregar dados do dashboard'
            });
        }
    }

    // Busca global entre serviços
    async globalSearch(req, res) {
        try {
            const { q } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro de busca "q" é obrigatório'
                });
            }

            // Buscar em produtos e usuários (se autenticado)
            const authHeader = req.header('Authorization');
            const searches = [
                this.callService('product-service', '/search', 'GET', null, { q })
            ];

            // Adicionar busca de usuários se autenticado
            if (authHeader) {
                searches.push(
                    this.callService('user-service', '/search', 'GET', authHeader, { q, limit: 5 })
                );
            }

            const [productResults, userResults] = await Promise.allSettled(searches);

            const results = {
                query: q,
                products: {
                    available: productResults.status === 'fulfilled',
                    results: productResults.status === 'fulfilled' ? productResults.value.data.results : [],
                    error: productResults.status === 'rejected' ? productResults.reason.message : null
                }
            };

            // Adicionar resultados de usuários se a busca foi feita
            if (userResults) {
                results.users = {
                    available: userResults.status === 'fulfilled',
                    results: userResults.status === 'fulfilled' ? userResults.value.data.results : [],
                    error: userResults.status === 'rejected' ? userResults.reason.message : null
                };
            }

            res.json({
                success: true,
                data: results
            });

        } catch (error) {
            console.error('Erro na busca global:', error);
            res.status(500).json({
                success: false,
                message: 'Erro na busca'
            });
        }
    }

    // Helper para chamar serviços
    async callService(serviceName, path, method = 'GET', authHeader = null, params = {}) {
        const service = serviceRegistry.discover(serviceName);
        
        const config = {
            method,
            url: `${service.url}${path}`,
            timeout: 5000
        };

        if (authHeader) {
            config.headers = { Authorization: authHeader };
        }

        if (method === 'GET' && Object.keys(params).length > 0) {
            config.params = params;
        }

        const response = await axios(config);
        return response.data;
    }

    // Health checks para serviços registrados
    startHealthChecks() {
        setInterval(async () => {
            await serviceRegistry.performHealthChecks();
        }, 30000); // A cada 30 segundos

        // Health check inicial
        setTimeout(async () => {
            await serviceRegistry.performHealthChecks();
        }, 5000);
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('=====================================');
            console.log(`API Gateway iniciado na porta ${this.port}`);
            console.log(`URL: http://localhost:${this.port}`);
            console.log(`Health: http://localhost:${this.port}/health`);
            console.log(`Registry: http://localhost:${this.port}/registry`);
            console.log(`Dashboard: http://localhost:${this.port}/api/dashboard`);
            console.log(`Architecture: Microservices with NoSQL`);
            console.log('=====================================');
            console.log('Rotas disponíveis:');
            console.log('   POST /api/auth/register');
            console.log('   POST /api/auth/login');
            console.log('   GET  /api/users');
            console.log('   GET  /api/products');
            console.log('   GET  /api/search?q=termo');
            console.log('   GET  /api/dashboard');
            console.log('=====================================');
        });
    }
}

// Start gateway
if (require.main === module) {
    const gateway = new APIGateway();
    gateway.start();

    // Graceful shutdown
    process.on('SIGTERM', () => process.exit(0));
    process.on('SIGINT', () => process.exit(0));
}

module.exports = APIGateway;
```

---

## **PASSO 6: Cliente de Demonstração**

### 6.1 Cliente (`client-demo.js`)

```javascript
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
```

---

## **PASSO 7: Execução e Teste**

### 7.1 Comandos de Execução

```bash
# 1. Instalar dependências principais
npm install

# 2. Executar todos os serviços
npm start

# 3. Em outro terminal, executar demonstração
npm run demo

# 4. Verificar saúde dos serviços
npm run health
```

### 7.2 Execução Manual (Desenvolvimento)

```bash
# Terminal 1 - User Service
cd services/user-service
npm start

# Terminal 2 - Product Service  
cd services/product-service
npm start

# Terminal 3 - API Gateway
cd api-gateway
npm start

# Terminal 4 - Cliente Demo
node client-demo.js
```

### 7.3 Testes com cURL

```bash
# Health Check
curl http://localhost:3000/health

# Service Registry
curl http://localhost:3000/registry

# Registrar usuário
curl -X POST http://localhost:3000/api/users/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "123456",
    "firstName": "Test",
    "lastName": "User"
  }'

# Listar produtos
curl http://localhost:3000/api/products

# Buscar produtos
curl "http://localhost:3000/api/search?q=smartphone"

# Dashboard (com token)
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## **PASSO 8: Estrutura Final do Projeto**

```
lab03-microservices-nosql/
├── package.json                    # Scripts principais
├── client-demo.js                  # Cliente de demonstração
├── README.md                       # Documentação
├── shared/
│   ├── JsonDatabase.js             # Banco NoSQL genérico
│   └── serviceRegistry.js          # Service discovery
├── services/
│   ├── user-service/
│   │   ├── server.js               # User Service
│   │   ├── package.json
│   │   └── database/               # Banco NoSQL do User Service
│   │       ├── users.json          # Coleção de usuários
│   │       └── users_index.json    # Índice
│   └── product-service/
│       ├── server.js               # Product Service  
│       ├── package.json
│       └── database/               # Banco NoSQL do Product Service
│           ├── products.json       # Coleção de produtos
│           └── products_index.json # Índice de produtos
└── api-gateway/
    ├── server.js                   # API Gateway
    └── package.json
```

### 8.1 Portas e Endpoints

| Serviço | Porta | URL |
|---------|-------|-----|
| API Gateway | 3000 | http://localhost:3000 |
| User Service | 3001 | http://localhost:3001 |
| Product Service | 3002 | http://localhost:3002 |

---

## **Análise dos Padrões Implementados**

### ✅ Database per Service com NoSQL

- **Isolamento completo**: Cada serviço possui seu próprio banco
- **JSON-based storage**: Armazenamento baseado em documentos JSON
- **Schema flexível**: Estrutura de dados adaptável
- **Busca de texto**: Capacidades de full-text search
- **Indexação automática**: Índices para performance

### ✅ Padrões Arquiteturais

- **Service Discovery**: Registry centralizado simples
- **API Gateway Pattern**: Ponto único de entrada
- **Circuit Breaker Pattern**: Proteção contra falhas
- **Aggregator Pattern**: Dashboard com dados consolidados
- **Inter-Service Communication**: REST entre microsserviços

### ✅ Recursos NoSQL Demonstrados

- **Documentos JSON**: Estrutura flexível de dados
- **Queries complexas**: Filtros, ordenação, paginação
- **Full-text search**: Busca em múltiplos campos
- **Operadores especiais**: $regex, $in, $gt, $lt, $or
- **Campos aninhados**: Objetos complexos (profile, metadata)

---

## **Conclusão**

Esta implementação demonstra os fundamentos dos microsserviços com bancos NoSQL independentes, proporcionando:

- **Isolamento de dados** por contexto de serviço
- **Flexibilidade** de schema e estrutura
- **Simplicidade** de desenvolvimento e manutenção
- **Performance** adequada para aplicações web
- **Base sólida** para evolução arquitetural

O uso de bancos NoSQL baseados em JSON oferece uma abordagem pragmática para o aprendizado de microsserviços, eliminando a complexidade de SGBDs tradicionais enquanto mantém os conceitos fundamentais da arquitetura distribuída.

### Guia de Troubleshooting e Reset do Sistema

---

#### Problemas Comuns e Soluções

1. Service Registry não Encontra Serviços

**Sintomas:**
- Erro: "Serviço não encontrado: product-service"
- Gateway registra serviços mas não consegue descobri-los
- Requisições via gateway falham com 503

**Causa:** Cada processo Node.js cria sua própria instância em memória do Service Registry

**Solução:** Usar Service Registry baseado em arquivo compartilhado

---

#### Script de Reset Automático

##### reset-services.js

Crie o arquivo `reset-services.js` na raiz do projeto:

```javascript
#!/usr/bin/env node

// reset-services.js - Script para limpar e testar o sistema
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function resetAndTest() {
    console.log('='.repeat(60));
    console.log('RESET E TESTE DO SISTEMA DE MICROSSERVIÇOS');
    console.log('='.repeat(60));

    // 1. Limpar registry file
    console.log('\n1. Limpando Service Registry...');
    const registryFile = path.join(__dirname, 'shared', 'services-registry.json');
    
    if (fs.existsSync(registryFile)) {
        fs.unlinkSync(registryFile);
        console.log('Registry file removido:', registryFile);
    } else {
        console.log('Registry file não encontrado');
    }

    // 2. Criar novo registry vazio
    fs.writeFileSync(registryFile, '{}');
    console.log('Novo registry file criado');

    // 3. Aguardar serviços iniciarem
    console.log('\n2. Aguardando serviços iniciarem...');
    console.log('Por favor, inicie os serviços em ordem:');
    console.log('   Terminal 1: cd services/user-service && npm start');
    console.log('   Terminal 2: cd services/product-service && npm start');
    console.log('   Terminal 3: cd api-gateway && npm start');
    console.log('\nPressione Enter quando todos estiverem rodando...');
    
    // Aguardar input do usuário
    await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
    });

    // 4. Verificar serviços
    console.log('\n3. Verificando serviços...');
    
    const services = [
        { name: 'User Service', url: 'http://127.0.0.1:3001/health' },
        { name: 'Product Service', url: 'http://127.0.0.1:3002/health' },
        { name: 'API Gateway', url: 'http://127.0.0.1:3000/health' }
    ];

    let allHealthy = true;
    for (const service of services) {
        try {
            const response = await axios.get(service.url, { 
                timeout: 5000, 
                family: 4 
            });
            console.log(`✅ ${service.name}: OK (${response.status})`);
        } catch (error) {
            console.log(`❌ ${service.name}: ERRO - ${error.message}`);
            allHealthy = false;
        }
    }

    if (!allHealthy) {
        console.log('\n❌ Nem todos os serviços estão saudáveis. Verifique os logs.');
        return;
    }

    // 5. Aguardar registro
    console.log('\n4. Aguardando registro dos serviços...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 6. Verificar registry
    console.log('\n5. Verificando Service Registry...');
    try {
        const registryResponse = await axios.get('http://127.0.0.1:3000/registry', { 
            timeout: 5000, 
            family: 4 
        });
        
        const registeredServices = registryResponse.data.services;
        console.log(`📊 Serviços registrados: ${Object.keys(registeredServices).length}`);
        
        Object.entries(registeredServices).forEach(([name, info]) => {
            const status = info.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY';
            console.log(`   ${name}: ${status} - ${info.url} (PID: ${info.pid})`);
        });
        
        // Verificar serviços esperados
        const expectedServices = ['user-service', 'product-service'];
        const missing = expectedServices.filter(s => !registeredServices[s]);
        
        if (missing.length > 0) {
            console.log(`❌ Serviços não registrados: ${missing.join(', ')}`);
            return;
        }
        
        console.log('✅ Todos os serviços esperados estão registrados');
        
    } catch (error) {
        console.log(`❌ Erro ao verificar registry: ${error.message}`);
        return;
    }

    // 7. Testar comunicação
    console.log('\n6. Testando comunicação...');
    
    // Teste direto
    try {
        const directResponse = await axios.get('http://127.0.0.1:3002/products', { 
            timeout: 5000, 
            family: 4 
        });
        console.log(`✅ Acesso direto ao Product Service: OK (${directResponse.status})`);
    } catch (error) {
        console.log(`❌ Acesso direto falhou: ${error.message}`);
        return;
    }

    // Teste via gateway
    try {
        const gatewayResponse = await axios.get('http://127.0.0.1:3000/api/products', { 
            timeout: 5000, 
            family: 4 
        });
        console.log(`✅ Acesso via Gateway: OK (${gatewayResponse.status})`);
        console.log(`📦 Produtos retornados: ${gatewayResponse.data.data?.length || 0}`);
    } catch (error) {
        console.log(`❌ Acesso via Gateway falhou: ${error.response?.status || 'NO_RESPONSE'}`);
        console.log(`   Erro: ${error.response?.data?.message || error.message}`);
        return;
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Sistema de microsserviços funcionando corretamente');
    console.log('='.repeat(60));
}

// Função para verificar status do registry
function showRegistryStatus() {
    const registryFile = path.join(__dirname, 'shared', 'services-registry.json');
    
    console.log('\nStatus do Registry File:');
    console.log('Arquivo:', registryFile);
    
    if (fs.existsSync(registryFile)) {
        try {
            const content = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
            console.log('Conteúdo:', JSON.stringify(content, null, 2));
        } catch (error) {
            console.log('Erro ao ler arquivo:', error.message);
        }
    } else {
        console.log('Arquivo não existe');
    }
}

// Função para limpar registry
function clearRegistry() {
    const registryFile = path.join(__dirname, 'shared', 'services-registry.json');
    if (fs.existsSync(registryFile)) {
        fs.unlinkSync(registryFile);
        console.log('Registry limpo');
    }
    fs.writeFileSync(registryFile, '{}');
    console.log('Novo registry criado');
}

// Executar baseado no argumento
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'status') {
        showRegistryStatus();
    } else if (command === 'clear') {
        clearRegistry();
    } else {
        resetAndTest().catch(console.error);
    }
}

module.exports = { resetAndTest, showRegistryStatus, clearRegistry };
```

---

#### Como Usar o Script de Reset

1. Comandos Disponíveis

```bash
# Teste completo automatizado
node reset-services.js

# Verificar status do registry
node reset-services.js status

# Limpar registry apenas
node reset-services.js clear
```

2. Procedimento de Reset Completo

1. **Pare todos os serviços** (Ctrl+C em todos os terminais)

2. **Limpe o registry:**
   ```bash
   node reset-services.js clear
   ```

3. **Inicie os serviços em ordem:**
   ```bash
   # Terminal 1
   cd services/user-service && npm start

   # Terminal 2 (aguarde 3 segundos)
   cd services/product-service && npm start

   # Terminal 3 (aguarde 3 segundos) 
   cd api-gateway && npm start
   ```

4. **Execute o teste:**
   ```bash
   node reset-services.js
   ```

---

#### Scripts de Package.json

Adicione estes scripts ao `package.json` principal:

```json
{
  "scripts": {
    "reset": "node reset-services.js",
    "reset:clear": "node reset-services.js clear",
    "reset:status": "node reset-services.js status",
    "test:system": "node reset-services.js",
    "debug:registry": "curl -s http://127.0.0.1:3000/registry | json_pp",
    "debug:health": "curl -s http://127.0.0.1:3000/health | json_pp"
  }
}
```

---

#### Verificações de Debug

1. Verificar Serviços Individuais

```bash
# Health checks diretos
curl http://127.0.0.1:3001/health  # User Service
curl http://127.0.0.1:3002/health  # Product Service
curl http://127.0.0.1:3000/health  # API Gateway
```

2. Verificar Service Registry

```bash
# Status do registry
curl http://127.0.0.1:3000/registry

# Debug de serviços
curl http://127.0.0.1:3000/debug/services
```

3. Teste de Comunicação

```bash
# Acesso direto
curl http://127.0.0.1:3002/products

# Via gateway
curl http://127.0.0.1:3000/api/products
```

---

#### Troubleshooting por Categoria

##### Problema: Service Registry vazio

**Verificação:**
```bash
node reset-services.js status
```

**Solução:**
```bash
node reset-services.js clear
# Reiniciar todos os serviços
```

##### Problema: Gateway não encontra serviços

**Verificação:**
```bash
curl http://127.0.0.1:3000/registry
```

**Soluções:**
1. Verificar se arquivo `shared/services-registry.json` existe
2. Verificar se serviços estão usando Service Registry baseado em arquivo
3. Aguardar 3-5 segundos após iniciar cada serviço

##### Problema: IPv6 vs IPv4

**Sintomas:** Erro de conexão mesmo com serviços rodando

**Solução:** Verificar se todas as URLs usam `127.0.0.1` (IPv4) em vez de `localhost`

---

#### Logs de Debug Recomendados

Adicione estas linhas nos serviços para debug:

```javascript
// No registro do serviço
console.log('Registrando serviço:', serviceName, serviceUrl);

// Na descoberta
console.log('Procurando serviço:', serviceName);
console.log('Serviços disponíveis:', Object.keys(services));

// No proxy do gateway
console.log('Proxy request:', method, originalUrl, '->', targetUrl);
```

---

#### Considerações Importantes

1. **Ordem de inicialização:** User Service → Product Service → API Gateway
2. **Timing:** Aguardar 3 segundos entre cada serviço
3. **Cleanup:** Script remove automaticamente serviços por PID ao encerrar
4. **IPv4:** Todas as URLs devem usar `127.0.0.1`
5. **Arquivo compartilhado:** Registry agora persiste em `shared/services-registry.json`
