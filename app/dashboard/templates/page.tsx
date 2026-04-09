'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type Template = {
  id: string;
  name: string;
  content: string;
  category: 'bienvenida' | 'servicios' | 'tramites' | 'documentos' | 'cobranza' | 'informacion' | 'general';
  service_type?: string;
};

type ServiceType = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

const SERVICE_TYPES: ServiceType[] = [
  { id: 'inicio_actividades', name: 'Inicio de Actividades', description: 'Altas, cambios y bajas', icon: '🚀' },
  { id: 'iva', name: 'IVA', description: 'Declaraciones mensuales, recuperaciones', icon: '🧾' },
  { id: 'renta', name: 'Renta', description: 'Declaración anual, pérdidas tributarias', icon: '📊' },
  { id: 'contabilidad', name: 'Contabilidad', description: 'Balances, estados financieros', icon: '📈' },
  { id: 'nomina', name: 'Nómina', description: 'Liquidaciones, contratos', icon: '👥' },
  { id: 'regularizacion', name: 'Regularización', description: 'Rectificaciones, multas', icon: '✅' },
];

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'bienvenida_cliente',
    name: 'Saludo Cliente',
    content: 'Hola 👋 Bienvenido a MTZ Consultores Tributarios. ¿En qué podemos ayudarte hoy?',
    category: 'bienvenida',
  },
  {
    id: 'bienvenida_prospecto',
    name: 'Saludo Prospecto',
    content: '¡Hola! 👋 Bienvenido a MTZ Consultores. Somos especialistas en compliance tributario y contable en Chile. ¿En qué podemos ayudarte?',
    category: 'bienvenida',
  },
  {
    id: 'menu_servicios',
    name: 'Menú de Servicios',
    content: 'Estos son nuestros servicios:\n\n🚀 Inicio de Actividades\n🧾 IVA (mensual, recuperaciones)\n📊 Renta (anual, pérdidas)\n📈 Contabilidad\n👥 Nómina y contratos\n✅ Regularizaciones\n\n¿En cual necesitas ayuda?',
    category: 'servicios',
  },
  {
    id: 'inicio_actividades_info',
    name: 'Info Inicio Actividades',
    content: '📋 Inicio de Actividades\n\nTe ayudamos con:\n• Alta de actividades ante el SII\n• Cambios de actividad económica\n• Baja de actividades\n\n¿Qué necesitas?',
    category: 'tramites',
    service_type: 'inicio_actividades',
  },
  {
    id: 'iva_info',
    name: 'Info IVA',
    content: '🧾 Servicio de IVA\n\nIncluye:\n• Declaración mensual (Formulario 29)\n• Recuperación de IVA赞\n• Asesoramiento en créditos\n• Historial de declaraciones\n\n¿Qué necesitas ver?',
    category: 'tramites',
    service_type: 'iva',
  },
  {
    id: 'renta_info',
    name: 'Info Renta',
    content: '📊 Declaración de Renta\n\nTe ayudamos con:\n• Declaración anual (F22)\n• Optimización carga tributaria\n• Pérdidas tributarias\n• Rentas presuntas\n\n¿Tienes dudas específicas?',
    category: 'tramites',
    service_type: 'renta',
  },
  {
    id: 'contabilidad_info',
    name: 'Info Contabilidad',
    content: '📈 Contabilidad\n\nTe entregamos:\n• Balance mensual\n• Estados financieros\n• Análisis de resultados\n• Reportes personalizados\n\n¿Qué período necesitas?',
    category: 'tramites',
    service_type: 'contabilidad',
  },
  {
    id: 'nomina_info',
    name: 'Info Nómina',
    content: '👥 Nómina y Contratos\n\nGestionamos:\n• Liquidaciones de sueldo\n• Contratos de trabajo\n• Finiquitos\n• Certificaciones\n\n¿Necesitas algo específico?',
    category: 'tramites',
    service_type: 'nomina',
  },
  {
    id: 'solicitud_documentos',
    name: 'Solicitud Documentos',
    content: 'Para continuar con tu trámite, necesito que me envíes:\n\n✓ RUT actualizado\n✓ Última declaración de renta\n✓ Balance último mes\n\nPuedes enviar fotos o PDFs.',
    category: 'documentos',
  },
  {
    id: 'doc_iva_enviar',
    name: 'Envío IVA',
    content: '🧾 Aquí está tu IVA correspondiente a {periodo}:\n\n{file_url}\n\n¿Necesitas algo más?',
    category: 'tramites',
    service_type: 'iva',
  },
  {
    id: 'doc_renta_enviar',
    name: 'Envío Renta',
    content: '📊 Aquí está tu Declaración de Renta {año}:\n\n{file_url}\n\n¿Tienes dudas sobre el resultado?',
    category: 'tramites',
    service_type: 'renta',
  },
  {
    id: 'doc_balance_enviar',
    name: 'Envío Balance',
    content: '📈 Aquí está tu Balance {periodo}:\n\n{file_url}\n\n¿Necesitas algún análisis adicional?',
    category: 'tramites',
    service_type: 'contabilidad',
  },
  {
    id: 'recordatorio_pago',
    name: 'Recordatorio Pago',
    content: 'Estimado cliente, te recordamos que tu servicio tiene pago pendiente. Por favor regularice a la brevedad para continuar con tus trámites.',
    category: 'cobranza',
  },
  {
    id: 'confirmacion_recepcion',
    name: 'Confirmación Recepción',
    content: '✅ Hemos recibido tus documentos correctamente.\n\nLos revisaremos y te contactaremos en un máximo de 24 horas hábiles.',
    category: 'general',
  },
  {
    id: 'derivacion_asesor',
    name: 'Derivación Asesor',
    content: 'Tu consulta requiere atención especializada. Un asesor de MTZ se comunicará contigo a la brevedad desde este número.\n\nGracias por tu paciencia.',
    category: 'general',
  },
  {
    id: 'horarios',
    name: 'Horarios Atención',
    content: '📅 Nuestro horario de atención:\n\nLunes a Viernes: 9:00 - 18:00 hrs\nSábados: 10:00 - 14:00 hrs\n\n¿En qué podemos ayudarte?',
    category: 'informacion',
  },
  {
    id: 'gracias',
    name: 'Mensaje de Cierre',
    content: '¡Gracias por contactar MTZ Consultores! 👋\n\nSi tienes más dudas, escríbenos cuando quieras. Estamos para ayudarte.\n\nEquipo MTZ',
    category: 'general',
  },
];

