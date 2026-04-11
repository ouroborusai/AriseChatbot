import { Template } from '../types';

export const menuIva: Template = {
  id: 'menu_iva',
  name: '3. Menú IVA',
  content: '🧾 Aquí están tus declaraciones de IVA. ¿Cuál necesitas ver?',
  category: 'tramites',
  service_type: 'iva',
  segment: 'cliente',
  is_active: true,
  priority: 15,
  workflow: 'iva',
  rules: {
    required_context: {
      min_document_count: 1,
      required_document_type: 'iva'
    },
    fallback_template_id: 'iva_no_disponible'
  },
  actions: [
    {
      type: 'list',
      title: 'IVAs',
      description: 'Tus declaraciones de IVA',
      content: '{{iva_list}}'
    },
    {
      type: 'button',
      id: 'btn_iva_solicitar',
      title: '📋 Solicitar IVA',
      next_template_id: 'iva_solicitar'
    },
    {
      type: 'button',
      id: 'btn_iva_otro',
      title: '📋 Ver otro IVA',
      next_template_id: 'menu_iva'
    },
    {
      type: 'button',
      id: 'btn_iva_volver',
      title: '← Volver',
      next_template_id: 'menu_tramites'
    },
  ],
};

export const ivaNoDisponible: Template = {
  id: 'iva_no_disponible',
  name: 'IVA No Disponible',
  content: '🧾 No tengo IVAs declarados cargados aún para tu empresa.\n\n¿Prefieres solicitar uno o hablar con un asesor?',
  category: 'documentos',
  service_type: 'iva',
  segment: 'cliente',
  is_active: true,
  priority: 16,
  workflow: 'iva',
  actions: [
    {
      type: 'button',
      id: 'btn_iva_solicitar',
      title: '📋 Solicitar IVA',
      next_template_id: 'iva_solicitar'
    },
    {
      type: 'button',
      id: 'btn_asesor_iva',
      title: '📞 Hablar con asesor',
      next_template_id: 'derivacion_asesor'
    },
  ],
};

export const ivaSolicitar: Template = {
  id: 'iva_solicitar',
  name: '5. Solicitar IVA',
  content: 'Para solicitar una declaración de IVA específica, necesito que un asesor te contacte. ¿Confirmas que quieres que te llamemos?',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 25,
  workflow: 'iva',
  actions: [
    {
      type: 'button',
      id: 'btn_iva_si',
      title: '✅ Sí, contactar',
      next_template_id: 'derivacion_asesor'
    },
    {
      type: 'button',
      id: 'btn_iva_no',
      title: '← Volver',
      next_template_id: 'menu_iva'
    },
  ],
};

export const ivaVerDocumento: Template = {
  id: 'iva_ver_documento',
  name: '6. Ver IVA',
  content: '🧾 *Declaración de IVA*\n\nPeríodo: {{periodo}}\nMonto: {{monto}}\nEstado: {{estado}}\n\nEnviando documento...',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 20,
  workflow: 'iva',
  actions: [
    {
      type: 'show_document',
      id: 'show_iva_doc',
      title: 'Ver documento',
      condition: {
        required_document_type: 'iva'
      },
      else_action: {
        type: 'show_message',
        message: 'No se encontró el documento específico. Un asesor te lo enviará pronto.'
      }
    },
    {
      type: 'button',
      id: 'btn_iva_otro',
      title: '📋 Ver otro período',
      next_template_id: 'menu_iva'
    },
    {
      type: 'button',
      id: 'btn_iva_volver',
      title: '← Volver',
      next_template_id: 'menu_tramites'
    },
  ],
};

export const tramiteIvaInfo: Template = {
  id: 'tramite_iva_info',
  name: '3. Info IVA',
  content: '🧾 *Servicio de IVA*\n\n• Declaración mensual (Formulario 29)\n• Recuperación de IVA crédito\n• Asesoramiento personalizado\n• Seguimiento de obligaciones\n\n¿Necesitas algo específico?',
  category: 'tramites',
  service_type: 'iva',
  segment: 'todos',
  is_active: true,
  priority: 41,
  workflow: 'iva',
  actions: [
    {
      type: 'button',
      id: 'btn_iva_mas_info',
      title: '📝 Ver más servicios',
      next_template_id: 'servicios_general'
    },
    {
      type: 'button',
      id: 'btn_iva_cotizar',
      title: '💼 Cotizar',
      next_template_id: 'cotizacion_info'
    },
  ],
};
