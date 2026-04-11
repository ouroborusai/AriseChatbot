import { Template } from '../types';

export const menuNomina: Template = {
  id: 'menu_nomina',
  name: '3. Menú Nómina',
  content: '👥 ¿Qué necesitas de nóminas?',
  category: 'tramites',
  service_type: 'nomina',
  segment: 'cliente',
  is_active: true,
  priority: 17,
  workflow: 'nomina',
  actions: [
    {
      type: 'list',
      title: 'Opciones Nómina',
      description: 'Selecciona una opción',
      content: JSON.stringify([
        { id: 'btn_nom_liq', title: '💰 Liquidaciones', description: 'Ver liquidaciones de sueldo' },
        { id: 'btn_nom_contratos', title: '📄 Contratos', description: 'Ver contratos laborales' },
        { id: 'btn_nom_solicitar', title: '📋 Solicitar', description: 'Pedir documento de nómina' },
      ])
    },
  ],
};

export const nominaLiquidaciones: Template = {
  id: 'nomina_liquidaciones',
  name: '4. Liquidaciones',
  content: 'Aquí están tus liquidaciones de sueldo. ¿Cuál necesitas?',
  category: 'documentos',
  service_type: 'nomina',
  segment: 'cliente',
  is_active: true,
  priority: 22,
  workflow: 'nomina',
  actions: [
    {
      type: 'button',
      id: 'btn_nom_ultima',
      title: '📄 Última liquidación',
      conditions: {
        show_if: [
          { field: 'document_count', operator: 'greater_than', value: 0 }
        ]
      }
    },
    {
      type: 'button',
      id: 'btn_nom_lista',
      title: '📋 Ver todas',
      conditions: {
        show_if: [
          { field: 'document_count', operator: 'greater_than', value: 3 }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_volver_nomina',
      title: '← Volver',
      next_template_id: 'menu_nomina'
    },
  ],
};

export const nominaContratos: Template = {
  id: 'nomina_contratos',
  name: '4. Contratos',
  content: 'Tus contratos laborales. ¿Cuál necesitas?',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 24,
  workflow: 'nomina',
  actions: [
    {
      type: 'button',
      id: 'btn_contrato_ver',
      title: 'Ver contrato',
      conditions: {
        show_if: [
          { field: 'document_type', operator: 'includes', value: 'contrato' }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_volver_nomina',
      title: '← Volver',
      next_template_id: 'menu_nomina'
    },
  ],
};

export const nominaSolicitar: Template = {
  id: 'nomina_solicitar',
  name: '5. Solicitar Documento Nómina',
  content: 'Para solicitar documentos de nómina, un asesor te contactará. ¿Confirmas?',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 27,
  workflow: 'nomina',
  actions: [
    {
      type: 'button',
      id: 'btn_nom_si',
      title: '✅ Sí, contactar',
      next_template_id: 'derivacion_asesor'
    },
    {
      type: 'button',
      id: 'btn_nom_volver',
      title: '← Volver',
      next_template_id: 'menu_nomina'
    },
  ],
};

export const nominaVerLiquidacion: Template = {
  id: 'nomina_ver_liquidacion',
  name: '6. Ver Liquidación',
  content: '👥 *Liquidación de Sueldo*\n\nPeríodo: {{periodo}}\nMonto Líquido: {{monto}}\n\nEnviando documento...',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 23,
  workflow: 'nomina',
  actions: [
    {
      type: 'show_document',
      id: 'show_liquidacion_doc',
      title: 'Ver documento',
      condition: {
        required_document_type: 'liquidacion'
      },
      else_action: {
        type: 'show_message',
        message: 'No se encontró la liquidación. Un asesor te la enviará pronto.'
      }
    },
    {
      type: 'button',
      id: 'btn_liq_otra',
      title: '📋 Ver otra liquidación',
      next_template_id: 'nomina_liquidaciones'
    },
    {
      type: 'button',
      id: 'btn_liq_volver',
      title: '← Volver',
      next_template_id: 'menu_nomina'
    },
  ],
};

export const nominaVerContrato: Template = {
  id: 'nomina_ver_contrato',
  name: '6. Ver Contrato',
  content: '📄 *Contrato de Trabajo*\n\nEnviando documento...',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 25,
  workflow: 'nomina',
  actions: [
    {
      type: 'show_document',
      id: 'show_contrato_doc',
      title: 'Ver documento',
      condition: {
        required_document_type: 'contrato'
      },
      else_action: {
        type: 'show_message',
        message: 'No se encontró el contrato. Un asesor te lo enviará pronto.'
      }
    },
    {
      type: 'button',
      id: 'btn_contrato_volver',
      title: '← Volver',
      next_template_id: 'nomina_contratos'
    },
  ],
};
