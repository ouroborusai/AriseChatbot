import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/**
 *  ARISE DOCUMENT TEMPLATE v12.0 (Diamond Resilience)
 *  Estética Luminous Pure: borderRadius: 40px, Color: #22c55e.
 *  Cero 'any'. 
 */

const DEEP_SLATE   = '#0f172a';
const ARISE_GREEN   = '#22c55e'; // Verde Institucional Diamond
const SLATE_500    = '#64748b';
const SLATE_200    = '#e2e8f0';
const SLATE_50     = '#f8fafc';

const base = StyleSheet.create({
  page:        { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica', fontSize: 9 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', padding: 25, marginBottom: 20, backgroundColor: SLATE_50, borderRadius: 40 },
  brandName:   { fontSize: 14, fontWeight: 'bold', color: DEEP_SLATE, letterSpacing: 1 },
  brandSub:    { fontSize: 8, color: SLATE_500, marginTop: 4 },
  reportTitle: { fontSize: 18, fontWeight: 'bold', color: ARISE_GREEN, textAlign: 'right', textTransform: 'uppercase' },
  reportMeta:  { fontSize: 8, color: SLATE_500, textAlign: 'right', marginTop: 4 },
  table:       { width: '100%', marginTop: 10 },
  thRow:       { flexDirection: 'row', backgroundColor: DEEP_SLATE, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 40 },
  thCell:      { color: '#ffffff', fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingHorizontal: 5 },
  tdRow:       { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: SLATE_200, paddingVertical: 8, alignItems: 'center' },
  tdRowZebra:  { backgroundColor: SLATE_50 },
  tdLeft:      { fontSize: 9, color: DEEP_SLATE, paddingLeft: 8 },
  tdRight:     { fontSize: 9, color: DEEP_SLATE, textAlign: 'right', paddingRight: 8, fontWeight: 'bold' },
  footer:      { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: SLATE_200, paddingTop: 10, textAlign: 'center' },
  footerText:  { fontSize: 7, color: SLATE_500, marginBottom: 2 }
});

const formatCurrency = (valValue: string | number) => {
  const num = Number(valValue);
  if (isNaN(num)) return String(valValue);
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(num);
};

interface RowData {
  sku?: string;
  name?: string;
  description?: string;
  label?: string;
  quantity?: number;
  amount?: number;
  total?: number;
  value?: string | number;
}

interface AriseDocumentProps {
  reportType: string;
  companyName: string;
  date: string;
  data: {
    period?: string;
    company_rut?: string;
    folio?: string;
    rows?: RowData[];
    items?: RowData[];
    accounts?: RowData[];
    [key: string]: unknown;
  };
}

export const AriseDocument = ({ reportType, companyName, date, data }: AriseDocumentProps) => {
  const isWide = reportType.includes('8columnas') || reportType.includes('inventario');
  const orientation = isWide ? 'landscape' : 'portrait';

  const currentMonth = new Intl.DateTimeFormat('es-CL', { month: 'long' }).format(new Date());
  const currentYear = new Date().getFullYear();
  const displayPeriod = data.period || `${currentMonth.toUpperCase()} ${currentYear}`;

  const rows: RowData[] = data.rows || data.items || data.accounts || 
                Object.entries(data)
                .filter(([k]) => !['period', 'company_rut', 'folio', 'rows', 'items', 'accounts'].includes(k))
                .map(([k, v]) => ({ label: k, value: v as string | number }));

  return (
    <Document title={`ARISE_Report_${reportType}`}>
      <Page size="A4" orientation={orientation} style={base.page}>
        {/* Header ARISE Diamond */}
        <View style={base.header}>
          <View>
            <Text style={base.brandName}>{companyName.toUpperCase()}</Text>
            <Text style={base.brandSub}>RUT: {data.company_rut || 'N/A'}</Text>
            <Text style={base.brandSub}>FOLIO: {data.folio || 'INTERNAL'}</Text>
          </View>
          <View>
            <Text style={base.reportTitle}>{reportType.replace('pdf_', '').replace(/_/g, ' ')}</Text>
            <Text style={base.reportMeta}>Fecha Emisión: {date}</Text>
            <Text style={base.reportMeta}>Periodo: {displayPeriod}</Text>
          </View>
        </View>

        {/* Tabla de Datos Certificada */}
        <View style={base.table}>
          <View style={base.thRow}>
            <Text style={[base.thCell, { flex: isWide ? 4 : 3 }]}>DESCRIPCIÓN / CONCEPTO</Text>
            <Text style={[base.thCell, { flex: 1 }]}>TOTAL / VALOR</Text>
          </View>

          {rows.map((row, i) => (
            <View key={i} style={[base.tdRow, i % 2 === 0 ? base.tdRowZebra : {}]} wrap={false}>
              <View style={{ flex: isWide ? 4 : 3 }}>
                <Text style={base.tdLeft}>
                  {row.sku ? `[${row.sku}] ` : ''}
                  {row.name || row.description || row.label || 'N/A'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={base.tdRight}>
                  {row.quantity !== undefined ? row.quantity : formatCurrency(row.amount || row.total || row.value || 0)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer ARISE Protocol */}
        <View style={base.footer}>
          <Text style={base.footerText}>Generado por Ouroborus AI · ARISE Business OS v12.0 Diamond Resilience</Text>
          <Text style={base.footerText}>Documento Certificado vía Supabase · Cloud Engine: Google Gemini 2.5-flash-lite</Text>
        </View>

      </Page>
    </Document>
  );
};
