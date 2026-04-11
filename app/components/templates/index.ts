import { Template } from './types';
import * as bienvenida from './data/bienvenida';
import * as iva from './data/iva';
import * as renta from './data/renta';
import * as nomina from './data/nomina';
import * as balances from './data/balances';
import * as cobranza from './data/cobranza';
import * as general from './data/general';

export * from './types';
export * from './config';
export * from './helpers';
export { default as TemplateDetailPanel } from './TemplateDetailPanel';
export { default as TemplateEditor } from './TemplateEditor';
export { default as FlowMap } from './FlowMap';
export { default as FlowCanvas } from './FlowCanvas';

/**
 * Consolidación de TODAS las plantillas disponibles
 * Organizado por flujos lógicos de navegación
 *
 * ESTRUCTURA DE FLUJOS:
 *
 * 1. CLIENTE (segment: 'cliente')
 *    └─ Menú Principal → Mis Datos / Trámites / Documentos
 *       ├─ Trámites → IVA / Renta / Nómina / Balances
 *       └─ Documentos → Ver/Solicitar
 *
 * 2. PROSPECTO (segment: 'prospecto')
 *    └─ Bienvenida → Cotización / Servicios / Asesor
 *
 * 3. TRANSVERSALES (segment: 'todos')
 *    └─ Derivación a asesor / Gracias / Cobranza
 */
export const DEFAULT_TEMPLATES: Template[] = [
  // ============================================
  // 🟢 FLUJO PRINCIPAL CLIENTE
  // ============================================
  bienvenida.menuPrincipalCliente,     // Nodo raíz cliente
  bienvenida.menuMisDatos,             // → Datos personales
  bienvenida.menuEmpresas,             // → Empresas vinculadas
  bienvenida.sinEmpresas,              // → Fallback sin empresas
  bienvenida.menuTramites,             // → Categorías de trámites
  general.menuDocumentos,              // → Documentos disponibles

  // ============================================
  // 🟡 FLUJO IVA (5 plantillas)
  // ============================================
  iva.menuIva,                         // Menú principal IVA
  iva.ivaNoDisponible,                 // Fallback sin documentos
  iva.ivaSolicitar,                    // Solicitar nuevo IVA
  iva.ivaVerDocumento,                 // Ver documento específico
  iva.tramiteIvaInfo,                  // Info servicio IVA

  // ============================================
  // 🔵 FLUJO RENTA (4 plantillas)
  // ============================================
  renta.menuRenta,                     // Menú principal Renta
  renta.rentaSolicitar,                // Solicitar declaración
  renta.rentaVerDocumento,             // Ver documento específico
  renta.tramiteRentaInfo,              // Info servicio Renta

  // ============================================
  // 🟣 FLUJO NÓMINA (6 plantillas)
  // ============================================
  nomina.menuNomina,                   // Menú principal Nómina
  nomina.nominaLiquidaciones,          // Ver liquidaciones
  nomina.nominaContratos,              // Ver contratos
  nomina.nominaSolicitar,              // Solicitar documento
  nomina.nominaVerLiquidacion,         // Ver liquidación específica
  nomina.nominaVerContrato,            // Ver contrato específico

  // ============================================
  // 🟠 FLUJO BALANCES (3 plantillas)
  // ============================================
  balances.menuBalance,                // Menú principal Balances
  balances.balanceSolicitar,           // Solicitar balance
  balances.balanceVerDocumento,        // Ver balance específico

  // ============================================
  // 🔴 FLUJO COBRANZA (3 plantillas)
  // ============================================
  cobranza.cobranzaRecordatorio,       // Recordatorio pago
  cobranza.cobranzaDetalles,           // Detalles deuda
  cobranza.cobranzaConfirmar,          // Confirmación pago

  // ============================================
  // 🟣 FLUJO PROSPECTO
  // ============================================
  bienvenida.bienvenidaProspecto,      // Nodo raíz prospecto
  general.cotizacionInfo,              // Info cotización
  general.cotizacionRecoger,           // Recoger datos
  general.serviciosGeneral,            // Lista de servicios

  // ============================================
  // ⚪ FLUJOS TRANSVERSALES (todos los segmentos)
  // ============================================
  general.derivacionAsesor,            // Derivar a humano
  general.derivacionConfirmar,         // Confirmar derivación
  general.gracias,                     // Cierre/conclusión
  general.confirmacionRecepcion,       // Confirmar recepción docs
  general.solicitarDocumento,          // Solicitar doc genérico
  general.actualizarEmail,             // Actualizar email
  general.actualizarTelefono,          // Actualizar teléfono
  general.vincularEmpresa,             // Vincular empresa
  general.seleccionarEmpresa,          // Selector de empresa
];
