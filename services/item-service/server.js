const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const axios = require("axios");

// Importar banco NoSQL e service registry
const JsonDatabase = require("../../shared/JsonDatabase");
const serviceRegistry = require("../../shared/serviceRegistry");

console.log("Item Service iniciando...");
console.log("Porta:", process.env.PORT || 3003);

class ItemService {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3003;
    this.serviceName = "item-service";
    this.serviceUrl = `http://localhost:${this.port}`;

    this.setupDatabase();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupDatabase() {
    const dbPath = path.join(__dirname, "database");
    this.itemsDb = new JsonDatabase(dbPath, "items");
    console.log("Item Service: Banco NoSQL inicializado");
  }

  async seedInitialData() {
    try {
      console.log("🌱 Verificando dados iniciais...");
      const existingItems = await this.itemsDb.find();
      console.log(`Itens existentes: ${existingItems.length}`);

      if (existingItems.length === 0) {
        console.log("📦 Criando dados de exemplo...");
        const sampleItems = [
          // Alimentos (5 itens)
          {
            id: uuidv4(),
            name: "Arroz",
            category: "Alimentos",
            brand: "Tio João",
            unit: "kg",
            averagePrice: 5.99,
            barcode: "7891234567890",
            description: "Arroz branco tipo 1",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Feijão",
            category: "Alimentos",
            brand: "Camil",
            unit: "kg",
            averagePrice: 8.49,
            barcode: "7891234567891",
            description: "Feijão carioca",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Açúcar",
            category: "Alimentos",
            brand: "União",
            unit: "kg",
            averagePrice: 4.29,
            barcode: "7891234567892",
            description: "Açúcar refinado",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Óleo de Soja",
            category: "Alimentos",
            brand: "Liza",
            unit: "litro",
            averagePrice: 7.99,
            barcode: "7891234567893",
            description: "Óleo de soja refinado",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Farinha de Trigo",
            category: "Alimentos",
            brand: "Dona Benta",
            unit: "kg",
            averagePrice: 4.89,
            barcode: "7891234567894",
            description: "Farinha de trigo especial",
            active: true,
            createdAt: new Date().toISOString(),
          },

          // Limpeza (5 itens)
          {
            id: uuidv4(),
            name: "Detergente",
            category: "Limpeza",
            brand: "Ypê",
            unit: "un",
            averagePrice: 2.49,
            barcode: "7891234567895",
            description: "Detergente líquido neutro",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Sabão em Pó",
            category: "Limpeza",
            brand: "Omo",
            unit: "kg",
            averagePrice: 15.9,
            barcode: "7891234567896",
            description: "Sabão em pó multiuso",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Água Sanitária",
            category: "Limpeza",
            brand: "Qboa",
            unit: "litro",
            averagePrice: 6.99,
            barcode: "7891234567897",
            description: "Água sanitária concentrada",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Desinfetante",
            category: "Limpeza",
            brand: "Pinho Sol",
            unit: "litro",
            averagePrice: 9.49,
            barcode: "7891234567898",
            description: "Desinfetante aroma pinho",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Esponja de Aço",
            category: "Limpeza",
            brand: "Bombril",
            unit: "un",
            averagePrice: 3.99,
            barcode: "7891234567899",
            description: "Esponja de aço para limpeza",
            active: true,
            createdAt: new Date().toISOString(),
          },

          // Higiene (5 itens)
          {
            id: uuidv4(),
            name: "Sabonete",
            category: "Higiene",
            brand: "Dove",
            unit: "un",
            averagePrice: 2.99,
            barcode: "7891234567800",
            description: "Sabonete hidratante",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Shampoo",
            category: "Higiene",
            brand: "Pantene",
            unit: "ml",
            averagePrice: 14.9,
            barcode: "7891234567801",
            description: "Shampoo reparação completa",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Creme Dental",
            category: "Higiene",
            brand: "Colgate",
            unit: "un",
            averagePrice: 5.49,
            barcode: "7891234567802",
            description: "Creme dental total 12",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Papel Higiênico",
            category: "Higiene",
            brand: "Neve",
            unit: "un",
            averagePrice: 12.99,
            barcode: "7891234567803",
            description: "Papel higiênico folha dupla",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Desodorante",
            category: "Higiene",
            brand: "Rexona",
            unit: "un",
            averagePrice: 11.9,
            barcode: "7891234567804",
            description: "Desodorante aerosol masculino",
            active: true,
            createdAt: new Date().toISOString(),
          },

          // Bebidas (5 itens)
          {
            id: uuidv4(),
            name: "Refrigerante",
            category: "Bebidas",
            brand: "Coca-Cola",
            unit: "litro",
            averagePrice: 8.99,
            barcode: "7891234567805",
            description: "Refrigerante cola",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Suco de Laranja",
            category: "Bebidas",
            brand: "Del Valle",
            unit: "litro",
            averagePrice: 9.49,
            barcode: "7891234567806",
            description: "Suco integral de laranja",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Água Mineral",
            category: "Bebidas",
            brand: "Crystal",
            unit: "litro",
            averagePrice: 2.99,
            barcode: "7891234567807",
            description: "Água mineral sem gás",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Cerveja",
            category: "Bebidas",
            brand: "Skol",
            unit: "ml",
            averagePrice: 3.49,
            barcode: "7891234567808",
            description: "Cerveja pilsen lata 350ml",
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Leite",
            category: "Bebidas",
            brand: "Itambé",
            unit: "litro",
            averagePrice: 4.79,
            barcode: "7891234567809",
            description: "Leite integral UHT",
            active: true,
            createdAt: new Date().toISOString(),
          },
        ];

        for (const item of sampleItems) {
          await this.itemsDb.create(item);
          console.log(`✅ Item criado: ${item.name}`);
        }

        console.log("🎉 Itens de exemplo criados no Item Service");
      } else {
        console.log("ℹ️  Dados já existem, pulando criação");
      }
    } catch (error) {
      console.error("❌ Erro ao criar dados iniciais:", error);
    }
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(morgan("combined"));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Service info headers
    this.app.use((req, res, next) => {
      res.setHeader("X-Service", this.serviceName);
      res.setHeader("X-Service-Version", "1.0.0");
      res.setHeader("X-Database", "JSON-NoSQL");
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get("/health", async (req, res) => {
      try {
        const itemCount = await this.itemsDb.count();
        const activeItems = await this.itemsDb.count({ active: true });

        res.json({
          service: this.serviceName,
          status: "healthy",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: "1.0.0",
          database: {
            type: "JSON-NoSQL",
            itemCount: itemCount,
            activeItems: activeItems,
          },
        });
      } catch (error) {
        res.status(503).json({
          service: this.serviceName,
          status: "unhealthy",
          error: error.message,
        });
      }
    });

    // Service info
    this.app.get("/", (req, res) => {
      res.json({
        service: "Item Service",
        version: "1.0.0",
        description: "Microsserviço para gerenciamento de itens",
        database: "JSON-NoSQL",
        endpoints: [
          "GET /items", // ✅ Correto
          "GET /items/:id", // ✅ Correto
          "POST /items", // ✅ Correto
          "PUT /items/:id", // ✅ Correto
          "GET /categories", // ✅ Correto
          "GET /search", // ✅ Correto
        ],
      });
    });

    this.app.get("/items", this.getItems.bind(this));
    this.app.get("/items/:id", this.getItem.bind(this));
    this.app.get("/categories", this.getCategories.bind(this));
    this.app.get("/search", this.searchItems.bind(this));
    this.app.post(
      "/items",
      this.authMiddleware.bind(this),
      this.createItem.bind(this)
    );
    this.app.put(
      "/items/:id",
      this.authMiddleware.bind(this),
      this.updateItem.bind(this)
    );
  }

  setupErrorHandling() {
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        message: "Endpoint não encontrado",
        service: this.serviceName,
      });
    });

    this.app.use((error, req, res, next) => {
      console.error("Item Service Error:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do serviço",
        service: this.serviceName,
      });
    });
  }

  // Auth middleware (valida token com User Service)
  async authMiddleware(req, res, next) {
    const authHeader = req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token obrigatório",
      });
    }

    try {
      // Descobrir User Service
      const userService = serviceRegistry.discover("user-service");

      // Validar token com User Service
      const response = await axios.post(
        `${userService.url}/auth/validate`,
        {
          token: authHeader.replace("Bearer ", ""),
        },
        { timeout: 5000 }
      );

      if (response.data.success) {
        req.user = response.data.data.user;
        next();
      } else {
        res.status(401).json({
          success: false,
          message: "Token inválido",
        });
      }
    } catch (error) {
      console.error("Erro na validação do token:", error.message);
      res.status(503).json({
        success: false,
        message: "Serviço de autenticação indisponível",
      });
    }
  }

  // Get items (com filtros e paginação)
  async getItems(req, res) {
    try {
      console.log("📦 Buscando itens...");
      const { page = 1, limit = 10, category, active = true } = req.query;

      const filter = { active: active === "true" };
      if (category) filter.category = category;

      console.log("Filtro:", filter);

      const items = await this.itemsDb.find(filter, {
        skip: (page - 1) * parseInt(limit),
        limit: parseInt(limit),
        sort: { name: 1 },
      });

      const total = await this.itemsDb.count(filter);

      console.log(`✅ Encontrados ${items.length} itens de ${total}`);

      res.json({
        success: true,
        data: items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("❌ Erro ao buscar itens:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
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
          message: "Item não encontrado",
        });
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      console.error("Erro ao buscar item:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  // Create item
  async createItem(req, res) {
    try {
      const {
        name,
        category,
        brand,
        unit,
        averagePrice,
        barcode,
        description,
      } = req.body;

      if (!name || !category) {
        return res.status(400).json({
          success: false,
          message: "Nome e categoria são obrigatórios",
        });
      }

      // Criar item
      const newItem = await this.itemsDb.create({
        id: uuidv4(),
        name,
        category,
        brand: brand || "",
        unit: unit || "un",
        averagePrice: parseFloat(averagePrice) || 0,
        barcode: barcode || "",
        description: description || "",
        active: true,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: "Item criado com sucesso",
        data: newItem,
      });
    } catch (error) {
      console.error("Erro ao criar item:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  // Update item
  async updateItem(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const item = await this.itemsDb.findById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item não encontrado",
        });
      }

      const updatedItem = await this.itemsDb.update(id, updates);

      res.json({
        success: true,
        message: "Item atualizado com sucesso",
        data: updatedItem,
      });
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  // Get categories
  async getCategories(req, res) {
    try {
      const items = await this.itemsDb.find({ active: true });
      const categories = [
        ...new Set(items.map((item) => item.category)),
      ].sort();

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  // Search items
  async searchItems(req, res) {
    try {
      const { q, category, limit = 10 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Parâmetro de busca (q) é obrigatório",
        });
      }

      const filter = {
        active: true,
        $regex: q,
        $options: "i",
        $field: "name", // buscar por nome
      };

      // Filtrar por categoria se fornecida
      if (category) {
        filter.category = category;
      }

      const items = await this.itemsDb.find(filter, {
        limit: parseInt(limit),
        sort: { name: 1 },
      });

      res.json({
        success: true,
        data: items,
        search: {
          query: q,
          category: category || "all",
          results: items.length,
        },
      });
    } catch (error) {
      console.error("Erro na busca:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  // Register with service registry
  registerWithRegistry() {
    serviceRegistry.register(this.serviceName, {
      url: this.serviceUrl,
      version: "1.0.0",
      database: "JSON-NoSQL",
      endpoints: ["/health", "/items", "/items/:id", "/categories", "/search"],
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
      console.log("=====================================");
      console.log(`Item Service iniciado na porta ${this.port}`);
      console.log(`URL: ${this.serviceUrl}`);
      console.log(`Health: ${this.serviceUrl}/health`);
      console.log(`Database: JSON-NoSQL`);
      console.log("=====================================");

      // Registrar no service registry
      this.registerWithRegistry();
      this.startHealthReporting();

      setTimeout(() => {
        this.seedInitialData();
      }, 2000);
    });
  }
}

// Start service
if (require.main === module) {
  const itemService = new ItemService();
  itemService.start();

  // Graceful shutdown
  process.on("SIGTERM", () => {
    serviceRegistry.unregister("item-service");
    process.exit(0);
  });
  process.on("SIGINT", () => {
    serviceRegistry.unregister("item-service");
    process.exit(0);
  });
}

module.exports = ItemService;