export default function TemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedService, setSelectedService] = useState<string>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState<Omit<Template, 'id'>>({
    name: '',
    content: '',
    category: 'general',
    service_type: undefined,
  });
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      const { data } = await supabase.from('templates').select('*').order('name');
      if (data && data.length > 0) {
        const merged = [...DEFAULT_TEMPLATES];
        data.forEach((t: any) => {
          if (!merged.find(m => m.id === t.id)) {
            merged.push(t as Template);
          }
        });
        setTemplates(merged);
      }
    };
    loadTemplates();
  }, [supabase]);

  const filteredTemplates = templates.filter((t) => {
    const catMatch = selectedCategory === 'todos' || t.category === selectedCategory;
    const servMatch = selectedService === 'todos' || t.service_type === selectedService;
    return catMatch && servMatch;
  });

  const handleCopy = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name || !newTemplate.content) return;

    const template: Template = {
      id: Date.now().toString(),
      ...newTemplate,
    };

    await supabase.from('templates').upsert({
      id: template.id,
      name: template.name,
      content: template.content,
      category: template.category,
      service_type: template.service_type,
    });

    setTemplates([...templates, template]);
    setNewTemplate({ name: '', content: '', category: 'general', service_type: undefined });
    setShowNewForm(false);
    setEditingTemplate(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    
    await supabase.from('templates').delete().eq('id', id);
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      bienvenida: 'bg-green-600',
      servicios: 'bg-blue-600',
      tramites: 'bg-purple-600',
      documentos: 'bg-orange-600',
      cobranza: 'bg-red-600',
      informacion: 'bg-cyan-600',
      general: 'bg-slate-600',
    };
    return colors[cat] || 'bg-slate-600';
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      bienvenida: '👋',
      servicios: '💼',
      tramites: '📋',
      documentos: '📄',
      cobranza: '💳',
      informacion: 'ℹ️',
      general: '💬',
    };
    return icons[cat] || '📝';
  };

  const categories = [
    { value: 'todos', label: 'Todas' },
    { value: 'bienvenida', label: 'Bienvenida', icon: '👋' },
    { value: 'servicios', label: 'Servicios', icon: '💼' },
    { value: 'tramites', label: 'Trámites', icon: '📋' },
    { value: 'documentos', label: 'Documentos', icon: '📄' },
    { value: 'cobranza', label: 'Cobranza', icon: '💳' },
    { value: 'informacion', label: 'Info', icon: 'ℹ️' },
    { value: 'general', label: 'General', icon: '💬' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-base">
        <div className="card-header">
          <div>
            <p className="text-sm uppercase tracking-widest text-green-600 font-semibold">
              Biblioteca
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Plantillas de Mensajes</h1>
            <p className="text-sm text-slate-500 mt-1">
              {templates.length} plantillas disponibles
            </p>
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="inline-flex rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            {showNewForm ? 'Cancelar' : '+ Nueva plantilla'}
          </button>
        </div>
      </div>

      {/* Servicios rápidos */}
      <div className="card-base">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">💼 Servicios MTZ</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {SERVICE_TYPES.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service.id)}
              className={`p-3 rounded-xl text-left transition ${
                selectedService === service.id
                  ? 'bg-green-50 ring-2 ring-green-500'
                  : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="text-xl mb-1">{service.icon}</div>
              <p className="text-xs font-medium text-slate-900 truncate">{service.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{service.description}</p>
            </button>
          ))}
          {selectedService !== 'todos' && (
            <button
              onClick={() => setSelectedService('todos')}
              className="p-3 rounded-xl text-center bg-slate-100 hover:bg-slate-200 transition text-xs text-slate-600"
            >
              Ver todos
            </button>
          )}
        </div>
      </div>

      {/* Formulario nueva plantilla */}
      {showNewForm && (
        <div className="card-base">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Nueva Plantilla</h2>
          <form onSubmit={handleSaveTemplate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-green-500 focus:outline-none"
                placeholder="Ej: Saludo IVA"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contenido</label>
              <textarea
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-green-500 focus:outline-none resize-none"
                rows={4}
                placeholder="Escribe el contenido... Usa {variable} para reemplazar"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as Template['category'] })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-green-500 focus:outline-none"
                >
                  <option value="general">General</option>
                  <option value="bienvenida">Bienvenida</option>
                  <option value="servicios">Servicios</option>
                  <option value="tramites">Trámites</option>
                  <option value="documentos">Documentos</option>
                  <option value="cobranza">Cobranza</option>
                  <option value="informacion">Información</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo Servicio</label>
                <select
                  value={newTemplate.service_type || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, service_type: e.target.value || undefined })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-green-500 focus:outline-none"
                >
                  <option value="">Sin especificar</option>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Guardar plantilla
            </button>
          </form>
        </div>
      )}

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedCategory === cat.value
                ? 'bg-green-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.icon && `${cat.icon} `}{cat.label}
          </button>
        ))}
      </div>

      {/* Lista de plantillas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="card-base hover:shadow-md transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900">{template.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full text-white ${getCategoryColor(template.category)}`}>
                    {getCategoryIcon(template.category)} {template.category}
                  </span>
                  {template.service_type && (
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {SERVICE_TYPES.find(s => s.id === template.service_type)?.icon} {SERVICE_TYPES.find(s => s.id === template.service_type)?.name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-line bg-slate-50 rounded-xl p-3">
                  {template.content}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(template)}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-300 hover:bg-slate-50 transition"
                >
                  {copiedId === template.id ? '✓ Copiado' : '📋 Copiar'}
                </button>
                {!template.id.includes('_') && (
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-2 text-sm rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-500 text-center pb-6">
        {filteredTemplates.length} plantilla{filteredTemplates.length !== 1 ? 's' : ''} disponible{filteredTemplates.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
