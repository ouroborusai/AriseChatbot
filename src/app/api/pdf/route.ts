import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';

export async function POST(req: Request) {
  try {
    const { targetPhone, whatsappToken, phoneNumberId, reportType } = await req.json();

    if (!targetPhone || !whatsappToken || !phoneNumberId) {
        return NextResponse.json({ error: 'Missing required parameters (targetPhone, whatsappToken, phoneNumberId)' }, { status: 400 });
    }

    const getTemplate = (type: string) => {
      const baseStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        body { font-family: 'Inter', sans-serif; background: #ffffff; color: #0b1326; margin: 0; padding: 40px; }
        .bg-gradient { display: none; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #0045bd; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: 800; color: #0045bd; margin: 0; text-transform: uppercase; letter-spacing: -0.01em; }
        .meta { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
        .glass-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { text-align: left; padding: 12px; font-size: 10px; text-transform: uppercase; color: #0045bd; border-bottom: 2px solid #e2e8f0; font-weight: 800; }
        td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .badge { padding: 6px 12px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef9c3; color: #854d0e; }
        .nowrap { white-space: nowrap; }
        .footer { margin-top: 60px; font-size: 8px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; font-style: italic; }
        .diamond-accent { color: #135bec; font-weight: 700; }
        .amount { text-align: right; }
        tr:hover { background-color: #f8fafc; }
        th, td { padding: 5px 8px; line-height: 1.2; font-size: 8.5px; font-weight: 500; border: 1px solid #e2e8f0; }
    `;

      if (type.toLowerCase().includes('8-columnas')) {
        return `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body style="padding: 20px;">
            <div class="header">
              <div>
                <p style="font-size: 14px; font-weight: 800; margin: 0;">{{company_rut}} {{company_name}}</p>
                <p style="font-size: 10px; color: #64748b; margin: 2px 0;">{{company_address}}</p>
                <p style="font-size: 10px; color: #64748b;">REP. LEGAL: {{rep_legal}}</p>
              </div>
              <div style="text-align: right;">
                <h1 class="title" style="font-size: 20px;">BALANCE GENERAL DE 8 COLUMNAS</h1>
                <p class="meta">PERIODO: {{period}}</p>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                <thead>
                    <tr style="background: #f9fafb; color: #374151;">
                        <th rowspan="2" style="width: 200px; text-align: left;">Cuenta</th>
                        <th colspan="2" style="text-align: center;">SUMAS</th>
                        <th colspan="2" style="text-align: center;">SALDOS</th>
                        <th colspan="2" style="text-align: center;">INVENTARIO</th>
                        <th colspan="2" style="text-align: center;">RESULTADO</th>
                    </tr>
                    <tr style="background: #f9fafb; color: #6b7280;">
                        <th>Débitos</th>
                        <th>Créditos</th>
                        <th>Deudor</th>
                        <th>Acreedor</th>
                        <th>Activo</th>
                        <th>Pasivo</th>
                        <th>Pérdidas</th>
                        <th>Ganancias</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each accounts}}
                    <tr>
                        <td class="nowrap" style="color: #1f2937;">{{name}}</td>
                        <td class="amount">{{sum_debit}}</td>
                        <td class="amount">{{sum_credit}}</td>
                        <td class="amount">{{balance_deudor}}</td>
                        <td class="amount">{{balance_acreedor}}</td>
                        <td class="amount">{{inventory_asset}}</td>
                        <td class="amount">{{inventory_liability}}</td>
                        <td class="amount">{{result_loss}}</td>
                        <td class="amount">{{result_gain}}</td>
                    </tr>
                    {{/each}}
                    <tr style="background: #f3f4f6; color: #111827; font-weight: 800;">
                        <td>TOTALES DEFINITIVOS</td>
                        <td class="amount">{{totals.sum_debit}}</td>
                        <td class="amount">{{totals.sum_credit}}</td>
                        <td class="amount">{{totals.balance_deudor}}</td>
                        <td class="amount">{{totals.balance_acreedor}}</td>
                        <td class="amount">{{totals.inventory_asset}}</td>
                        <td class="amount">{{totals.inventory_liability}}</td>
                        <td class="amount">{{totals.result_loss}}</td>
                        <td class="amount">{{totals.result_gain}}</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 50px; display: flex; justify-content: space-around;">
              <div style="text-align: center; border-top: 1px solid #334155; width: 220px; padding-top: 8px;">
                <p style="margin: 0; font-size: 10px; font-weight: 800;">CONTADOR</p>
              </div>
              <div style="text-align: center; border-top: 1px solid #334155; width: 220px; padding-top: 8px;">
                <p style="margin: 0; font-size: 10px; font-weight: 800;">REPRESENTANTE LEGAL</p>
                <p style="margin: 0; font-size: 8px; color: #64748b;">{{rep_legal}}</p>
              </div>
            </div>

            <div class="footer" style="text-align: center; margin-top: 40px;">
              Documento Certificado por <span class="diamond-accent">OuroborusAI - Arise Chatbot</span>
            </div>
          </body>
          </html>
        `;
      }

      if (type.toLowerCase().includes('balance')) {
        return `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="bg-gradient"></div>
            <div class="header">
              <div>
                <h1 class="title">BALANCE CONTABLE CONSOLIDADO</h1>
                <div class="meta">Sistema de Inteligencia Financiera v7.1</div>
              </div>
              <div style="text-align: right">
                <div class="meta">CORTE AL: {{date}}</div>
                <div class="meta">ESTADO: <span class="badge badge-success">AUDITADO</span></div>
              </div>
            </div>
            <div class="glass-card">
              <h3 style="font-size: 14px; color: #a855f7;">Resumen de Activos y Pasivos</h3>
              <table>
                <thead>
                  <tr><th>CUENTA</th><th>DESCRIPCIÓN</th><th style="text-align: right">MONTO (CLP)</th></tr>
                </thead>
                <tbody>
                  {{#each items}}
                  <tr>
                    <td style="font-family: monospace; color: #6366f1;">{{sku}}</td>
                    <td>{{name}}</td>
                    <td style="text-align: right; font-weight: bold; {{#if low_stock}}color: #ef4444;{{/if}}">{{quantity}}</td>
                  </tr>
                  {{/each}}
                </tbody>
              </table>
            </div>
            <div class="footer">Documento certificado por <span class="diamond-accent">OuroborusAI - Arise Chatbot</span></div>
          </body>
          </html>
        `;
      }

      if (type.toLowerCase().includes('factura') || type.toLowerCase().includes('invoice')) {
        return `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="header">
              <h1 class="title">DETALLE DE FACTURACIÓN</h1>
              <div class="meta">PROYECTO: {{company_name}}</div>
            </div>
            <div class="glass-card">
              <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <span class="meta">FECHA DE EMISIÓN: {{date}}</span>
                <span class="diamond-accent">FOLIO: #{{folio}}</span>
              </div>
              <table>
                <thead>
                  <tr><th>ÍTEM / SERVICIO</th><th style="text-align: right">SUBTOTAL</th></tr>
                </thead>
                <tbody>
                  {{#each items}}
                  <tr>
                    <td>{{name}}</td>
                    <td style="text-align: right;">{{quantity}}</td>
                  </tr>
                  {{/each}}
                </tbody>
              </table>
              <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; text-align: right;">
                <div class="title" style="font-size: 20px;">TOTAL: {{total}} CL$</div>
              </div>
            </div>
          </body>
          </html>
        `;
      }

      if (type.toLowerCase().includes('compliance') || type.toLowerCase().includes('f29') || type.toLowerCase().includes('legal')) {
        return `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="header">
              <h1 class="title">CUMPLIMIENTO TRIBUTARIO (F29)</h1>
              <div class="meta">CERTIFICACIÓN ARISE ELITE</div>
            </div>
            <div class="glass-card">
              <h2 style="font-size: 14px;">Bitácora de Obligaciones</h2>
              {{#each items}}
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
                <div>
                  <div style="font-weight: bold; color: #ffffff;">{{name}}</div>
                  <div class="meta">Ref: {{sku}}</div>
                </div>
                <div><span class="badge {{#if low_stock}}badge-warning{{else}}badge-success{{/if}}">{{quantity}}</span></div>
              </div>
              {{/each}}
            </div>
          </body>
          </html>
        `;
      }

      if (type.toLowerCase().includes('liquidacion') || type.toLowerCase().includes('sueldo') || type.toLowerCase().includes('payroll')) {
        return `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body style="padding: 30px;">
            <div class="header">
              <div>
                <h1 class="title" style="font-size: 18px;">LIQUIDACIÓN DE SUELDO</h1>
                <p class="meta" style="margin-top: 5px;">CERTIFICACIÓN LABORAL OUROBORUSAI</p>
              </div>
              <div style="text-align: right;">
                <p style="font-size: 11px; font-weight: 800; color: #0045bd; margin: 0;">{{company_name}}</p>
                <p style="font-size: 9px; color: #64748b; margin: 2px 0;">RUT: {{company_rut}}</p>
                <p style="font-size: 9px; color: #6b7280;">MES: {{period}}</p>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div>
                <p class="meta" style="font-size: 8px; margin-bottom: 5px;">DATOS DEL COLABORADOR</p>
                <p style="font-size: 11px; font-weight: 800; margin: 0;">{{employee_name}}</p>
                <p style="font-size: 9px; color: #475569;">RUT: {{employee_rut}} | CARGO: {{job_title}}</p>
              </div>
              <div style="text-align: right;">
                <p class="meta" style="font-size: 8px; margin-bottom: 5px;">ESTADÍSTICAS LABORALES</p>
                <p style="font-size: 9px; color: #475569; margin: 0;">DÍAS TRABAJADOS: <b>{{days_worked}}</b></p>
                <p style="font-size: 9px; color: #475569;">FECHA INGRESO: {{join_date}}</p>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <!-- Columna Haberes -->
              <div style="border-right: 1px solid #e2e8f0;">
                <div style="background: #f1f5f9; padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0;">
                  <span class="meta" style="font-size: 9px; color: #1e293b;">DETALLE DE HABERES</span>
                </div>
                {{#each earnings}}
                <div style="display: flex; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid #f1f5f9; background: {{#if imponible}}#ffffff{{else}}#f8fafc{{/if}};">
                  <span style="font-size: 9px; color: {{#if imponible}}#1e293b{{else}}#64748b{{/if}};">{{name}} {{#if imponible}}<small style="color: #0045bd; font-size: 7px;">(IMP)</small>{{/if}}</span>
                  <span style="font-size: 9px; font-weight: 600;">{{amount}}</span>
                </div>
                {{/each}}
                <div style="display: flex; justify-content: space-between; padding: 10px 12px; background: #f8fafc; font-weight: 800; border-top: 1px solid #e2e8f0;">
                  <span style="font-size: 9px;">TOTAL HABERES</span>
                  <span style="font-size: 9px; color: #0045bd;">{{total_earnings}}</span>
                </div>
              </div>

              <!-- Columna Descuentos -->
              <div>
                <div style="background: #f1f5f9; padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0;">
                  <span class="meta" style="font-size: 9px; color: #1e293b;">DESCUENTOS Y RETENCIONES</span>
                </div>
                {{#each deductions}}
                <div style="display: flex; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid #f1f5f9;">
                  <span style="font-size: 9px; color: #1e293b;">{{name}}</span>
                  <span style="font-size: 9px; font-weight: 600; color: #e11d48;">{{amount}}</span>
                </div>
                {{/each}}
                <div style="display: flex; justify-content: space-between; padding: 10px 12px; background: #f8fafc; font-weight: 800; border-top: 1px solid #e2e8f0;">
                  <span style="font-size: 9px;">TOTAL DESCUENTOS</span>
                  <span style="font-size: 9px; color: #e11d48;">{{total_deductions}}</span>
                </div>
              </div>
            </div>

            <!-- Resumen Líquido y Conversión -->
            <div style="margin-top: 20px; display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: center;">
              <div style="background: #0045bd; color: white; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 10px; font-weight: 600; opacity: 0.9;">ALCANCE LÍQUIDO A RECIBIR</span>
                <span style="font-size: 18px; font-weight: 800;">{{net_salary}}</span>
              </div>
              <div style="background: #f1f5f9; padding: 10px; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <p style="font-size: 7px; color: #64748b; margin: 0 0 5px 0;">EQUIVALENCIA DE MERCADO (IA INSIGHTS)</p>
                <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 2px;">
                  <span>UF: {{net_uf}}</span>
                  <span style="color: #334155; opacity: 0.7;">USD: {{net_usd}}</span>
                </div>
              </div>
            </div>

            <!-- Firmas y Validación -->
            <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div style="background: white; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px; display: flex; gap: 10px; align-items: center;">
                <div style="width: 50px; height: 50px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 20px;">🔒</div>
                <div>
                  <p style="font-size: 8px; font-weight: 800; margin: 0;">FIRMA ELECTRÓNICA AVANZADA</p>
                  <p style="font-size: 7px; color: #64748b; margin: 2px 0;">Token: {{signature_hash}}</p>
                  <p style="font-size: 7px; color: #0045bd;">Vía OuroborusAI Neural Vault</p>
                </div>
              </div>
              
              <div style="text-align: center; border-top: 1px solid #334155; width: 180px; padding-top: 8px;">
                <p style="margin: 0; font-size: 9px; font-weight: 800;">FIRMA DEL TRABAJADOR</p>
                <p style="margin: 0; font-size: 7px; color: #94a3b8;">ACEPTO CONFORME EL PAGO</p>
              </div>

              <div style="text-align: center;">
                <div style="width: 50px; height: 50px; border: 1px solid #e2e8f0; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8;">QR CODE</div>
                <p style="font-size: 6px; color: #94a3b8; margin-top: 4px;">VERIFICAR EN ARISE.AI</p>
              </div>
            </div>

            <div class="footer" style="text-align: center; margin-top: 30px;">
              Documento Certificado por <span class="diamond-accent">OuroborusAI - Arise Chatbot</span> | Hash: {{signature_hash}}
            </div>
          </body>
          </html>
        `;
      }

      if (type.toLowerCase().includes('dashboard') || type.toLowerCase().includes('resumen')) {
        return `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="bg-gradient"></div>
            <div class="header">
              <div>
                <h1 class="title">DIAMOND EXECUTIVE DASHBOARD</h1>
                <div class="meta">Ouroborus Neural Architecture | Arise Business OS v7.1</div>
              </div>
              <div style="text-align: right">
                <div class="meta">EMITIDO: {{date}}</div>
                <div class="meta">CLIENTE: <span class="diamond-accent">{{company_name}}</span></div>
              </div>
            </div>

            <div class="glass-card">
              <h2 style="font-size: 16px; margin-top: 0">S\u00EDntesis de Operaciones</h2>
              <table>
                <thead>
                  <tr>
                    <th>M\u00D3DULO / REF</th>
                    <th>DEFINICI\u00D3N</th>
                    <th style="text-align: right">KPI / ESTATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {{#each items}}
                  <tr>
                    <td style="color: #6366f1; font-weight: bold">{{sku}}</td>
                    <td>{{name}}</td>
                    <td style="text-align: right">
                      <span class="badge {{#if low_stock}}badge-error{{else}}badge-success{{/if}}">{{quantity}}</span>
                    </td>
                  </tr>
                  {{/each}}
                </tbody>
              </table>
            </div>

            <div class="footer">Documento Generado por <span class="diamond-accent">OuroborusAI - Arise Chatbot</span></div>
          </body>
          </html>
        `;
      }

      // Default Template
      return `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="header">
            <h1 class="title">REPORTE T\u00C9CNICO: {{reportType}}</h1>
            <div class="meta">{{date}}</div>
          </div>
          <div class="glass-card">
            {{#each items}}
            <div style="margin-bottom: 8px; font-size: 13px;">\u2022 {{name}}: <span class="diamond-accent">{{quantity}}</span></div>
            {{/each}}
          </div>
        </body>
        </html>
      `;
    };

    const design_html = getTemplate(reportType || 'Resumen');

    // Dynamic mock response for immediate wow-factor
    let mockData: any = {
        date: new Date().toLocaleDateString('es-CL'),
        company_name: 'MTZ Consultores & Arise',
        folio: Math.floor(Math.random() * 9000) + 1000,
        items: []
    };

    if (reportType.toLowerCase().includes('8-columnas')) {
        mockData.company_rut = '76.462.417-3';
        mockData.company_name = 'INVERSIONES ROJAS Y COMPANIA LIMITADA';
        mockData.company_address = 'AVENIDA PLAYA BRAVA #2109-A IQUIQUE';
        mockData.rep_legal = 'MARCO ANTONIO ROJAS REJAS';
        mockData.period = 'ENERO A DICIEMBRE 2023';
        mockData.accounts = [
            { name: '1101-01 CUENTA CAJA', sum_debit: '1.182.433.333', sum_credit: '973.893.183', balance_deudor: '208.540.150', balance_acreedor: '', inventory_asset: '208.540.150', inventory_liability: '', result_loss: '', result_gain: '' },
            { name: '1104-01 DEUDORES CLIENTES', sum_debit: '252.983', sum_credit: '', balance_deudor: '252.983', balance_acreedor: '', inventory_asset: '252.983', inventory_liability: '', result_loss: '', result_gain: '' },
            { name: '2105-01 FACTURAS POR PAGAR', sum_debit: '940.621.653', sum_credit: '2.008.133.798', balance_deudor: '', balance_acreedor: '1.067.512.145', inventory_asset: '', inventory_liability: '1.067.512.145', result_loss: '', result_gain: '' },
            { name: '5101-01 VENTAS', sum_debit: '', sum_credit: '306.762.825', balance_deudor: '', balance_acreedor: '306.762.825', inventory_asset: '', inventory_liability: '', result_loss: '', result_gain: '306.762.825' }
        ];
        mockData.totals = {
            sum_debit: '4.277.116.904',
            sum_credit: '4.277.116.904',
            balance_deudor: '1.849.234.584',
            balance_acreedor: '1.849.234.584',
            inventory_asset: '1.353.157.804',
            inventory_liability: '1.353.157.804',
            result_loss: '508.604.586',
            result_gain: '508.604.586'
        };
    } else if (reportType.toLowerCase().includes('balance')) {
        mockData.items = [
            { sku: '1-01-001', name: 'Banco Santander (Pesos)', quantity: '$42,500,000', low_stock: false },
            { sku: '1-01-002', name: 'Cuentas por Cobrar Clientes', quantity: '$12,380,000', low_stock: false },
            { sku: '2-01-001', name: 'IVA por Pagar (F29)', quantity: '$-2,150,000', low_stock: true },
            { sku: '3-01-001', name: 'Patrimonio Neto', quantity: '$52,730,000', low_stock: false }
        ];
    } else if (reportType.toLowerCase().includes('factura')) {
        mockData.items = [
            { name: 'Consuloría Tributaria Mensual', quantity: '$1,200,000' },
            { name: 'Gestión de Auditoría Remota', quantity: '$450,000' },
            { name: 'Suscripción Arise Business OS', quantity: '$95,000' }
        ];
        mockData.total = '1,745,000';
    } else if (reportType.toLowerCase().includes('f29')) {
        mockData.items = [
            { sku: 'IMP-01', name: 'IVA (Débito Fiscal)', quantity: 'DECLARADO', low_stock: false },
            { sku: 'IMP-02', name: 'Retención Honorarios (13.75%)', quantity: 'AL DÍA', low_stock: false },
            { sku: 'IMP-03', name: 'PPM (Pagos Provisionales)', quantity: 'PENDIENTE', low_stock: true }
        ];
    } else if (reportType.toLowerCase().includes('liquidacion') || reportType.toLowerCase().includes('sueldo')) {
        mockData.company_rut = '76.462.417-3';
        mockData.company_name = 'INVERSIONES ROJAS Y COMPANIA LIMITADA';
        mockData.period = 'ABRIL 2026';
        mockData.employee_name = 'MARCO ANTONIO ROJAS REJAS';
        mockData.employee_rut = '15.432.123-K';
        mockData.job_title = 'Director de Finanzas';
        mockData.days_worked = '30';
        mockData.join_date = '01/01/2020';
        mockData.earnings = [
            { name: 'Sueldo Base', amount: '$2,500,000', imponible: true },
            { name: 'Gratificaci\u00F3n Legal (Art. 50)', amount: '$150,000', imponible: true },
            { name: 'Bono de Responsabilidad', amount: '$450,000', imponible: true },
            { name: 'Asignaci\u00F3n de Colaci\u00F3n', amount: '$85,000', imponible: false },
            { name: 'Asignaci\u00F3n de Movilizaci\u00F3n', amount: '$70,000', imponible: false }
        ];
        mockData.total_earnings = '$3,255,000';
        mockData.deductions = [
            { name: 'AFP Provida (11.45%)', amount: '$354,950' },
            { name: 'Fonasa (7%)', amount: '$217,000' },
            { name: 'Seguro de Cesant\u00EDa (0.6%)', amount: '$18,600' },
            { name: 'Impuesto \u00DAnico 2da Cat.', amount: '$145,230' },
            { name: 'Anticipo de Sueldo', amount: '$500,000' }
        ];
        mockData.total_deductions = '$1,235,780';
        mockData.net_salary = '$2,019,220';
        mockData.net_uf = '54.23 UF';
        mockData.net_usd = '$2,145.50';
        mockData.signature_hash = '8fe4-99b2-ac11-2e55';
    } else {
        mockData.items = [
            { sku: 'SYS-SRV-01', name: 'Sincronizacion de Directorio Kommo', quantity: 'OK', low_stock: false },
            { sku: 'DOC-REP-02', name: 'Emision de Comprobantes Automatizados', quantity: 'PENDIENTE', low_stock: true },
            { sku: 'AI-ENG-03', name: 'Gemini Neural Processor Flash-Lite', quantity: 'ACTIVO', low_stock: false }
        ];
    }

    const isLandscape = (reportType || '').toLowerCase().includes('8-columnas');

    const template = handlebars.compile(design_html);
    const finalHtml = template(mockData);

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: 'domcontentloaded' });
    
    // Generar el Buffer del PDF
    const pdfBuffer = await page.pdf({ 
        format: 'A4',
        landscape: isLandscape,
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    await browser.close();

    const fileName = `Reporte_${reportType || 'Resumen'}_${Date.now()}.pdf`;

    // Subir a WhatsApp Media API
    const form = new FormData();
    const blob = new Blob([pdfBuffer as unknown as BlobPart], { type: 'application/pdf' });
    form.append('file', blob, fileName);
    form.append('type', 'document');
    form.append('messaging_product', 'whatsapp');

    const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${whatsappToken}` },
        body: form
    });
    
    const uploadData = await uploadRes.json();
    if (uploadData.error) throw new Error(uploadData.error.message);
    
    const mediaId = uploadData.id;

    // Enviar el Media ID como msj al usuario
    const sendRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: targetPhone,
            type: 'document',
            document: {
                id: mediaId,
                caption: '\uD83D\uDCC4 *Aqu\u00ED tienes tu reporte interactivo*\n\nOuroborusAI - Arise Chatbot ha finalizado la extracci\u00F3n de datos.',
                filename: fileName
            }
        })
    });

    const sendData = await sendRes.json();
    if (sendData.error) throw new Error(sendData.error.message);

    return NextResponse.json({ success: true, sendData });
  } catch (error: any) {
    console.error("PDF_PIPELINE_ERROR", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
