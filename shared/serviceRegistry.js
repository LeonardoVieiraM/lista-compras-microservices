const fs = require("fs-extra");
const path = require("path");

const REGISTRY_FILE = path.join(__dirname, "service-registry.json");

class ServiceRegistry {
  constructor() {
    this.initializeRegistry();
  }

  initializeRegistry() {
    try {
      console.log(`Registry file path: ${REGISTRY_FILE}`);
      if (!fs.existsSync(REGISTRY_FILE)) {
        fs.writeJsonSync(REGISTRY_FILE, {}, { spaces: 2 });
        console.log("Arquivo registry criado:", REGISTRY_FILE);
      } else {
        console.log("Arquivo registry já existe:", REGISTRY_FILE);
      }
    } catch (error) {
      console.error("Erro ao inicializar registry:", error.message);
      console.error("Stack:", error.stack);
    }
  }

  async #readRegistry() {
    try {
      if (!fs.existsSync(REGISTRY_FILE)) {
        return {};
      }

      const fileContent = fs.readFileSync(REGISTRY_FILE, "utf8");
      if (!fileContent.trim()) {
        return {};
      }

      const data = JSON.parse(fileContent);
      console.log("Registry content:", Object.keys(data));
      return data;
    } catch (error) {
      console.error("Erro ao ler registry:", error.message);
      return {};
    }
  }

  async #writeRegistry(services) {
    try {
      fs.writeJsonSync(REGISTRY_FILE, services, { spaces: 2 });
    } catch (error) {
      console.error("Erro ao salvar registry:", error.message);
    }
  }

  async register(serviceName, serviceInfo) {
    try {
      console.log(`=== REGISTRO DE SERVIÇO ===`);
      console.log(`Serviço: ${serviceName}`);
      console.log(`URL: ${serviceInfo.url}`);
      console.log(`Caminho do arquivo: ${REGISTRY_FILE}`);

      const services = await this.#readRegistry();
      console.log(`Registry atual:`, Object.keys(services));

      services[serviceName] = {
        ...serviceInfo,
        registeredAt: new Date().toISOString(),
        lastHealthCheck: new Date().toISOString(),
        healthy: true,
      };

      await this.#writeRegistry(services);
      console.log(`✅ Serviço ${serviceName} registrado com sucesso!`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao registrar ${serviceName}:`, error.message);
      console.error(error.stack);
      return false;
    }
  }

  async discover(serviceName) {
    try {
      const services = await this.#readRegistry();
      console.log(`Services in registry:`, Object.keys(services));

      const service = services[serviceName];

      if (!service) {
        console.warn(`Serviço não encontrado no registry: ${serviceName}`);
        return null;
      }

      if (!service.healthy) {
        console.warn(`Serviço não saudável: ${serviceName}`);
        return null;
      }

      console.log(`Serviço encontrado: ${serviceName} -> ${service.url}`);
      return service;
    } catch (error) {
      console.error("Erro ao descobrir serviço:", error.message);
      return null;
    }
  }

  async updateHealth(serviceName, isHealthy) {
    try {
      const services = await this.#readRegistry();

      if (services[serviceName]) {
        services[serviceName].healthy = isHealthy;
        services[serviceName].lastHealthCheck = new Date().toISOString();

        await this.#writeRegistry(services);

        if (!isHealthy) {
          console.warn(`Serviço marcado como não saudável: ${serviceName}`);
        } else {
          console.log(`Serviço marcado como saudável: ${serviceName}`);
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao atualizar saúde do serviço:", error.message);
      return false;
    }
  }

  async getAllServices() {
    try {
      const services = await this.#readRegistry();
      console.log(
        "🔄 getAllServices - Services no registry:",
        Object.keys(services)
      );
      return services;
    } catch (error) {
      console.error("❌ Erro ao obter todos os serviços:", error.message);
      console.error(error.stack);
      return {};
    }
  }

  async cleanup() {
    try {
      const services = await this.#readRegistry();
      const now = new Date();
      let cleaned = false;

      for (const [serviceName, serviceInfo] of Object.entries(services)) {
        const lastCheck = new Date(serviceInfo.lastHealthCheck);
        const diffMinutes = (now - lastCheck) / (1000 * 60);

        if (diffMinutes > 2) {
          console.log(`Removendo serviço inativo: ${serviceName}`);
          delete services[serviceName];
          cleaned = true;
        }
      }

      if (cleaned) {
        await this.#writeRegistry(services);
      }

      return cleaned;
    } catch (error) {
      console.error("Erro na limpeza do registry:", error.message);
      return false;
    }
  }
}

// Singleton instance - mas agora funciona apenas com arquivo
const serviceRegistry = new ServiceRegistry();

// Limpeza regular de serviços inativos
setInterval(() => {
  serviceRegistry.cleanup();
}, 60000);

module.exports = serviceRegistry;
