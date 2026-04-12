import { Template } from '@/app/components/templates/types';

export const saludosTemplates: Partial<Template>[] = [
  { 
    id: 'bienvenida_cliente', 
    name: 'Bienvenida Cliente', 
    content: '¡Hola, {{nombre}}! 👋 Bienvenido a MTZ Consultores. ¿En qué podemos ayudarte hoy?', 
    category: 'bienvenida', 
    segment: 'cliente', 
    is_active: true, 
    priority: 100, 
    trigger: 'hola,start,menu', 
    workflow: 'atencion', 
    actions: [
      {type: 'button', id: 'btn_documentos', title: '📄 Mis Documentos'},
      {type: 'button', id: 'btn_tramites', title: '⚙️ Trámites'},
      {type: 'button', id: 'btn_asesor', title: '📞 Hablar con Asesor'}
    ]
  },
  { 
    id: 'bienvenida_prospecto', 
    name: 'Bienvenida Prospecto', 
    content: '¡Hola! 👋 Bienvenido a MTZ Consultores. ¿En qué podemos ayudarte?', 
    category: 'bienvenida', 
    segment: 'prospecto', 
    is_active: true, 
    priority: 100, 
    trigger: 'hola,cotizar,informacion', 
    workflow: 'atencion', 
    actions: [
      {type: 'button', id: 'btn_cotizar', title: '💼 Cotizar'},
      {type: 'button', id: 'btn_servicios', title: '📝 Ver Servicios'},
      {type: 'button', id: 'btn_asesor', title: '📞 Hablar con Asesor'}
    ]
  },
  {
    id: 'derivacion_asesor',
    name: 'Derivación a Asesor',
    content: 'Entendido. Un asesor de MTZ se pondrá en contacto contigo a la brevedad.',
    category: 'general',
    segment: 'todos',
    is_active: true,
    priority: 50,
    workflow: 'asesor',
    actions: [{type: 'button', id: 'btn_gracias', title: '✅ Entendido'}]
  },
  {
    id: 'gracias',
    name: 'Mensaje de Gracias',
    content: '¡Gracias por contactar MTZ Consultores!',
    category: 'general',
    segment: 'todos',
    is_active: true,
    priority: 50,
    workflow: 'general',
    actions: []
  }
];
