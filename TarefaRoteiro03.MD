# Atividade Prática: Sistema de Lista de Compras com Microsserviços

<div style="text-align: center; margin-bottom: 40px;">
  <img src="https://www.pucminas.br/institucional/PublishingImages/Paginas/brasao/brasao-pucminas-versao-2025.png" alt="PUC Minas" class="logo-puc" style="height: 80px; margin-right: 20px;">
  <img src="https://sbbd.org.br/2023/wp-content/uploads/sites/16/2023/08/assinatura_icei_COR_2023-edited.jpg" alt="ICEI" class="logo-icei" style="height: 80px; margin-left: 20px;">
</div>

**Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas**  
**Instituto de Ciências Exatas e Informática (ICEI)**  
**Pontifícia Universidade Católica de Minas Gerais**

**Professores:** Artur Mol, Cleiton Tavares e Cristiano Neto

---

## Objetivo

Desenvolver um sistema distribuído para gerenciamento de listas de compras utilizando arquitetura de microsserviços com API Gateway, Service Discovery e bancos NoSQL independentes.

## Cenário

Você deve implementar um sistema que permita aos usuários criar e gerenciar suas listas de compras. O sistema será composto por três microsserviços independentes que se comunicam através de um API Gateway.

---

## Arquitetura do Sistema

### Microsserviços a Implementar:

1. **User Service** (porta 3001) - Gerenciamento de usuários
2. **List Service** (porta 3002) - Gerenciamento de listas de compras  
3. **Item Service** (porta 3003) - Catálogo de itens/produtos
4. **API Gateway** (porta 3000) - Ponto único de entrada

### Tecnologias Obrigatórias:
- Node.js + Express
- Banco NoSQL baseado em arquivos JSON
- Service Registry compartilhado
- Autenticação JWT

---

## PARTE 1: User Service

### Funcionalidades Necessárias:

#### Endpoints:
- `POST /auth/register` - Cadastro de usuário
- `POST /auth/login` - Login com email/username + senha
- `GET /users/:id` - Buscar dados do usuário
- `PUT /users/:id` - Atualizar perfil do usuário

