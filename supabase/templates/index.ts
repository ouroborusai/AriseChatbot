import prospecto from './01_bienvenida/01_A_bienvenida_prospecto.json';
import cliente from './01_bienvenida/01_B_menu_principal_cliente.json';

// Flujo Prospectos
import prospecto_cotizacion from './02_prospectos/02_A_prospecto_cotizacion.json';
import prospecto_faq from './02_prospectos/02_B_prospecto_faq.json';
import derivacion_asesor from './02_prospectos/02_C_derivacion_asesor.json';

// Flujo Clientes (03)
import bandeja_documentos from './03_clientes/03_A_bandeja_documentos.json';
import filtro_tiempo_docs from './03_clientes/03_A_filtro_tiempo.json';
import procesando_descarga from './03_clientes/03_A_procesando_descarga.json';
import buzon_recepcion from './03_clientes/03_B_buzon_recepcion.json';
import estado_cuenta from './03_clientes/03_C_estado_cuenta.json';
import solicitud_tramite from './03_clientes/03_D_solicitud_tramite.json';
import soporte_ejecutivo from './03_clientes/03_E_soporte_ejecutivo.json';
import validacion_cliente from './01_bienvenida/01_C_validacion_cliente.json';

export const systemTemplates = [
  prospecto,
  cliente,
  prospecto_cotizacion,
  prospecto_faq,
  derivacion_asesor,
  bandeja_documentos,
  filtro_tiempo_docs,
  procesando_descarga,
  buzon_recepcion,
  estado_cuenta,
  solicitud_tramite,
  soporte_ejecutivo,
  validacion_cliente
];
