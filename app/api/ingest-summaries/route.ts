
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const DOCS_PATH = 'c:\\Users\\s_pk_\\Desktop\\MTZ RENTAS\\artifacts\\chatbot_docs';
  const supabase = getSupabaseAdmin();

  try {
    const files = fs.readdirSync(DOCS_PATH).filter(f => f.endsWith('.md'));
    let count = 0;
    const results: any[] = [];

    for (const file of files) {
      const filePath = path.join(DOCS_PATH, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      const lines = content.split('\n');
      const legalName = lines[0].replace('# Resumen Financiero: ', '').trim();
      const rut = lines[1].replace('RUT: ', '').trim();
      const period = (lines[2] || '').replace('Periodo: ', '').trim();

      const ventasBruto = content.match(/\*\*Total Ventas \(Bruto\):\*\* \$([\d.]+)/)?.[1] || '0';
      const comprasBruto = content.match(/\*\*Total Compras \(Bruto\):\*\* \$([\d.]+)/)?.[1] || '0';
      const resultadoMatch = content.match(/\*\*Tu resultado neto estimado .* es de \$(-?[\d.]+)\./);
      const resultadoNeto = resultadoMatch ? resultadoMatch[1] : '0';
      
      const whatsappProposalMatch = content.match(/## 💡 Propuesta de Respuesta WhatsApp\n([\s\S]*?)\n---/);
      const whatsappProposal = whatsappProposalMatch ? whatsappProposalMatch[1].trim() : '';

      const financialData = {
        period,
        ventas_bruto: ventasBruto,
        compras_bruto: comprasBruto,
        resultado_neto: resultadoNeto,
        whatsapp_proposal: whatsappProposal,
        updated_at: new Date().toISOString()
      };

      const { data: company, error: selectError } = await supabase
        .from('companies')
        .select('id, metadata')
        .eq('rut', rut)
        .maybeSingle();

      if (company) {
        await supabase
          .from('companies')
          .update({ 
            metadata: {
              ...(company.metadata || {}),
              financial_summary: financialData
            } 
          })
          .eq('id', company.id);
        results.push({ rut, status: 'updated', name: legalName });
        count++;
      } else {
        results.push({ rut, status: 'not_found', name: legalName });
      }
    }

    return NextResponse.json({ success: true, ingested: count, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