#### Schema do Usuário:
```json
{
  "id": "uuid",
  "email": "string",
  "username": "string", 
  "password": "string (hash)",
  "firstName": "string",
  "lastName": "string",
  "preferences": {
    "defaultStore": "string",
    "currency": "string"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Requisitos:
- Hash de senhas com bcrypt
- Geração de tokens JWT
- Validação de email único
- Middleware de autenticação

---

## PARTE 2: Item Service

### Funcionalidades Necessárias:

#### Endpoints:
- `GET /items` - Listar itens com filtros (categoria, nome)
- `GET /items/:id` - Buscar item específico
- `POST /items` - Criar novo item (requer autenticação)
- `PUT /items/:id` - Atualizar item
- `GET /categories` - Listar categorias disponíveis
- `GET /search?q=termo` - Buscar itens por nome

#### Schema do Item:
```json
{
  "id": "uuid",
  "name": "string",
  "category": "string",
  "brand": "string",
  "unit": "string", // "kg", "un", "litro"
  "averagePrice": "number",
  "barcode": "string",
  "description": "string",
  "active": "boolean",
  "createdAt": "timestamp"
}
```

#### Dados Iniciais:
Criar pelo menos 20 itens distribuídos nas categorias:
- Alimentos
- Limpeza  
- Higiene
- Bebidas
- Padaria

---

## PARTE 3: List Service

### Funcionalidades Necessárias:

#### Endpoints:
- `POST /lists` - Criar nova lista
- `GET /lists` - Listar listas do usuário
- `GET /lists/:id` - Buscar lista específica
- `PUT /lists/:id` - Atualizar lista (nome, descrição)
- `DELETE /lists/:id` - Deletar lista
- `POST /lists/:id/items` - Adicionar item à lista
- `PUT /lists/:id/items/:itemId` - Atualizar item na lista
- `DELETE /lists/:id/items/:itemId` - Remover item da lista
- `GET /lists/:id/summary` - Resumo da lista (total estimado)

#### Schema da Lista:
```json
{
  "id": "uuid",
  "userId": "string",
  "name": "string",
  "description": "string",
  "status": "active|completed|archived",
  "items": [
    {
      "itemId": "string",
      "itemName": "string", // cache do nome
      "quantity": "number",
      "unit": "string",
      "estimatedPrice": "number",
      "purchased": "boolean",
      "notes": "string",
      "addedAt": "timestamp"
    }
  ],
  "summary": {
    "totalItems": "number",
    "purchasedItems": "number", 
    "estimatedTotal": "number"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Regras de Negócio:
- Usuário só pode ver suas próprias listas
- Ao adicionar item, buscar dados no Item Service
- Calcular automaticamente totais estimados
- Permitir marcar itens como comprados

---

## PARTE 4: API Gateway

### Funcionalidades Necessárias:

#### Roteamento:
- `/api/auth/*` → User Service
- `/api/users/*` → User Service  
- `/api/items/*` → Item Service
- `/api/lists/*` → List Service

#### Endpoints Agregados:
- `GET /api/dashboard` - Dashboard com estatísticas do usuário
- `GET /api/search?q=termo` - Busca global (listas + itens)
- `GET /health` - Status de todos os serviços
- `GET /registry` - Lista de serviços registrados

#### Recursos Obrigatórios:
- Service Discovery via arquivo compartilhado
- Circuit Breaker simples (3 falhas = abrir circuito)
- Health checks automáticos a cada 30 segundos
- Logs de requisições

---

## PARTE 5: Service Registry

### Implementação:
Utilizar a implementação baseada em arquivo do exemplo fornecido:

```javascript
// shared/serviceRegistry.js
// Arquivo compartilhado para descoberta de serviços
// Registro automático na inicialização
// Health checks distribuídos
```

### Funcionalidades:
- Registro automático de serviços
- Descoberta por nome de serviço
- Health checks periódicos
- Cleanup automático na saída

---

## ENTREGÁVEIS

### Código Fonte:
- [ ] 4 serviços funcionais (User, Item, List, Gateway)
- [ ] Service Registry implementado
- [ ] Bancos NoSQL com dados de exemplo
- [ ] Scripts package.json para execução

### Estrutura de Diretórios:
```
lista-compras-microservices/
├── package.json
├── shared/
│   ├── JsonDatabase.js
│   └── serviceRegistry.js
├── services/
│   ├── user-service/
│   ├── item-service/
│   └── list-service/
├── api-gateway/
└── client-demo.js
```

### Funcionalidades Demonstradas:
- [ ] Registro e login de usuário
- [ ] Criação de lista de compras
- [ ] Adição de itens à lista
- [ ] Busca de itens no catálogo
- [ ] Dashboard agregado
- [ ] Health checks funcionais

### Cliente de Teste:
Criar `client-demo.js` que demonstre:
1. Registro de usuário
2. Login
3. Busca de itens
4. Criação de lista
5. Adição de itens à lista
6. Visualização do dashboard

---

## CRITÉRIOS DE AVALIAÇÃO

### Implementação Técnica (40%):
- Microsserviços funcionais independentes
- Service Discovery operacional
- API Gateway com roteamento correto
- Bancos NoSQL com schema adequado

### Integração (30%):
- Comunicação entre serviços
- Autenticação distribuída
- Circuit breaker funcionando
- Health checks automáticos

### Funcionalidades (30%):
- CRUD completo de listas
- Busca e filtros
- Dashboard agregado
- Cliente demonstrando fluxo completo

---

## INSTRUÇÕES DE EXECUÇÃO

### Setup:
```bash
npm install
npm run install:all
```

### Execução:
```bash
# Terminal 1
cd services/user-service && npm start

# Terminal 2  
cd services/item-service && npm start

# Terminal 3
cd services/list-service && npm start

# Terminal 4
cd api-gateway && npm start

# Terminal 5 - Teste
node client-demo.js
```

### Verificação:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/registry
```

---

## DICAS DE IMPLEMENTAÇÃO

1. **Comece pelo User Service** - base para autenticação
2. **Use o exemplo do Roteiro 3** como referência para estrutura
3. **Implemente um serviço por vez** e teste isoladamente  
4. **Service Registry é crítico** - teste bem a descoberta
5. **Logs são essenciais** para debug de comunicação entre serviços

### Erros Comuns:
- Service Registry não compartilhado entre processos
- Problemas de timing na inicialização
- URLs hardcoded em vez de usar Service Discovery
- Falta de tratamento de erro na comunicação

---

## PRAZO DE ENTREGA

**Data:** 29/09/2025
**Formato:** Código fonte + documentação em repositório Git
**Apresentação:** Demonstração ao vivo de 10 minutos
