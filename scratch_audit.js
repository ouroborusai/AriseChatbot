const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=\"?([^\"\n\r]+)\"?/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=\"?([^\"\n\r]+)\"?/);

if(urlMatch && keyMatch) {
  fetch(urlMatch[1] + '/rest/v1/', { headers: { apikey: keyMatch[1] } })
    .then(r => r.json())
    .then(d => {
      console.log('Auditoría de Terreno Exitosa - Tablas Públicas:');
      const defs = d.definitions || {};
      for (const t of Object.keys(defs)) {
        if (t === 'Error') continue;
        const columns = Object.keys(defs[t].properties || {}).join(', ');
        console.log(`Tabla ${t}: ${columns}`);
      }
    }).catch(e => console.error('Error fetching schema:', e));
} else {
  console.log('No credentials found');
}
