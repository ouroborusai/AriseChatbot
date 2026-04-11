import { Template } from '../types';

export const cobranzaRecordatorio: Template = {
  id: 'cobranza_recordatorio',
  name: 'Recordatorio Pago',
  content: 'Estimado cliente, te recordamos que tu pago está pendiente. Por favor regularice a la brevedad.',
  category: 'cobranza',
  segment: 'cliente',
  is_active: true,
  priority: 50,
  trigger: 'pago,pendiente,factura',
  workflow: 'cobranza',
  actions: [
    {
      type: 'button',
      id: 'btn_cob_info',
      title: '📋 Ver detalles',
      next_template_id: 'cobranza_detalles'
    },
    {
      type: 'button',
      id: 'btn_cob_pagar',
      title: '💳 Ya pagué',
      next_template_id: 'cobranza_confirmar'
    },
  ],
};

export const cobranzaDetalles: Template = {
  id: 'cobranza_detalles',
  name: 'Detalles Cobranza',
  content: 'Tu estado de cuenta:\n\n• Mes: Marzo 2026\n• Monto: $XXX.XXX\n• Vencimiento: 20/03/2026\n\n¿Tienes alguna consulta?',
  category: 'cobranza',
  segment: 'cliente',
  is_active: true,
  priority: 51,
  workflow: 'cobranza',
  actions: [
    {
      type: 'button',
      id: 'btn_cob_asesor',
      title: '📞 Hablar con asesor',
      next_template_id: 'derivacion_asesor'
    },
    {
      type: 'button',
      id: 'btn_cob_volver',
      title: '← Volver',
      next_template_id: 'gracias'
    },
  ],
};

export const cobranzaConfirmar: Template = {
  id: 'cobranza_confirmar',
  name: 'Confirmar Pago',
  content: 'Perfecto. Gracias por tu pago. Un asesor verificará y te contactará si hay algo más.',
  category: 'cobranza',
  segment: 'cliente',
  is_active: true,
  priority: 52,
  workflow: 'cobranza',
  actions: [
    {
      type: 'button',
      id: 'btn_cob_ok',
      title: '✅ Aceptar',
      next_template_id: 'gracias'
    },
  ],
};
