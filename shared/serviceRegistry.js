const fs = require('fs-extra');
const path = require('path');

class ServiceRegistry {
    constructor() {
        this.registryFile = path.join(__dirname, 'service-registry.json');
        this.services = {};
        this.initializeRegistry();
    }
    
    initializeRegistry() {
        try {
            if (fs.existsSync(this.registryFile)) {
                this.services = fs.readJsonSync(this.registryFile);
            } else {
                this.services = {};
                this.saveRegistry();
            }
        } catch (error) {
            console.error('Error initializing service registry:', error);
            this.services = {};
        }
    }
    
    saveRegistry() {
        try {
            fs.writeJsonSync(this.registryFile, this.services, { spaces: 2 });
        } catch (error) {
            console.error('Error saving service registry:', error);
        }
    }
    
    register(serviceName, serviceInfo) {
        console.log(`Registrando serviço: ${serviceName} - ${serviceInfo.url}`);
        
        this.services[serviceName] = {
            ...serviceInfo,
            registeredAt: new Date().toISOString(),
            lastHealthCheck: new Date().toISOString(),
            healthy: true
        };
        
        this.saveRegistry();
        return true;
    }
    
    unregister(serviceName) {
        if (this.services[serviceName]) {
            console.log(`Removendo serviço: ${serviceName}`);
            delete this.services[serviceName];
            this.saveRegistry();
            return true;
        }
        return false;
    }
    
    discover(serviceName) {
        const service = this.services[serviceName];
        
        if (!service) {
            console.warn(`Serviço não encontrado: ${serviceName}`);
            return null;
        }
        
        if (!service.healthy) {
            console.warn(`Serviço não saudável: ${serviceName}`);
            return null;
        }
        
        return service;
    }
    
    updateHealth(serviceName, isHealthy) {
        if (this.services[serviceName]) {
            this.services[serviceName].healthy = isHealthy;
            this.services[serviceName].lastHealthCheck = new Date().toISOString();
            this.saveRegistry();
            
            if (!isHealthy) {
                console.warn(`Serviço marcado como não saudável: ${serviceName}`);
            } else {
                console.log(`Serviço marcado como saudável: ${serviceName}`);
            }
            
            return true;
        }
        return false;
    }
    
    getAllServices() {
        return { ...this.services };
    }
    
    cleanup() {
        const now = new Date();
        let cleaned = false;
        
        for (const [serviceName, serviceInfo] of Object.entries(this.services)) {
            const lastCheck = new Date(serviceInfo.lastHealthCheck);
            const diffMinutes = (now - lastCheck) / (1000 * 60);
            
            // Remove services that haven't reported health in 2 minutes
            if (diffMinutes > 2) {
                console.log(`Removendo serviço inativo: ${serviceName}`);
                delete this.services[serviceName];
                cleaned = true;
            }
        }
        
        if (cleaned) {
            this.saveRegistry();
        }
        
        return cleaned;
    }
}

// Singleton instance
const serviceRegistry = new ServiceRegistry();

// Regular cleanup of inactive services
setInterval(() => {
    serviceRegistry.cleanup();
}, 60000); // Cleanup every minute

module.exports = serviceRegistry;