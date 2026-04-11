import { Template } from '../types';

export const menuPrincipalCliente: Template = {
  id: 'menu_principal_cliente',
  name: '1. Menú Principal Cliente',
  content: '¡Hola, {{nombre}}! 👋 Soy el asistente virtual de MTZ Consultores Tributarios. Para poder guiarte de la mejor manera, por favor selecciona una de las siguientes opciones:',
  category: 'bienvenida',
  segment: 'cliente',
  is_active: true,
  priority: 100,
  trigger: 'hola,hola!,buenos días,buenas,bienvenido,start,menu',
  workflow: 'atencion',
  rules: {
    required_context: {
      required_segment: 'cliente'
    }
  },
  actions: [
    {
      type: 'list',
      title: 'Opciones',
      description: 'Selecciona una opción',
      content: JSON.stringify([
        { id: 'btn_mis_documentos', title: '📄 Mis Documentos', description: 'Consultar y descargar archivos' },
        { id: 'btn_mis_datos', title: '👤 Mis Datos', description: 'Actualizar información personal' },
        { id: 'btn_tramites', title: '⚙️ Trámites', description: 'Gestiones y servicios' },
        { id: 'btn_asesor_principal', title: '📞 Hablar con asesor', description: 'Atención personalizada' },
      ])
    },
  ],
};

export const menuMisDatos: Template = {
  id: 'menu_mis_datos',
  name: '2. Mis Datos',
  content: '👤 *Tus datos en MTZ:*\n\nNombre: {{nombre}}\nTeléfono: {{telefono}}\nSegmento: {{segmento}}\n\n¿Qué necesitas actualizar?',
  category: 'general',
  segment: 'cliente',
  is_active: true,
  priority: 90,
  workflow: 'general',
  actions: [
    {
      type: 'list',
      title: 'Actualizar Datos',
      description: 'Selecciona una opción',
      content: JSON.stringify([
        { id: 'btn_actualizar_email', title: '📧 Actualizar email', description: 'Cambiar correo electrónico' },
        { id: 'btn_actualizar_telefono', title: '📱 Actualizar teléfono', description: 'Cambiar número de contacto' },
        { id: 'btn_ver_empresas', title: '🏢 Ver empresas', description: 'Gestionar empresas vinculadas' },
        { id: 'btn_volver_principal', title: '← Volver al menú', description: 'Regresar al inicio' },
      ])
    },
  ],
};

export const menuTramites: Template = {
  id: 'menu_tramites',
  name: '2. Menú Trámites',
  content: '⚙️ *Trámites Disponibles*\n\nSelecciona el trámite que necesitas:',
  category: 'tramites',
  segment: 'cliente',
  is_active: true,
  priority: 95,
  workflow: 'documentos',
  actions: [
    {
      type: 'list',
      title: 'Trámites',
      description: 'Selecciona una categoría',
      content: JSON.stringify([
        { id: 'btn_tram_iva', title: '🧾 Declaración IVA', description: 'Consultar IVAs' },
        { id: 'btn_tram_renta', title: '📊 Declaración Renta', description: 'Consultar Renta' },
        { id: 'btn_tram_nomina', title: '👥 Nómina', description: 'Consultar liquidaciones' },
        { id: 'btn_tram_balance', title: '📈 Balances', description: 'Consultar balances' },
        { id: 'btn_volver_tramites', title: '← Volver al menú', description: 'Regresar al inicio' },
      ])
    },
  ],
};

export const menuEmpresas: Template = {
  id: 'menu_empresas',
  name: '2. Mis Empresas',
  content: '🏢 *Tus empresas vinculadas:*\n\nSelecciona una empresa para ver sus documentos:',
  category: 'general',
  segment: 'cliente',
  is_active: true,
  priority: 88,
  workflow: 'general',
  rules: {
    required_context: {
      has_company: true
    },
    fallback_template_id: 'sin_empresas'
  },
  actions: [
    {
      type: 'list',
      title: 'Gestión de Empresas',
      description: 'Selecciona una opción',
      content: JSON.stringify([
        { id: 'btn_empresa_activa', title: '🏢 Empresa activa', description: 'Ver documentos de la empresa actual' },
        { id: 'btn_cambiar_empresa', title: '🔄 Cambiar empresa', description: 'Seleccionar otra empresa' },
        { id: 'btn_volver_datos', title: '← Volver a mis datos', description: 'Regresar a Mis Datos' },
      ])
    },
  ],
};

export const sinEmpresas: Template = {
  id: 'sin_empresas',
  name: 'Sin Empresas',
  content: '🏢 No tienes empresas vinculadas aún.\n\n¿Quieres vincular una empresa o hablar con un asesor?',
  category: 'general',
  segment: 'cliente',
  is_active: true,
  priority: 87,
  workflow: 'general',
  actions: [
    {
      type: 'button',
      id: 'btn_vincular_empresa',
      title: '📝 Vincular empresa',
      next_template_id: 'vincular_empresa'
    },
    {
      type: 'button',
      id: 'btn_asesor_empresa',
      title: '📞 Hablar con asesor',
      next_template_id: 'derivacion_asesor'
    },
    {
      type: 'button',
      id: 'btn_volver_datos_empresa',
      title: '← Volver',
      next_template_id: 'menu_mis_datos'
    },
  ],
};

export const bienvenidaProspecto: Template = {
  id: 'bienvenida_prospecto',
  name: '1. Saludo Prospecto',
  content: '¡Hola! 👋 Bienvenido a MTZ Consultores. ¿En qué podemos ayudarte?',
  category: 'bienvenida',
  segment: 'prospecto',
  is_active: true,
  priority: 1,
  trigger: 'hola,hola!,buenos días,buenas',
  workflow: 'atencion',
  actions: [
    {
      type: 'button',
      id: 'btn_cotizar',
      title: '💼 Cotizar servicio',
      next_template_id: 'cotizacion_info'
    },
    {
      type: 'button',
      id: 'btn_servicios',
      title: '📝 Ver servicios',
      next_template_id: 'servicios_general'
    },
    {
      type: 'button',
      id: 'btn_contacto',
      title: '📞 Contactar asesor',
      next_template_id: 'derivacion_asesor'
    },
  ],
};
