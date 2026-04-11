import { Template } from '../types';

export const menuBalance: Template = {
  id: 'menu_balance',
  name: '3. Menú Balances',
  content: '📈 ¿Qué balances necesitas?',
  category: 'tramites',
  service_type: 'contabilidad',
  segment: 'cliente',
  is_active: true,
  priority: 18,
  workflow: 'documentos',
  actions: [
    {
      type: 'list',
      title: 'Opciones Balances',
      description: 'Selecciona una opción',
      content: JSON.stringify([
        { id: 'btn_bal_mensual', title: '📊 Balance Mensual', description: 'Ver balance mensual' },
        { id: 'btn_bal_anual', title: '📋 Balance Anual', description: 'Ver balance anual' },
        { id: 'btn_bal_solicitar', title: '📋 Solicitar balance', description: 'Pedir nuevo balance' },
      ])
    },
  ],
};

export const balanceSolicitar: Template = {
  id: 'balance_solicitar',
  name: '5. Solicitar Balance',
  content: 'Para solicitar un balance, un asesor te contactará. ¿Confirmas?',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 28,
  workflow: 'documentos',
  actions: [
    {
      type: 'button',
      id: 'btn_bal_si',
      title: '✅ Sí, contactar',
      next_template_id: 'derivacion_asesor'
    },
    {
      type: 'button',
      id: 'btn_bal_volver',
      title: '← Volver',
      next_template_id: 'menu_balance'
    },
  ],
};

export const balanceVerDocumento: Template = {
  id: 'balance_ver_documento',
  name: '6. Ver Balance',
  content: '📈 *Balance General*\n\nPeríodo: {{periodo}}\nTipo: {{tipo}}\n\nEnviando documento...',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 24,
  workflow: 'documentos',
  actions: [
    {
      type: 'show_document',
      id: 'show_balance_doc',
      title: 'Ver documento',
      condition: {
        required_document_type: 'balance'
      },
      else_action: {
        type: 'show_message',
        message: 'No se encontró el balance. Un asesor te lo enviará pronto.'
      }
    },
    {
      type: 'button',
      id: 'btn_bal_otro',
      title: '📋 Ver otro balance',
      next_template_id: 'menu_balance'
    },
    {
      type: 'button',
      id: 'btn_bal_volver_menu',
      title: '← Volver',
      next_template_id: 'menu_tramites'
    },
  ],
};
