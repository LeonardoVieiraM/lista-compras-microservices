const fs = require('fs-extra');
const path = require('path');

const REGISTRY_FILE = path.join(__dirname, 'shared', 'service-registry.json');

async function debugRegistry() {
    try {
        console.log('🔍 Debug do Service Registry...');
        console.log('Arquivo:', REGISTRY_FILE);
        
        if (await fs.pathExists(REGISTRY_FILE)) {
            const content = await fs.readFile(REGISTRY_FILE, 'utf8');
            console.log('Conteúdo do arquivo:');
            console.log(content);
            
            try {
                const data = JSON.parse(content);
                console.log('JSON parseado:');
                console.log(Object.keys(data));
            } catch (e) {
                console.log('❌ JSON inválido:', e.message);
            }
        } else {
            console.log('❌ Arquivo não existe');
        }
    } catch (error) {
        console.error('Erro no debug:', error.message);
    }
}

debugRegistry();