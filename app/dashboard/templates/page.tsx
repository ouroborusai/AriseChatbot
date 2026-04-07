'use client';

import { useState } from 'react';

type Template = {
  id: string;
  name: string;
  content: string;
  category: 'bienvenida' | 'cobranza' | 'informacion' | 'documentos' | 'general';
};

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Saludo inicial',
    content: 'Hola 👋 Bienvenido a MTZ Consultores Tributarios. ¿En qué podemos ayudarte hoy?',
    category: 'bienvenida',
  },
  {
    id: '2',
    name: 'Solicitud de documentos',
    content: 'Para continuar con tu trámite, necesito que me envíes los siguientes documentos:\n- RUT actualizado\n- Última declaración de renta\n- Balance general del último mes',
    category: 'documentos',
  },
  {
    id: '3',
    name: 'Recordatorio de pago',
    content: 'Estimado cliente, le recordamos que su pago está pendiente de vencimiento. Por favor regularice su situación a la brevedad.',
    category: 'cobranza',
  },
  {
    id: '4',
    name: 'Confirmación de recepción',
    content: 'Hemos recibido tus documentos correctamente. Los revisaremos y te contactaremos a la brevedad.',
    category: 'general',
  },
  {
    id: '5',
    name: 'Horarios de atención',
    content: 'Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 hrs, y sábados de 10:00 a 14:00 hrs.',
    category: 'informacion',
  },
  {
    id: '6',
    name: 'Derivación a asesor',
    content: 'Tu consulta requiere atención especializada. Un asesor se pondrá en contacto contigo a la brevedad.',
    category: 'general',
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Omit<Template, 'id'>>({
    name: '',
    content: '',
    category: 'general',
  });
  const [showNewForm, setShowNewForm] = useState(false);

  const filteredTemplates =
    selectedCategory === 'todos'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const handleCopy = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name || !newTemplate.content) return;

    const template: Template = {
      id: Date.now().toString(),
      ...newTemplate,
    };

    setTemplates([...templates, template]);
    setNewTemplate({ name: '', content: '', category: 'general' });
    setShowNewForm(false);
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const categories = [
    { value: 'todos', label: 'Todas', color: 'bg-slate-600' },
    { value: 'bienvenida', label: 'Bienvenida', color: 'bg-green-600' },
    { value: 'cobranza', label: 'Cobranza', color: 'bg-red-600' },
    { value: 'informacion', label: 'Informacion', color: 'bg-blue-600' },
    { value: 'documentos', label: 'Documentos', color: 'bg-purple-600' },
    { value: 'general', label: 'General', color: 'bg-gray-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-base">
        <div className="card-header">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-whatsapp-border font-semibold">
              Biblioteca
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Plantillas de Mensajes</h1>
            <p className="text-sm text-slate-500">
              Respuestas predefinidas para agilizar la atencion
            </p>
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="inline-flex rounded-3xl bg-whatsapp-green px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-whatsapp-greenHover"
          >
            {showNewForm ? 'Cancelar' : '+ Nueva plantilla'}
          </button>
        </div>
      </div>

      {/* Formulario nueva plantilla */}
      {showNewForm && (
        <div className="card-base">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Nueva Plantilla</h2>
          <form onSubmit={handleAddTemplate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none"
                placeholder="Ej: Saludo inicial"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contenido
              </label>
              <textarea
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none resize-none"
                rows={4}
                placeholder="Escribe el contenido de la plantilla..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Categoria
              </label>
              <select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as Template['category'] })}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none"
              >
                <option value="general">General</option>
                <option value="bienvenida">Bienvenida</option>
                <option value="cobranza">Cobranza</option>
                <option value="informacion">Informacion</option>
                <option value="documentos">Documentos</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-3xl bg-whatsapp-green px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-whatsapp-greenHover"
            >
              Guardar plantilla
            </button>
          </form>
        </div>
      )}

      {/* Filtros por categoria */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedCategory === cat.value
                ? `${cat.color} text-white`
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Lista de plantillas */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="card-base">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-slate-900">{template.name}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full text-white ${
                      template.category === 'bienvenida'
                        ? 'bg-green-600'
                        : template.category === 'cobranza'
                        ? 'bg-red-600'
                        : template.category === 'informacion'
                        ? 'bg-blue-600'
                        : template.category === 'documentos'
                        ? 'bg-purple-600'
                        : 'bg-gray-600'
                    }`}
                  >
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-line">
                  {template.content}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(template)}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-300 hover:bg-slate-50 transition"
                >
                  {copiedId === template.id ? '✓ Copiado' : '📋 Copiar'}
                </button>
                {template.id.length > 1 && (
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-2 text-sm rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-500 text-center">
        {filteredTemplates.length} plantilla{filteredTemplates.length !== 1 ? 's' : ''} disponible{filteredTemplates.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
