
/**
 * ARISE PDF TEMPLATE ENGINE Diamond v10.1
 * Pure HTML/CSS for high-precision PDF generation via Puppeteer.
 */

export const baseStyles = `
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
  .container { width: 100%; max-width: 800px; margin: auto; background-color: #fff; padding: 30px; border: 1px solid #ddd; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
  .header { text-align: center; border-bottom: 2px solid #005a9c; padding-bottom: 20px; margin-bottom: 20px; }
  .header h1 { margin: 0; color: #003366; font-size: 22px; text-transform: uppercase; }
  .header p { margin: 5px 0 0; font-size: 14px; font-weight: bold; color: #333; }
  .report-meta { margin-bottom: 25px; font-size: 13px; }
  .report-meta p { margin: 4px 0; }
  .report-meta strong { display: inline-block; width: 140px; }
  h2 { color: #003366; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 16px; margin-top: 25px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
  th { background-color: #e9ecef; font-weight: bold; color: #003366; }
  .conclusion-box { margin-top: 25px; padding: 15px; border: 2px solid #d9534f; background-color: #fdf7f7; font-size: 13px; text-align: justify; }
  .conclusion-box h2 { margin-top: 0; color: #d9534f; border: none; }
  .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
  .signature { margin-top: 40px; border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; font-size: 11px; margin-left: auto; margin-right: auto; }
`;

