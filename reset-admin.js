const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'services', 'user-service', 'database', 'users.json');

async function resetAdmin() {
    try {
        console.log('🔄 Resetando usuário admin...');
        
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        const adminUser = {
            id: uuidv4(),
            email: "admin@shopping.com",
            username: "admin",
            password: hashedPassword,
            firstName: "Administrador",
            lastName: "Sistema",
            preferences: {
                defaultStore: "Mercado Central",
                currency: "BRL",
            },
            role: "admin",
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await fs.writeJson(dbPath, [adminUser], { spaces: 2 });
        console.log('✅ Admin resetado: admin@shopping.com / admin123');
        
    } catch (error) {
        console.error('❌ Erro ao resetar admin:', error.message);
    }
}

resetAdmin();