import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ─── Arise Industrial Palette (Diamond v10.2 / Luminous Pure) ───────────────
const LOOP_GREEN   = '#22c55e';
const DEEP_SLATE   = '#0f172a';
const SLATE_500    = '#64748b';
const SLATE_200    = '#e2e8f0';
const SLATE_50     = '#f8fafc';
const GREEN_50     = '#f0fdf4';
const RED_600      = '#dc2626';

const base = StyleSheet.create({
  page:        { padding: 32, backgroundColor: '#ffffff', fontFamily: 'Helvetica', fontSize: 8 },
  pageLand:    { padding: 28, backgroundColor: '#ffffff', fontFamily: 'Helvetica', fontSize: 7 },

  // ── Header ──────────────────────────────────────────────────────────────────
  header:      { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: DEEP_SLATE, paddingBottom: 12, marginBottom: 16 },
  brandName:   { fontSize: 11, fontWeight: 'bold', color: DEEP_SLATE },
  brandSub:    { fontSize: 7, color: SLATE_500, marginTop: 2 },
  reportTitle: { fontSize: 14, fontWeight: 'bold', color: DEEP_SLATE, textAlign: 'right', textTransform: 'uppercase' },
  reportMeta:  { fontSize: 7, color: SLATE_500, textAlign: 'right', marginTop: 3 },
  badge:       { marginTop: 4, backgroundColor: LOOP_GREEN, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-end' },
  badgeText:   { fontSize: 6, color: '#ffffff', fontWeight: 'bold' },

  // ── Table commons ───────────────────────────────────────────────────────────
  table:       { width: '100%', marginTop: 8 },
  thRow:       { flexDirection: 'row', backgroundColor: DEEP_SLATE, paddingVertical: 5 },
  thCell:      { color: '#ffffff', fontWeight: 'bold', fontSize: 7, textAlign: 'center', paddingHorizontal: 3 },
  thLeft:      { color: '#ffffff', fontWeight: 'bold', fontSize: 7, paddingLeft: 6 },
  subThRow:    { flexDirection: 'row', backgroundColor: '#1e293b', paddingVertical: 3 },
  subThCell:   { color: '#94a3b8', fontSize: 6, textAlign: 'center', paddingHorizontal: 2 },
  tdRow:       { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: SLATE_200, paddingVertical: 5, alignItems: 'center' },
  tdRowAlt:    { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: SLATE_200, paddingVertical: 5, alignItems: 'center', backgroundColor: SLATE_50 },
  tdLeft:      { fontSize: 7, color: DEEP_SLATE, paddingLeft: 6 },
  tdRight:     { fontSize: 7, color: DEEP_SLATE, textAlign: 'right', paddingRight: 6 },
  tdCenter:    { fontSize: 7, color: DEEP_SLATE, textAlign: 'center' },
  totalRow:    { flexDirection: 'row', backgroundColor: DEEP_SLATE, paddingVertical: 6, marginTop: 2 },
  totalLabel:  { color: '#ffffff', fontWeight: 'bold', fontSize: 7, paddingLeft: 6 },
  totalAmt:    { color: LOOP_GREEN, fontWeight: 'bold', fontSize: 7, textAlign: 'right', paddingRight: 6 },
  totalAmtRed: { color: '#fca5a5', fontWeight: 'bold', fontSize: 7, textAlign: 'right', paddingRight: 6 },

  // ── Signatures & Footer ──────────────────────────────────────────────────────
  sigArea:     { marginTop: 50, flexDirection: 'row', justifyContent: 'space-around' },
  sigBox:      { width: 180, borderTopWidth: 1, borderTopColor: DEEP_SLATE, paddingTop: 8, textAlign: 'center' },
  sigTitle:    { fontSize: 8, fontWeight: 'bold', color: DEEP_SLATE, textTransform: 'uppercase' },
  sigSub:      { fontSize: 6, color: SLATE_500, marginTop: 2 },
  footer:      { position: 'absolute', bottom: 24, left: 32, right: 32, borderTopWidth: 1, borderTopColor: SLATE_200, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerL:     { fontSize: 6, color: SLATE_500 },
  footerR:     { fontSize: 6, color: LOOP_GREEN, fontWeight: 'bold' },
});

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 1: BALANCE 8 COLUMNAS
// ─────────────────────────────────────────────────────────────────────────────
const Layout8Columnas = ({ data }: { data: any }) => (
  <View style={base.table}>
    {/* Group header */}
    <View style={{ flexDirection: 'row', backgroundColor: '#1e293b', paddingVertical: 4 }}>
      <View style={{ flex: 3 }}><Text style={[base.thLeft, { fontSize: 6 }]}>CUENTA CONTABLE</Text></View>
      {['SUMAS', 'SALDOS', 'INVENTARIO', 'RESULTADO'].map(g => (
        <View key={g} style={{ flex: 2, borderLeftWidth: 1, borderLeftColor: '#334155' }}>
          <Text style={[base.thCell, { fontSize: 6 }]}>{g}</Text>
        </View>
      ))}
    </View>
    {/* Sub-header */}
    <View style={base.subThRow}>
      <View style={{ flex: 3 }} />
      {['DÉBITOS','CRÉDITOS','DEUDOR','ACREEDOR','ACTIVO','PASIVO','PÉRDIDAS','GANANCIAS'].map(s => (
        <View key={s} style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: '#334155' }}>
          <Text style={base.subThCell}>{s}</Text>
        </View>
      ))}
    </View>
    {/* Rows */}
    {(data.accounts || []).map((acc: any, i: number) => (
      <View key={i} style={i % 2 === 0 ? base.tdRow : base.tdRowAlt}>
        <Text style={[base.tdLeft, { flex: 3, fontSize: 6.5 }]}>{acc.name}</Text>
        {[acc.sum_debit, acc.sum_credit, acc.balance_deudor, acc.balance_acreedor,
          acc.inventory_asset, acc.inventory_liability, acc.result_loss, acc.result_gain
        ].map((v, j) => (
          <Text key={j} style={[base.tdRight, { flex: 1, fontSize: 6.5 }]}>{v || '-'}</Text>
        ))}
      </View>
    ))}
    {/* Totals */}
    <View style={base.totalRow}>
      <Text style={[base.totalLabel, { flex: 3 }]}>TOTALES DEFINITIVOS</Text>
      {[data.totals?.sum_debit, data.totals?.sum_credit, data.totals?.balance_deudor,
        data.totals?.balance_acreedor, data.totals?.inventory_asset, data.totals?.inventory_liability,
        data.totals?.result_loss, data.totals?.result_gain
      ].map((v, i) => (
        <Text key={i} style={[base.totalAmt, { flex: 1 }]}>{v || '0'}</Text>
      ))}
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 2: INVENTARIO
// ─────────────────────────────────────────────────────────────────────────────
const LayoutInventario = ({ data }: { data: any }) => (
  <View style={base.table}>
    <View style={base.thRow}>
      <Text style={[base.thCell, { flex: 1 }]}>SKU</Text>
      <Text style={[base.thLeft, { flex: 4 }]}>DESCRIPCIÓN DEL PRODUCTO</Text>
      <Text style={[base.thCell, { flex: 1 }]}>CATEGORÍA</Text>
      <Text style={[base.thCell, { flex: 1 }]}>STOCK</Text>
      <Text style={[base.thCell, { flex: 1 }]}>PRECIO UNIT.</Text>
      <Text style={[base.thCell, { flex: 1.5 }]}>VALOR TOTAL</Text>
    </View>
    {(data.items || []).map((item: any, i: number) => (
      <View key={i} style={i % 2 === 0 ? base.tdRow : base.tdRowAlt}>
        <Text style={[base.tdCenter, { flex: 1, color: SLATE_500 }]}>{item.sku || '-'}</Text>
        <Text style={[base.tdLeft, { flex: 4, fontWeight: 'bold' }]}>{item.name}</Text>
        <Text style={[base.tdCenter, { flex: 1 }]}>{item.category || '-'}</Text>
        <Text style={[base.tdCenter, { flex: 1, color: item.quantity > 10 ? LOOP_GREEN : RED_600, fontWeight: 'bold' }]}>{item.quantity}</Text>
        <Text style={[base.tdRight, { flex: 1 }]}>{item.price || '-'}</Text>
        <Text style={[base.tdRight, { flex: 1.5, fontWeight: 'bold' }]}>{item.total_value || '-'}</Text>
      </View>
    ))}
    <View style={base.totalRow}>
      <Text style={[base.totalLabel, { flex: 7 }]}>TOTAL VALORIZADO EN INVENTARIO</Text>
      <Text style={[base.totalAmt, { flex: 1.5 }]}>{data.total_value || '$0'}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 3: ESTADO DE RESULTADOS (P&L)
// ─────────────────────────────────────────────────────────────────────────────
const LayoutEstadoResultados = ({ data }: { data: any }) => (
  <View style={base.table}>
    <View style={base.thRow}>
      <Text style={[base.thLeft, { flex: 5 }]}>CONCEPTO</Text>
      <Text style={[base.thCell, { flex: 2 }]}>PERÍODO ACTUAL</Text>
      <Text style={[base.thCell, { flex: 2 }]}>PERÍODO ANTERIOR</Text>
      <Text style={[base.thCell, { flex: 1.5 }]}>VARIACIÓN %</Text>
    </View>
    {(data.lines || []).map((line: any, i: number) => (
      <View key={i} style={line.is_section
        ? { flexDirection: 'row', backgroundColor: GREEN_50, paddingVertical: 6, borderLeftWidth: 3, borderLeftColor: LOOP_GREEN }
        : (i % 2 === 0 ? base.tdRow : base.tdRowAlt)
      }>
        <Text style={[base.tdLeft, { flex: 5, fontWeight: line.is_section ? 'bold' : 'normal', color: line.is_section ? LOOP_GREEN : DEEP_SLATE }]}>
          {line.is_section ? '▸ ' : '    '}{line.name}
        </Text>
        <Text style={[base.tdRight, { flex: 2, fontWeight: line.is_section ? 'bold' : 'normal' }]}>{line.current || '-'}</Text>
        <Text style={[base.tdRight, { flex: 2, color: SLATE_500 }]}>{line.previous || '-'}</Text>
        <Text style={[base.tdCenter, { flex: 1.5, color: parseFloat(line.variation || '0') >= 0 ? LOOP_GREEN : RED_600, fontWeight: 'bold' }]}>
          {line.variation ? `${line.variation}%` : '-'}
        </Text>
      </View>
    ))}
    {/* Resultado Final */}
    <View style={[base.totalRow, { marginTop: 8 }]}>
      <Text style={[base.totalLabel, { flex: 5 }]}>RESULTADO DEL EJERCICIO</Text>
      <Text style={[base.totalAmt, { flex: 2 }]}>{data.net_result || '$0'}</Text>
      <Text style={[base.totalAmt, { flex: 2 }]}>{data.prev_net_result || '$0'}</Text>
      <Text style={[base.totalAmt, { flex: 1.5 }]}>{data.result_variation || '-'}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 4: REPORTE DE VENTAS MENSUAL
// ─────────────────────────────────────────────────────────────────────────────
const LayoutVentasMensual = ({ data }: { data: any }) => (
  <View style={base.table}>
    <View style={base.thRow}>
      <Text style={[base.thLeft, { flex: 1 }]}>MES</Text>
      <Text style={[base.thCell, { flex: 1 }]}>N° DOCS</Text>
      <Text style={[base.thCell, { flex: 2 }]}>NETO</Text>
      <Text style={[base.thCell, { flex: 2 }]}>IVA</Text>
      <Text style={[base.thCell, { flex: 2 }]}>TOTAL</Text>
      <Text style={[base.thCell, { flex: 1.5 }]}>% PART.</Text>
    </View>
    {(data.months || []).map((m: any, i: number) => (
      <View key={i} style={i % 2 === 0 ? base.tdRow : base.tdRowAlt}>
        <Text style={[base.tdLeft, { flex: 1, fontWeight: 'bold' }]}>{m.label}</Text>
        <Text style={[base.tdCenter, { flex: 1 }]}>{m.docs}</Text>
        <Text style={[base.tdRight, { flex: 2 }]}>{m.net}</Text>
        <Text style={[base.tdRight, { flex: 2, color: SLATE_500 }]}>{m.tax}</Text>
        <Text style={[base.tdRight, { flex: 2, fontWeight: 'bold' }]}>{m.total}</Text>
        <Text style={[base.tdCenter, { flex: 1.5, color: LOOP_GREEN }]}>{m.participation}%</Text>
      </View>
    ))}
    <View style={base.totalRow}>
      <Text style={[base.totalLabel, { flex: 1 }]}>TOTAL ANUAL</Text>
      <Text style={[base.totalAmt, { flex: 1 }]}>{data.total_docs}</Text>
      <Text style={[base.totalAmt, { flex: 2 }]}>{data.total_net}</Text>
      <Text style={[base.totalAmt, { flex: 2 }]}>{data.total_tax}</Text>
      <Text style={[base.totalAmt, { flex: 2 }]}>{data.total_amount}</Text>
      <Text style={[base.totalAmt, { flex: 1.5 }]}>100%</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 5: LIBRO DE REMUNERACIONES
// ─────────────────────────────────────────────────────────────────────────────
const LayoutRemuneraciones = ({ data }: { data: any }) => (
  <View style={base.table}>
    <View style={base.thRow}>
      <Text style={[base.thLeft, { flex: 3 }]}>TRABAJADOR</Text>
      <Text style={[base.thCell, { flex: 1 }]}>RUT</Text>
      <Text style={[base.thCell, { flex: 1.5 }]}>SUELDO BASE</Text>
      <Text style={[base.thCell, { flex: 1.5 }]}>HABERES</Text>
      <Text style={[base.thCell, { flex: 1.5 }]}>DESCUENTOS</Text>
      <Text style={[base.thCell, { flex: 1.5 }]}>LÍQUIDO A PAGAR</Text>
    </View>
    {(data.employees || []).map((emp: any, i: number) => (
      <View key={i} style={i % 2 === 0 ? base.tdRow : base.tdRowAlt}>
        <Text style={[base.tdLeft, { flex: 3, fontWeight: 'bold' }]}>{emp.name}</Text>
        <Text style={[base.tdCenter, { flex: 1, color: SLATE_500 }]}>{emp.rut}</Text>
        <Text style={[base.tdRight, { flex: 1.5 }]}>{emp.base}</Text>
        <Text style={[base.tdRight, { flex: 1.5, color: LOOP_GREEN }]}>{emp.allowances}</Text>
        <Text style={[base.tdRight, { flex: 1.5, color: RED_600 }]}>{emp.deductions}</Text>
        <Text style={[base.tdRight, { flex: 1.5, fontWeight: 'bold' }]}>{emp.net_pay}</Text>
      </View>
    ))}
    <View style={base.totalRow}>
      <Text style={[base.totalLabel, { flex: 4 }]}>TOTAL PLANILLA</Text>
      <Text style={[base.totalAmt, { flex: 1.5 }]}>{data.total_base}</Text>
      <Text style={[base.totalAmt, { flex: 1.5 }]}>{data.total_allowances}</Text>
      <Text style={[base.totalAmtRed, { flex: 1.5 }]}>{data.total_deductions}</Text>
      <Text style={[base.totalAmt, { flex: 1.5 }]}>{data.total_net}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const REPORT_LABELS: Record<string, string> = {
  '8-columnas':        'BALANCE GENERAL 8 COLUMNAS',
  'inventory':         'INFORME DE INVENTARIO',
  'estado-resultados': 'ESTADO DE RESULTADOS',
  'ventas-mensual':    'REPORTE DE VENTAS MENSUAL',
  'remuneraciones':    'LIBRO DE REMUNERACIONES',
};

export const AriseDocument = ({ reportType, companyName, date, data }: {
  reportType: string;
  companyName: string;
  date: string;
  data: any;
}) => {
  const isLandscape = reportType === '8-columnas' || reportType === 'remuneraciones';
  const title = REPORT_LABELS[reportType] || reportType.toUpperCase();

  const renderBody = () => {
    switch (reportType) {
      case '8-columnas':        return <Layout8Columnas data={data} />;
      case 'inventory':         return <LayoutInventario data={data} />;
      case 'estado-resultados': return <LayoutEstadoResultados data={data} />;
      case 'ventas-mensual':    return <LayoutVentasMensual data={data} />;
      case 'remuneraciones':    return <LayoutRemuneraciones data={data} />;
      default:                  return <Layout8Columnas data={data} />;
    }
  };

  return (
    <Document>
      <Page size="A4" orientation={isLandscape ? 'landscape' : 'portrait'} style={isLandscape ? base.pageLand : base.page}>
        {/* ── Header ── */}
        <View style={base.header}>
          <View>
            <Text style={base.brandName}>{companyName}</Text>
            <Text style={base.brandSub}>RUT: {data.company_rut || '76.XXX.XXX-X'}</Text>
            <Text style={base.brandSub}>{data.company_address || 'Arise Business OS'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={base.reportTitle}>{title}</Text>
            <Text style={base.reportMeta}>PERÍODO: {data.period || 'ABRIL 2026'}</Text>
            <Text style={base.reportMeta}>Emitido: {date}  |  Folio #{data.folio || '001'}</Text>
            <View style={base.badge}><Text style={base.badgeText}>💎 ARISE DIAMOND v10.2</Text></View>
          </View>
        </View>

        {/* ── Body ── */}
        {renderBody()}

        {/* ── Signatures ── */}
        <View style={base.sigArea}>
          <View style={base.sigBox}>
            <Text style={base.sigTitle}>CONTADOR</Text>
            <Text style={base.sigSub}>Validación de Integridad</Text>
          </View>
          <View style={base.sigBox}>
            <Text style={base.sigTitle}>REPRESENTANTE LEGAL</Text>
            <Text style={base.sigSub}>{data.rep_legal || 'Firma Autorizada'}</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={base.footer}>
          <Text style={base.footerL}>OuroborusAI · Arise Business OS Diamond v10.2 · Luminous Pure Protocol</Text>
          <Text style={base.footerR}>Handshake Neural v61 ✓</Text>
        </View>
      </Page>
    </Document>
  );
};
