-- Plantillas para Agente MTZ - WhatsApp Chatbot
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- BIENVENIDA Y MENÚS PRINCIPALES
-- ============================================

-- Menú Principal Cliente
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, trigger, workflow, actions)
VALUES (
  'menu_principal_cliente',
  '1. Menú Principal Cliente',
  '¡Hola, {{nombre}}! 👋 Soy el asistente virtual de MTZ Consultores Tributarios. Para poder guiarte de la mejor manera, por favor selecciona una de las siguientes opciones:',
  'bienvenida', 'cliente', true, 100, 'hola,hola!,buenos días,buenas,bienvenido,start,menu', 'atencion',
  '[{"type":"list","title":"Opciones","description":"Selecciona una opción","content":"[{\"id\":\"btn_mis_documentos\",\"title\":\"📄 Mis Documentos\",\"description\":\"Consultar y descargar archivos\"},{\"id\":\"btn_mis_datos\",\"title\":\"👤 Mis Datos\",\"description\":\"Actualizar información personal\"},{\"id\":\"btn_tramites\",\"title\":\"⚙️ Trámites\",\"description\":\"Gestiones y servicios\"},{\"id\":\"btn_asesor_principal\",\"title\":\"📞 Hablar con asesor\",\"description\":\"Atención personalizada\"}]"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Menú Mis Datos
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'menu_mis_datos',
  '2. Mis Datos',
  '👤 *Tus datos en MTZ:*\n\nNombre: {{nombre}}\nTeléfono: {{telefono}}\nSegmento: {{segmento}}\n\n¿Qué necesitas actualizar?',
  'general', 'cliente', true, 90, 'general',
  '[{"type":"list","title":"Actualizar Datos","description":"Selecciona una opción","content":"[{\"id\":\"btn_actualizar_email\",\"title\":\"📧 Actualizar email\",\"description\":\"Cambiar correo electrónico\"},{\"id\":\"btn_actualizar_telefono\",\"title\":\"📱 Actualizar teléfono\",\"description\":\"Cambiar número de contacto\"},{\"id\":\"btn_ver_empresas\",\"title\":\"🏢 Ver empresas\",\"description\":\"Gestionar empresas vinculadas\"},{\"id\":\"btn_volver_principal\",\"title\":\"← Volver al menú\",\"description\":\"Regresar al inicio\"}]"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Menú Trámites
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'menu_tramites',
  '2. Menú Trámites',
  '⚙️ *Trámites Disponibles*\n\nSelecciona el trámite que necesitas:',
  'tramites', 'cliente', true, 95, 'documentos',
  '[{"type":"list","title":"Trámites","description":"Selecciona una categoría","content":"[{\"id\":\"btn_tram_iva\",\"title\":\"🧾 Declaración IVA\",\"description\":\"Consultar IVAs\"},{\"id\":\"btn_tram_renta\",\"title\":\"📊 Declaración Renta\",\"description\":\"Consultar Renta\"},{\"id\":\"btn_tram_nomina\",\"title\":\"👥 Nómina\",\"description\":\"Consultar liquidaciones\"},{\"id\":\"btn_tram_balance\",\"title\":\"📈 Balances\",\"description\":\"Consultar balances\"},{\"id\":\"btn_volver_tramites\",\"title\":\"← Volver al menú\",\"description\":\"Regresar al inicio\"}]"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Menú Empresas
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'menu_empresas',
  '2. Mis Empresas',
  '🏢 *Tus empresas vinculadas:*\n\nSelecciona una empresa para ver sus documentos:',
  'general', 'cliente', true, 88, 'general',
  '[{"type":"list","title":"Gestión de Empresas","description":"Selecciona una opción","content":"[{\"id\":\"btn_empresa_activa\",\"title\":\"🏢 Empresa activa\",\"description\":\"Ver documentos de la empresa actual\"},{\"id\":\"btn_cambiar_empresa\",\"title\":\"🔄 Cambiar empresa\",\"description\":\"Seleccionar otra empresa\"},{\"id\":\"btn_volver_datos\",\"title\":\"← Volver a mis datos\",\"description\":\"Regresar a Mis Datos\"}]"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Sin Empresas
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'sin_empresas',
  'Sin Empresas',
  '🏢 No tienes empresas vinculadas aún.\n\n¿Quieres vincular una empresa o hablar con un asesor?',
  'general', 'cliente', true, 87, 'general',
  '[{"type":"button","id":"btn_vincular_empresa","title":"📝 Vincular empresa","next_template_id":"vincular_empresa"},{"type":"button","id":"btn_asesor_empresa","title":"📞 Hablar con asesor","next_template_id":"derivacion_asesor"},{"type":"button","id":"btn_volver_datos_empresa","title":"← Volver","next_template_id":"menu_mis_datos"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- ============================================
-- PROSPECTOS - BIENVENIDA Y COTIZACIÓN
-- ============================================

-- Bienvenida Prospecto
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, trigger, workflow, actions)
VALUES (
  'bienvenida_prospecto',
  '1. Saludo Prospecto',
  '¡Hola! 👋 Bienvenido a MTZ Consultores. ¿En qué podemos ayudarte?',
  'bienvenida', 'prospecto', true, 1, 'hola,hola!,buenos días,buenas', 'atencion',
  '[{"type":"button","id":"btn_cotizar","title":"💼 Cotizar servicio","next_template_id":"cotizacion_info"},{"type":"button","id":"btn_servicios","title":"📝 Ver servicios","next_template_id":"servicios_general"},{"type":"button","id":"btn_contacto","title":"📞 Contactar asesor","next_template_id":"derivacion_asesor"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Cotización Info
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'cotizacion_info',
  '2. Información Cotización',
  '💼 Para cotizar nuestro servicio necesito algunos datos:\n\n• Tipo de empresa (SA, SpA, LTDA, etc.)\n• Facturación mensual aproximada\n• Cantidad de trabajadores\n• Necesidades específicas\n\n¿Tienes esta información o prefieres que un asesor te llame?',
  'servicios', 'prospecto', true, 30, 'atencion',
  '[{"type":"button","id":"btn_cot_tengo","title":"📝 Tengo la información","next_template_id":"cotizacion_recoger"},{"type":"button","id":"btn_cot_asesor","title":"📞 Que me llamen","next_template_id":"derivacion_asesor"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Cotización Recoger
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'cotizacion_recoger',
  '3. Recoger Datos Cotización',
  'Perfecto. Envíame la información y te prepararé una cotización.\n\nMientras, dime:\n1. ¿Qué tipo de empresa tienes?\n2. ¿Cuántos trabajadores?',
  'servicios', 'prospecto', true, 31, 'atencion',
  '[]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- ============================================
-- SERVICIOS GENERALES
-- ============================================

-- Servicios General
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'servicios_general',
  '2. Lista de Servicios',
  'Nuestros servicios:\n\n🚀 *Inicio de Actividades*\nAltas, cambios y bajas\n\n🧾 *IVA*\nDeclaraciones mensuales (F29)\n\n📊 *Renta*\nDeclaración anual (F22)\n\n📈 *Contabilidad*\nBalances y estados financieros\n\n👥 *Nómina*\nLiquidaciones y contratos\n\n✅ *Regularizaciones*\nRectificaciones',
  'servicios', 'todos', true, 40, 'general',
  '[{"type":"list","title":"Servicios","description":"Selecciona un servicio para más info","content":"[{\"id\":\"btn_serv_iva\",\"title\":\"🧾 Más info IVA\",\"description\":\"Información sobre declaraciones mensuales\"},{\"id\":\"btn_serv_renta\",\"title\":\"📊 Más info Renta\",\"description\":\"Información sobre declaración anual\"},{\"id\":\"btn_serv_cotizar\",\"title\":\"💼 Cotizar\",\"description\":\"Solicitar una cotización formal\"}]"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- ============================================
-- DERIVACIÓN A ASESOR
-- ============================================

-- Derivación Asesor
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'derivacion_asesor',
  'Derivación a Asesor',
  'Tu consulta requiere atención especializada. Un asesor de MTZ se comunicará contigo a la brevedad.\n\n📞 ¿Prefieres que te llamemos ahora?',
  'general', 'todos', true, 60, 'asesor',
  '[{"type":"button","id":"btn_asesor_si","title":"📞 Sí, llamar ahora","next_template_id":"derivacion_confirmar"},{"type":"button","id":"btn_asesor_despues","title":"⏰ Después","next_template_id":"gracias"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Derivación Confirmar
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'derivacion_confirmar',
  'Confirmar Derivación',
  '✅ Perfecto. Un asesor te contactará en los próximos minutos.\n\nGracias por contactar MTZ.',
  'general', 'todos', true, 61, 'asesor',
  '[{"type":"button","id":"btn_deriv_ok","title":"✅ Aceptar","next_template_id":"gracias"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Gracias
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'gracias',
  'Mensaje de Cierre',
  '¡Gracias por contactar MTZ Consultores! 👋\n\nSi tienes más dudas, escríbenos cuando quieras.\n\nEquipo MTZ',
  'general', 'todos', true, 100, 'general',
  '[{"type":"button","id":"btn_nuevo","title":"🔄 Nueva consulta","next_template_id":"menu_principal_cliente"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- ============================================
-- DOCUMENTOS
-- ============================================

-- Menú Documentos
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'menu_documentos',
  '2. Menú Documentos',
  '📋 Tienes {{document_count}} documentos. Selecciona uno:',
  'menu', 'cliente', true, 10, 'documentos',
  '[{"type":"list","title":"Ver documentos","description":"Todos","content":"{{documents_list}}"},{"type":"button","id":"btn_solicitar","title":"📋 Solicitar","next_template_id":"solicitar_documento"},{"type":"button","id":"btn_volver_principal","title":"← Volver","next_template_id":"menu_principal_cliente"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Solicitar Documento
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'solicitar_documento',
  'Solicitar Documento',
  '📋 Para solicitar un documento, por favor describe:\n\n1. Tipo de documento (IVA, renta, balance, etc.)\n2. Período o fecha\n3. Cualquier detalle adicional\n\nUn asesor procesará tu solicitud.',
  'documentos', 'cliente', true, 35, 'documentos',
  '[{"type":"button","id":"btn_sol_asesor","title":"📞 Hablar con asesor","next_template_id":"derivacion_asesor"},{"type":"button","id":"btn_sol_volver","title":"← Volver","next_template_id":"menu_documentos"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Confirmación Recepción
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'confirmacion_recepcion',
  'Confirmación Recepción',
  '✅ Hemos recibido tus documentos correctamente. Los revisaremos y te contactaremos en 24 horas.',
  'general', 'todos', true, 15, 'documentos',
  '[{"type":"button","id":"btn_conf_ok","title":"✅ Aceptar","next_template_id":"gracias"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- ============================================
-- ACTUALIZAR DATOS
-- ============================================

-- Actualizar Email
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'actualizar_email',
  'Actualizar Email',
  '📧 *Actualizar Email*\n\nEnvía tu nuevo correo electrónico y lo actualizaremos en nuestro sistema.',
  'general', 'cliente', true, 85, 'general',
  '[{"type":"button","id":"btn_email_volver","title":"← Volver","next_template_id":"menu_mis_datos"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Actualizar Teléfono
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'actualizar_telefono',
  'Actualizar Teléfono',
  '📱 *Actualizar Teléfono*\n\nEnvía tu nuevo número de teléfono y lo actualizaremos en nuestro sistema.',
  'general', 'cliente', true, 84, 'general',
  '[{"type":"button","id":"btn_telefono_volver","title":"← Volver","next_template_id":"menu_mis_datos"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Vincular Empresa
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'vincular_empresa',
  'Vincular Empresa',
  '🏢 *Vincular Empresa*\n\nPara vincular una empresa, un asesor necesita verificar tu información.\n\n¿Quieres que te contacten?',
  'general', 'cliente', true, 83, 'general',
  '[{"type":"button","id":"btn_vincular_si","title":"✅ Sí, contactar","next_template_id":"derivacion_asesor"},{"type":"button","id":"btn_vincular_volver","title":"← Volver","next_template_id":"menu_empresas"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Seleccionar Empresa
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'seleccionar_empresa',
  'Seleccionar Empresa',
  '🏢 Por favor, selecciona la empresa que deseas gestionar:',
  'general', 'cliente', true, 89, 'general',
  '[]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- ============================================
-- IVA
-- ============================================

-- Menú IVA
INSERT INTO public.templates (id, name, content, category, service_type, segment, is_active, priority, workflow, actions)
VALUES (
  'menu_iva',
  '3. Menú IVA',
  '🧾 Aquí están tus declaraciones de IVA. ¿Cuál necesitas ver?',
  'tramites', 'iva', 'cliente', true, 15, 'iva',
  '[{"type":"list","title":"IVAs","description":"Tus declaraciones de IVA","content":"{{iva_list}}"},{"type":"button","id":"btn_iva_solicitar","title":"📋 Solicitar IVA","next_template_id":"iva_solicitar"},{"type":"button","id":"btn_iva_otro","title":"📋 Ver otro IVA","next_template_id":"menu_iva"},{"type":"button","id":"btn_iva_volver","title":"← Volver","next_template_id":"menu_tramites"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- IVA No Disponible
INSERT INTO public.templates (id, name, content, category, service_type, segment, is_active, priority, workflow, actions)
VALUES (
  'iva_no_disponible',
  'IVA No Disponible',
  '🧾 No tengo IVAs declarados cargados aún para tu empresa.\n\n¿Prefieres solicitar uno o hablar con un asesor?',
  'documentos', 'iva', 'cliente', true, 16, 'iva',
  '[{"type":"button","id":"btn_iva_solicitar","title":"📋 Solicitar IVA","next_template_id":"iva_solicitar"},{"type":"button","id":"btn_asesor_iva","title":"📞 Hablar con asesor","next_template_id":"derivacion_asesor"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- IVA Solicitar
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'iva_solicitar',
  '5. Solicitar IVA',
  'Para solicitar una declaración de IVA específica, necesito que un asesor te contacte. ¿Confirmas que quieres que te llamemos?',
  'documentos', 'cliente', true, 25, 'iva',
  '[{"type":"button","id":"btn_iva_si","title":"✅ Sí, contactar","next_template_id":"derivacion_asesor"},{"type":"button","id":"btn_iva_no","title":"← Volver","next_template_id":"menu_iva"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- IVA Ver Documento
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'iva_ver_documento',
  '6. Ver IVA',
  '🧾 *Declaración de IVA*\n\nPeríodo: {{periodo}}\nMonto: {{monto}}\nEstado: {{estado}}\n\nEnviando documento...',
  'documentos', 'cliente', true, 20, 'iva',
  '[{"type":"show_document","id":"show_iva_doc","title":"Ver documento","condition":{"required_document_type":"iva"},"else_action":{"type":"show_message","message":"No se encontró el documento específico. Un asesor te lo enviará pronto."}},{"type":"button","id":"btn_iva_otro","title":"📋 Ver otro período","next_template_id":"menu_iva"},{"type":"button","id":"btn_iva_volver","title":"← Volver","next_template_id":"menu_tramites"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Trámite IVA Info
INSERT INTO public.templates (id, name, content, category, service_type, segment, is_active, priority, workflow, actions)
VALUES (
  'tramite_iva_info',
  '3. Info IVA',
  '🧾 *Servicio de IVA*\n\n• Declaración mensual (Formulario 29)\n• Recuperación de IVA crédito\n• Asesoramiento personalizado\n• Seguimiento de obligaciones\n\n¿Necesitas algo específico?',
  'tramites', 'iva', 'todos', true, 41, 'iva',
  '[{"type":"button","id":"btn_iva_mas_info","title":"📝 Ver más servicios","next_template_id":"servicios_general"},{"type":"button","id":"btn_iva_cotizar","title":"💼 Cotizar","next_template_id":"cotizacion_info"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- ============================================
-- RENTA
-- ============================================

-- Menú Renta
INSERT INTO public.templates (id, name, content, category, service_type, segment, is_active, priority, workflow, actions)
VALUES (
  'menu_renta',
  '3. Menú Renta',
  '📊 ¿Qué necesitas de tu declaración de renta?',
  'tramites', 'renta', 'cliente', true, 16, 'renta',
  '[{"type":"list","title":"Declaraciones Renta","description":"Tus declaraciones","content":"{{renta_list}}"},{"type":"button","id":"btn_renta_solicitar","title":"📝 Solicitar","next_template_id":"renta_solicitar"},{"type":"button","id":"btn_renta_otro","title":"📋 Ver otra","next_template_id":"menu_renta"},{"type":"button","id":"btn_renta_volver","title":"← Volver","next_template_id":"menu_documentos"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Renta Solicitar
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'renta_solicitar',
  '5. Solicitar Renta',
  'Para solicitar tu declaración de renta, un asesor te contactará. ¿Confirmas?',
  'documentos', 'cliente', true, 26, 'renta',
  '[{"type":"button","id":"btn_renta_si","title":"✅ Sí, contactar","next_template_id":"derivacion_asesor"},{"type":"button","id":"btn_renta_volver","title":"← Volver","next_template_id":"menu_renta"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Renta Ver Documento
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'renta_ver_documento',
  '6. Ver Renta',
  '📊 *Declaración de Renta*\n\nAño: {{anio}}\nTipo: {{tipo}}\nEstado: {{estado}}\n\nEnviando documento...',
  'documentos', 'cliente', true, 21, 'renta',
  '[{"type":"show_document","id":"show_renta_doc","title":"Ver documento","condition":{"required_document_type":"renta"},"else_action":{"type":"show_message","message":"No se encontró el documento específico. Un asesor te lo enviará pronto."}},{"type":"button","id":"btn_renta_otro","title":"📋 Ver otra declaración","next_template_id":"menu_renta"},{"type":"button","id":"btn_renta_volver_menu","title":"← Volver","next_template_id":"menu_tramites"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Trámite Renta Info
INSERT INTO public.templates (id, name, content, category, service_type, segment, is_active, priority, workflow, actions)
VALUES (
  'tramite_renta_info',
  '3. Info Renta',
  '📊 *Servicio de Renta*\n\n• Declaración anual (Formulario 22)\n• Optimización fiscal\n• Pérdidas tributarias\n• Asesoramiento personalizado\n\n¿Necesitas algo específico?',
  'tramites', 'renta', 'todos', true, 42, 'renta',
  '[{"type":"button","id":"btn_renta_mas_info","title":"📝 Ver más servicios","next_template_id":"servicios_general"},{"type":"button","id":"btn_renta_cotizar","title":"💼 Cotizar","next_template_id":"cotizacion_info"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- ============================================
-- NÓMINA
-- ============================================

-- Menú Nómina
INSERT INTO public.templates (id, name, content, category, service_type, segment, is_active, priority, workflow, actions)
VALUES (
  'menu_nomina',
  '3. Menú Nómina',
  '👥 ¿Qué necesitas de nóminas?',
  'tramites', 'nomina', 'cliente', true, 17, 'nomina',
  '[{"type":"list","title":"Opciones Nómina","description":"Selecciona una opción","content":"[{\"id\":\"btn_nom_liq\",\"title\":\"💰 Liquidaciones\",\"description\":\"Ver liquidaciones de sueldo\"},{\"id\":\"btn_nom_contratos\",\"title\":\"📄 Contratos\",\"description\":\"Ver contratos laborales\"},{\"id\":\"btn_nom_solicitar\",\"title\":\"📋 Solicitar\",\"description\":\"Pedir documento de nómina\"}]"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Nómina Liquidaciones
INSERT INTO public.templates (id, name, content, category, service_type, segment, is_active, priority, workflow, actions)
VALUES (
  'nomina_liquidaciones',
  '4. Liquidaciones',
  'Aquí están tus liquidaciones de sueldo. ¿Cuál necesitas?',
  'documentos', 'nomina', 'cliente', true, 22, 'nomina',
  '[{"type":"button","id":"btn_nom_ultima","title":"📄 Última liquidación","conditions":{"show_if":[{"field":"document_count","operator":"greater_than","value":0}]}},{"type":"button","id":"btn_nom_lista","title":"📋 Ver todas","conditions":{"show_if":[{"field":"document_count","operator":"greater_than","value":3}],"else_action":{"type":"hide_button"}}},{"type":"button","id":"btn_volver_nomina","title":"← Volver","next_template_id":"menu_nomina"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Nómina Contratos
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'nomina_contratos',
  '4. Contratos',
  'Tus contratos laborales. ¿Cuál necesitas?',
  'documentos', 'cliente', true, 24, 'nomina',
  '[{"type":"button","id":"btn_contrato_ver","title":"Ver contrato","conditions":{"show_if":[{"field":"document_type","operator":"includes","value":"contrato"}],"else_action":{"type":"hide_button"}}},{"type":"button","id":"btn_volver_nomina","title":"← Volver","next_template_id":"menu_nomina"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Nómina Solicitar
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'nomina_solicitar',
  '5. Solicitar Documento Nómina',
  'Para solicitar documentos de nómina, un asesor te contactará. ¿Confirmas?',
  'documentos', 'cliente', true, 27, 'nomina',
  '[{"type":"button","id":"btn_nom_si","title":"✅ Sí, contactar","next_template_id":"derivacion_asesor"},{"type":"button","id":"btn_nom_volver","title":"← Volver","next_template_id":"menu_nomina"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Nómina Ver Liquidación
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'nomina_ver_liquidacion',
  '6. Ver Liquidación',
  '👥 *Liquidación de Sueldo*\n\nPeríodo: {{periodo}}\nMonto Líquido: {{monto}}\n\nEnviando documento...',
  'documentos', 'cliente', true, 23, 'nomina',
  '[{"type":"show_document","id":"show_liquidacion_doc","title":"Ver documento","condition":{"required_document_type":"liquidacion"},"else_action":{"type":"show_message","message":"No se encontró la liquidación. Un asesor te la enviará pronto."}},{"type":"button","id":"btn_liq_otra","title":"📋 Ver otra liquidación","next_template_id":"nomina_liquidaciones"},{"type":"button","id":"btn_liq_volver","title":"← Volver","next_template_id":"menu_nomina"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Nómina Ver Contrato
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'nomina_ver_contrato',
  '6. Ver Contrato',
  '📄 *Contrato de Trabajo*\n\nEnviando documento...',
  'documentos', 'cliente', true, 25, 'nomina',
  '[{"type":"show_document","id":"show_contrato_doc","title":"Ver documento","condition":{"required_document_type":"contrato"},"else_action":{"type":"show_message","message":"No se encontró el contrato. Un asesor te lo enviará pronto."}},{"type":"button","id":"btn_contrato_volver","title":"← Volver","next_template_id":"nomina_contratos"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- ============================================
-- BALANCES
-- ============================================

-- Menú Balance
INSERT INTO public.templates (id, name, content, category, service_type, segment, is_active, priority, workflow, actions)
VALUES (
  'menu_balance',
  '3. Menú Balances',
  '📈 ¿Qué balances necesitas?',
  'tramites', 'contabilidad', 'cliente', true, 18, 'documentos',
  '[{"type":"list","title":"Opciones Balances","description":"Selecciona una opción","content":"[{\"id\":\"btn_bal_mensual\",\"title\":\"📊 Balance Mensual\",\"description\":\"Ver balance mensual\"},{\"id\":\"btn_bal_anual\",\"title\":\"📋 Balance Anual\",\"description\":\"Ver balance anual\"},{\"id\":\"btn_bal_solicitar\",\"title\":\"📋 Solicitar balance\",\"description\":\"Pedir nuevo balance\"}]"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Balance Solicitar
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'balance_solicitar',
  '5. Solicitar Balance',
  'Para solicitar un balance, un asesor te contactará. ¿Confirmas?',
  'documentos', 'cliente', true, 28, 'documentos',
  '[{"type":"button","id":"btn_bal_si","title":"✅ Sí, contactar","next_template_id":"derivacion_asesor"},{"type":"button","id":"btn_bal_volver","title":"← Volver","next_template_id":"menu_balance"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Balance Ver Documento
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'balance_ver_documento',
  '6. Ver Balance',
  '📈 *Balance General*\n\nPeríodo: {{periodo}}\nTipo: {{tipo}}\n\nEnviando documento...',
  'documentos', 'cliente', true, 24, 'documentos',
  '[{"type":"show_document","id":"show_balance_doc","title":"Ver documento","condition":{"required_document_type":"balance"},"else_action":{"type":"show_message","message":"No se encontró el balance. Un asesor te lo enviará pronto."}},{"type":"button","id":"btn_bal_otro","title":"📋 Ver otro balance","next_template_id":"menu_balance"},{"type":"button","id":"btn_bal_volver_menu","title":"← Volver","next_template_id":"menu_tramites"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- ============================================
-- COBRANZA
-- ============================================

-- Cobranza Recordatorio
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, trigger, workflow, actions)
VALUES (
  'cobranza_recordatorio',
  'Recordatorio Pago',
  'Estimado cliente, te recordamos que tu pago está pendiente. Por favor regularice a la brevedad.',
  'cobranza', 'cliente', true, 50, 'pago,pendiente,factura', 'cobranza',
  '[{"type":"button","id":"btn_cob_info","title":"📋 Ver detalles","next_template_id":"cobranza_detalles"},{"type":"button","id":"btn_cob_pagar","title":"💳 Ya pagué","next_template_id":"cobranza_confirmar"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Cobranza Detalles
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'cobranza_detalles',
  'Detalles Cobranza',
  'Tu estado de cuenta:\n\n• Mes: Marzo 2026\n• Monto: $XXX.XXX\n• Vencimiento: 20/03/2026\n\n¿Tienes alguna consulta?',
  'cobranza', 'cliente', true, 51, 'cobranza',
  '[{"type":"button","id":"btn_cob_asesor","title":"📞 Hablar con asesor","next_template_id":"derivacion_asesor"},{"type":"button","id":"btn_cob_volver","title":"← Volver","next_template_id":"gracias"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Cobranza Confirmar
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'cobranza_confirmar',
  'Confirmar Pago',
  'Perfecto. Gracias por tu pago. Un asesor verificará y te contactará si hay algo más.',
  'cobranza', 'cliente', true, 52, 'cobranza',
  '[{"type":"button","id":"btn_cob_ok","title":"✅ Aceptar","next_template_id":"gracias"}]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Verificar inserción
SELECT id, name, segment, is_active, priority FROM public.templates ORDER BY priority;