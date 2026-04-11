import { Template } from '../types';

export const menuRenta: Template = {
  id: 'menu_renta',
  name: '3. Menú Renta',
  content: '📊 ¿Qué necesitas de tu declaración de renta?',
  category: 'tramites',
  service_type: 'renta',
  segment: 'cliente',
  is_active: true,
  priority: 16,
  workflow: 'renta',
  actions: [
    {
      type: 'list',
      title: 'Declaraciones Renta',
      description: 'Tus declaraciones',
      content: '{{renta_list}}'
    },
    {
      type: 'button',
      id: 'btn_renta_solicitar',
      title: '📝 Solicitar',
      next_template_id: 'renta_solicitar'
    },
    {
      type: 'button',
      id: 'btn_renta_otro',
      title: '📋 Ver otra',
      next_template_id: 'menu_renta'
    },
    {
      type: 'button',
      id: 'btn_renta_volver',
      title: '← Volver',
      next_template_id: 'menu_documentos'
    },
  ],
};

export const rentaSolicitar: Template = {
  id: 'renta_solicitar',
  name: '5. Solicitar Renta',
  content: 'Para solicitar tu declaración de renta, un asesor te contactará. ¿Confirmas?',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 26,
  workflow: 'renta',
  actions: [
    {
      type: 'button',
      id: 'btn_renta_si',
      title: '✅ Sí, contactar',
      next_template_id: 'derivacion_asesor'
    },
    {
      type: 'button',
      id: 'btn_renta_volver',
      title: '← Volver',
      next_template_id: 'menu_renta'
    },
  ],
};

export const rentaVerDocumento: Template = {
  id: 'renta_ver_documento',
  name: '6. Ver Renta',
  content: '📊 *Declaración de Renta*\n\nAño: {{anio}}\nTipo: {{tipo}}\nEstado: {{estado}}\n\nEnviando documento...',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 21,
  workflow: 'renta',
  actions: [
    {
      type: 'show_document',
      id: 'show_renta_doc',
      title: 'Ver documento',
      condition: {
        required_document_type: 'renta'
      },
      else_action: {
        type: 'show_message',
        message: 'No se encontró el documento específico. Un asesor te lo enviará pronto.'
      }
    },
    {
      type: 'button',
      id: 'btn_renta_otro',
      title: '📋 Ver otra declaración',
      next_template_id: 'menu_renta'
    },
    {
      type: 'button',
      id: 'btn_renta_volver_menu',
      title: '← Volver',
      next_template_id: 'menu_tramites'
    },
  ],
};

export const tramiteRentaInfo: Template = {
  id: 'tramite_renta_info',
  name: '3. Info Renta',
  content: '📊 *Servicio de Renta*\n\n• Declaración anual (Formulario 22)\n• Optimización fiscal\n• Pérdidas tributarias\n• Asesoramiento personalizado\n\n¿Necesitas algo específico?',
  category: 'tramites',
  service_type: 'renta',
  segment: 'todos',
  is_active: true,
  priority: 42,
  workflow: 'renta',
  actions: [
    {
      type: 'button',
      id: 'btn_renta_mas_info',
      title: '📝 Ver más servicios',
      next_template_id: 'servicios_general'
    },
    {
      type: 'button',
      id: 'btn_renta_cotizar',
      title: '💼 Cotizar',
      next_template_id: 'cotizacion_info'
    },
  ],
};
