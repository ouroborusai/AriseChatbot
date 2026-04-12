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

export const systemTemplates = [
  prospecto,
  cliente,
  prospecto_cotizacion,
  prospecto_faq,
  derivacion_asesor,
  bandeja_documentos,
  filtro_tiempo_docs,
  procesando_descarga
];
