
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = 'v23.0';
const WABA_ID = '930946633057624';

async function exportAssets() {
  if (!ACCESS_TOKEN) return;

  const report: any = {
    templates: [],
    flows: []
  };

  console.log('📊 Exportando activos para análisis de LM...');

  // 1. Exportar Plantillas
  const tRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${WABA_ID}/message_templates`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const tData = await tRes.json();
  report.templates = tData.data?.filter((t: any) => t.status === 'APPROVED') || [];

  // 2. Exportar Flows (Los 3 conocidos)
  const flowIds = ['1679867603465733', '842923818860124', '3141848516022930'];
  for (const fid of flowIds) {
    const fRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${fid}/assets`, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    const fAssets = await fRes.json();
    const asset = fAssets.data?.find((a: any) => a.asset_type === 'FLOW_JSON');
    if (asset?.download_url) {
      const jsonRes = await fetch(asset.download_url);
      const flowJson = await jsonRes.json();
      report.flows.push({ id: fid, json: flowJson });
    }
  }

  fs.writeFileSync('meta_assets_report.json', JSON.stringify(report, null, 2));
  console.log('✅ Reporte generado: meta_assets_report.json');
}

exportAssets();
