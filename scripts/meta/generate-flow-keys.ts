import { generateKeyPairSync } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

function generateKeys() {
    console.log('🏛️ GENERANDO LLAVES DE SEGURIDAD PARA FLOWS...');
    
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    const certDir = path.join(process.cwd(), 'certs');
    if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir);
    }

    fs.writeFileSync(path.join(certDir, 'flow_private.pem'), privateKey);
    fs.writeFileSync(path.join(certDir, 'flow_public.pem'), publicKey);

    console.log('✅ LLAVES GENERADAS CON ÉXITO.');
    console.log('\n🔑 TU CLAVE PÚBLICA (Cópiala y pégala en Meta):\n');
    console.log(publicKey);
    console.log('\n⚠️ La llave privada se ha guardado en: certs/flow_private.pem');
    console.log('No compartas la llave privada con nadie.');
}

generateKeys();