export const templates: Record<string, string> = {
  columnas8: `
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
        Documento Certificado por <span class="diamond-accent">OuroborusAI - Arise Business OS Diamond v10.1</span>
      </div>
    </body>
    </html>
  `,
  balance: `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="bg-gradient"></div>
      <div class="header">
        <div>
          <h1 class="title">BALANCE CONTABLE CONSOLIDADO</h1>
          <div class="meta">Sistema de Inteligencia Financiera Diamond v10.1</div>
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
  `,
  invoice: `
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
  `,
  compliance: `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="header">
        <h1 class="title">CUMPLIMIENTO TRIBUTARIO (F29)</h1>
        <div class="meta">CERTIFICACIÓN ARISE ELITE Diamond v10.1</div>
      </div>
      <div class="glass-card">
        <h2 style="font-size: 14px;">Bitácora de Obligaciones</h2>
        {{#each items}}
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
          <div>
            <div style="font-weight: bold; color: #1e293b;">{{name}}</div>
            <div class="meta">Ref: {{sku}}</div>
          </div>
          <div><span class="badge {{#if low_stock}}badge-warning{{else}}badge-success{{/if}}">{{quantity}}</span></div>
        </div>
        {{/each}}
      </div>
    </body>
    </html>
  `,
  payroll: `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body style="padding: 30px;">
      <div class="header">
        <div>
          <h1 class="title" style="font-size: 18px;">LIQUIDACIÓN DE SUELDO</h1>
          <p class="meta" style="margin-top: 5px;">CERTIFICACIÓN LABORAL OUROBORUSAI Diamond v10.1</p>
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
  `,
  inventory: `
    <!DOCTYPE html>
    <html lang="es">
    <head><style>${baseStyles}</style></head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{{company_name}}</h1>
                <p>REPORTE MAESTRO DE INVENTARIO Y EXISTENCIAS</p>
            </div>
            <div class="report-meta">
                <p><strong>N° de Reporte:</strong> MMC-INV-{{folio}}</p>
                <p><strong>Fecha de Emisión:</strong> {{date}}</p>
                <p><strong>Operación:</strong> {{company_name}}</p>
            </div>
            <h2>1. DETALLE DE EXISTENCIAS DISPONIBLES</h2>
            <table>
                <thead>
                    <tr>
                        <th style="width: 20%;">SKU</th>
                        <th style="width: 55%;">Descripción del Producto</th>
                        <th style="width: 25%; text-align: center;">Stock Actual</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each items}}
                    <tr>
                        <td style="font-family: monospace; color: #64748b;">{{sku}}</td>
                        <td><strong>{{name}}</strong></td>
                        <td style="text-align: center; font-weight: bold; color: {{#if low_stock}}#ef4444{{else}}#10b981{{/if}};">
                            {{quantity}}
                        </td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
            <div class="conclusion-box">
                <h2>NOTAS DE AUDITORÍA</h2>
                <p>Este reporte ha sido generado automáticamente por Arise Business OS v10.1. El stock reflejado incluye las últimas transacciones procesadas por el motor OuroborusAI.</p>
            </div>
            <div class="signature">
                Control de Inventario<br>{{company_name}}
            </div>
            <div class="footer">
                <p>Juan Martínez #616, Iquique, Chile. - Tel: +56990062213</p>
            </div>
        </div>
    </body>
    </html>
  `,
  maintenance: `
    <!DOCTYPE html>
    <html lang="es">
    <head><style>${baseStyles}</style></head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{{company_name}}</h1>
                <p>INFORME TÉCNICO DE MANTENIMIENTO Y REPARACIÓN</p>
            </div>
            <div class="report-meta">
                <p><strong>N° de Informe:</strong> MMC-REP-{{report_id}}</p>
                <p><strong>Fecha:</strong> {{date}}</p>
                <p><strong>Cliente:</strong> {{client_name}}</p>
                <p><strong>Equipo:</strong> {{chair_id}}</p>
            </div>
            <h2>1. RESUMEN TÉCNICO</h2>
            <table>
                <thead>
                    <tr><th>Componente</th><th>Acción Realizada</th><th>Estado Final</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Sistema de Control</strong></td>
                        <td>Diagnóstico y calibración de joystick</td>
                        <td>OPERATIVO</td>
                    </tr>
                </tbody>
            </table>
            <div class="conclusion-box">
                <h2>DIAGNÓSTICO Y CONCLUSIÓN</h2>
                <p>{{damage_description}}</p>
            </div>
            <div class="signature">
                Manuel Cerda M.<br>{{company_name}}
            </div>
            <div class="footer">
                <p>{{company_name}} - Tel: +56990062213</p>
            </div>
        </div>
    </body>
    </html>
  `,
  retrieval: `
    <!DOCTYPE html>
    <html lang="es">
    <head><style>${baseStyles}</style></head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{{company_name}}</h1>
                <p>ACTA DE RETIRO Y RECEPCIÓN DE EQUIPO</p>
            </div>
            <div class="report-meta">
                <p><strong>Folio Retiro:</strong> MMC-RET-{{retiro_id}}</p>
                <p><strong>Fecha:</strong> {{date}}</p>
                <p><strong>Cliente:</strong> {{client_name}}</p>
                <p><strong>Equipo:</strong> {{chair_id}}</p>
            </div>
            <h2>1. ESTADO DE RECEPCIÓN</h2>
            <p>Se retira equipo para evaluación técnica. El cliente declara que el equipo se entrega con los siguientes accesorios:</p>
            <table>
                <thead>
                    <tr><th>Ítem</th><th>Estado al Retiro</th></tr>
                </thead>
                <tbody>
                    <tr><td>Estructura Chasis</td><td>Inspeccionado</td></tr>
                    <tr><td>Baterías / Cargador</td><td>Recibido</td></tr>
                </tbody>
            </table>
            <div class="conclusion-box">
                <h2>OBSERVACIONES INICIALES</h2>
                <p>El equipo se recibe para diagnóstico en taller central. Plazo estimado de evaluación: 48 horas.</p>
            </div>
            <div class="signature">
                Firma Cliente / Técnico Responsable<br>{{company_name}}
            </div>
            <div class="footer">
                <p>Juan Martínez #616, Iquique, Chile. - Tel: +56990062213</p>
            </div>
        </div>
    </body>
    </html>
  `,
  dashboard: `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="bg-gradient"></div>
      <div class="header">
        <div>
          <h1 class="title">DIAMOND EXECUTIVE DASHBOARD</h1>
          <div class="meta">Ouroborus Neural Architecture | Arise Business OS Diamond v10.1</div>
        </div>
        <div style="text-align: right">
          <div class="meta">EMITIDO: {{date}}</div>
          <div class="meta">CLIENTE: <span class="diamond-accent">{{company_name}}</span></div>
        </div>
      </div>

      <div class="glass-card">
        <h2 style="font-size: 16px; margin-top: 0">Síntesis de Operaciones</h2>
        <table>
          <thead>
            <tr>
              <th>MÓDULO / REF</th>
              <th>DEFINICIÓN</th>
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
  `,
  default: `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="header">
        <h1 class="title">REPORTE TÉCNICO: {{reportType}}</h1>
        <div class="meta">{{date}}</div>
      </div>
      <div class="glass-card">
        {{#each items}}
        <div style="margin-bottom: 8px; font-size: 13px;">• {{name}}: <span class="diamond-accent">{{quantity}}</span></div>
        {{/each}}
      </div>
      <div class="footer">Documento General Diamond v10.1</div>
    </body>
    </html>
  `
};
