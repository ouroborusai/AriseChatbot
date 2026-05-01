import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_VERSION = 'v23.0';

async function uploadKey() {
  if (!ACCESS_TOKEN || !PHONE_ID) {
    console.error('❌ Faltan credenciales en .env.local');
    return;
  }

  const publicKeyPath = path.join(process.cwd(), 'certs', 'flow_public.pem');
  if (!fs.existsSync(publicKeyPath)) {
    console.error('❌ No se encontró certs/flow_public.pem. Ejecuta generate-flow-keys.ts primero.');
    return;
  }

  const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

  console.log(`🚀 INYECTANDO LLAVE PÚBLICA EN EL NÚMERO: ${PHONE_ID}`);

  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/whatsapp_business_encryption`, {
    method: 'POST',
    headers: { 
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      business_public_key: publicKey
    })
  });

  const result = await res.json();
  console.log('🏁 Resultado Meta:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('✨ ¡ÉXITO! La llave ha sido firmada y Meta ya confía en Arise.');
  } else {
    console.error('❌ Error al subir la llave. Revisa los permisos del token.');
  }
}

uploadKey();
