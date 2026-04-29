import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ─── Arise Industrial Palette (Diamond v10.2 / Luminous Pure) ───────────────
const DEEP_SLATE   = '#0f172a';
const LOOP_GREEN   = '#22c55e';
const SLATE_500    = '#64748b';
const SLATE_200    = '#e2e8f0';
const SLATE_50     = '#f8fafc'; // Color para Zebra Striping

const base = StyleSheet.create({
  page:        { padding: 32, backgroundColor: '#ffffff', fontFamily: 'Helvetica', fontSize: 8 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 3, borderBottomColor: LOOP_GREEN, paddingBottom: 12, marginBottom: 16 },
  brandName:   { fontSize: 12, fontWeight: 'bold', color: DEEP_SLATE },
  brandSub:    { fontSize: 7, color: SLATE_500, marginTop: 2 },
  reportTitle: { fontSize: 16, fontWeight: 'bold', color: DEEP_SLATE, textAlign: 'right', textTransform: 'uppercase' },
  reportMeta:  { fontSize: 7, color: SLATE_500, textAlign: 'right', marginTop: 3 },
  table:       { width: '100%', marginTop: 8 },
  thRow:       { flexDirection: 'row', backgroundColor: DEEP_SLATE, paddingVertical: 6 },
  thCell:      { color: '#ffffff', fontWeight: 'bold', fontSize: 8, textAlign: 'center', paddingHorizontal: 3 },
  tdRow:       { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: SLATE_200, paddingVertical: 6, alignItems: 'center' },
  tdRowZebra:  { backgroundColor: SLATE_50 }, // Zebra Striping
  tdLeft:      { fontSize: 8, color: DEEP_SLATE, paddingLeft: 6 },
  tdRight:     { fontSize: 8, color: DEEP_SLATE, textAlign: 'right', paddingRight: 6, fontWeight: 'bold' },
  footer:      { position: 'absolute', bottom: 24, left: 32, right: 32, borderTopWidth: 1, borderTopColor: SLATE_200, paddingTop: 6, textAlign: 'center' },
  footerText:  { fontSize: 6, color: SLATE_500 }
});

const formatCurrency = (valValue: any) => {
  const num = Number(valValue);
  if (isNaN(num)) return valValue;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(num);
};

export const AriseDocument = ({ reportType, companyName, date, data }: any) => {
  // 1. Detección de Orientación (LM Protocol)
  const isWide = reportType.includes('8columnas') || reportType.includes('inventario');
  const orientation = isWide ? 'landscape' : 'portrait';

  // LM Audit: Dynamic Period (F4 Fix)
  const currentMonth = new Intl.DateTimeFormat('es-CL', { month: 'long' }).format(new Date());
  const currentYear = new Date().getFullYear();
  const displayPeriod = data.period || `${currentMonth.toUpperCase()} ${currentYear}`;

  // 2. Extracción de Filas
  const rows = data.rows || data.items || data.accounts || 
               Object.entries(data).filter(([k]) => k !== 'period' && k !== 'company_rut').map(([k, v]) => ({ label: k, value: v }));

  return (
    <Document title={`Reporte_${reportType}`}>
      <Page size="A4" orientation={orientation} style={base.page}>
        {/* Header Corporativo */}
        <View style={base.header}>
          <View>
            <Text style={base.brandName}>{companyName}</Text>
            <Text style={base.brandSub}>RUT: {data.company_rut || 'N/A'}</Text>
          </View>
          <View>
            <Text style={base.reportTitle}>{reportType.replace('pdf_', '').replace('_', ' ')}</Text>
            <Text style={base.reportMeta}>Fecha: {date}</Text>
            <Text style={base.reportMeta}>Periodo: {displayPeriod}</Text>
          </View>
        </View>

        {/* Body: Mapeo de Tablas de Alta Precisión */}
        <View style={base.table}>
          <View style={base.thRow}>
            <Text style={[base.thCell, { flex: isWide ? 4 : 3 }]}>CONCEPTO / ITEM</Text>
            <Text style={[base.thCell, { flex: 1 }]}>TOTAL</Text>
          </View>

          {rows.map((row: any, i: number) => (
            <View key={i} style={[base.tdRow, i % 2 === 0 ? base.tdRowZebra : {}]} wrap={false}>
              <View style={{ flex: isWide ? 4 : 3 }}>
                <Text style={base.tdLeft}>
                  {row.sku ? `[${row.sku}] ` : ''}
                  {row.name || row.description || row.label || 'N/A'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={base.tdRight}>
                  {row.quantity || formatCurrency(row.amount || row.total || row.value || '0')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer Platinum */}
        <View style={base.footer}>
          <Text style={base.footerText}>Generado por OuroborusAI · Arise Business OS · Diamond v10.2 Platinum</Text>
          <Text style={base.footerText}>Orientación: {orientation.toUpperCase()} | Fuente de Verdad: Supabase</Text>
        </View>
      </Page>
    </Document>
  );
};
