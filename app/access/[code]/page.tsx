'use client';

import { useEffect, useState, useMemo, use } from 'react';
import { createClient } from '@/lib/supabase/client';

type Company = {
  id: string;
  legal_name: string;
};

type Document = {
  id: string;
  title: string;
  file_name: string | null;
  file_url: string | null;
  created_at: string;
};

type ServiceRequest = {
  id: string;
  request_code: string;
  request_type: string;
  status: string;
  created_at: string;
  result_url: string | null;
};

type ContactData = {
  id: string;
  phone_number: string;
  name: string | null;
  segment: string | null;
  companies: { id: string; legal_name: string } | null;
  documents: Document[];
  requests: ServiceRequest[];
};

type ValidationResult = {
  valid: boolean;
  error?: string;
  phone_number?: string;
};

export default function AccessPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const supabase = useMemo(() => createClient(), []);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [contact, setContact] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'requests'>('documents');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateCode = async () => {
      try {
        const response = await fetch(`/api/access-code?code=${resolvedParams.code}`);
        const data = await response.json();

        if (!data.valid) {
          setError(data.error || 'Código inválido');
          setLoading(false);
          return;
        }

        setValidation({ valid: true, phone_number: data.phone_number });

        const phone = data.phone_number;
        
        const { data: contactData } = await supabase
          .from('contacts')
          .select('id, phone_number, name, segment')
          .eq('phone_number', phone)
          .single();

        if (!contactData) {
          setError('Cliente no encontrado');
          setLoading(false);
          return;
        }

        const { data: companyData } = await supabase
          .from('contact_companies')
          .select('company_id, companies(id, legal_name)')
          .eq('contact_id', contactData.id)
          .eq('is_primary', true)
          .single();

        const companyId = companyData?.company_id || '';

        const { data: docs } = await supabase
          .from('client_documents')
          .select('id, title, file_name, file_url, created_at')
          .eq('contact_id', contactData.id)
          .eq('company_id', companyId || null)
          .order('created_at', { ascending: false })
          .limit(20);

        const { data: requests } = await supabase
          .from('service_requests')
          .select('id, request_code, request_type, status, created_at, result_url')
          .eq('contact_id', contactData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        const primaryCompany = companyData?.companies 
          ? Array.isArray(companyData.companies) 
            ? companyData.companies[0] 
            : companyData.companies
          : null;

        setContact({
          ...contactData,
          companies: primaryCompany,
          documents: docs || [],
          requests: requests || [],
        });
      } catch (err) {
        console.error('Error:', err);
        setError('Error al validar código');
      } finally {
        setLoading(false);
      }
    };

    if (resolvedParams.code) {
      validateCode();
    }
  }, [resolvedParams.code, supabase]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      in_progress: 'En proceso',
      completed: 'Completado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getFileIcon = (fileName: string | null) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) return '🖼️';
    if (['xlsx', 'xls'].includes(ext || '')) return '📊';
    return '📁';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-3 border-solid border-green-500 border-r-transparent mb-4"></div>
          <p>Validando código...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-slate-400">{error}</p>
          <p className="text-slate-500 text-sm mt-4">Solicita un nuevo código a tu asesor de MTZ.</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center p-8">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-slate-400">No se pudo cargar la información.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold">MTZ Consultores</h1>
              <p className="text-green-100 text-sm">Portal del Cliente</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold">
            {contact.name || 'Cliente'}
          </h2>
          {contact.companies && (
            <p className="text-green-100">{contact.companies.legal_name}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div className="flex gap-2 bg-white rounded-2xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${
              activeTab === 'documents'
                ? 'bg-green-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            📄 Mis Documentos ({contact.documents.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${
              activeTab === 'requests'
                ? 'bg-green-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            📋 Mis Solicitudes ({contact.requests.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'documents' ? (
          <div className="space-y-3">
            {contact.documents.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="text-4xl mb-3">📁</div>
                <p className="text-slate-600 font-medium">No hay documentos disponibles</p>
                <p className="text-slate-400 text-sm mt-1">Contacta a tu asesor para solicitar documentos</p>
              </div>
            ) : (
              contact.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4"
                >
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">
                    {getFileIcon(doc.file_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{doc.title}</p>
                    {doc.file_name && (
                      <p className="text-sm text-slate-500 truncate">{doc.file_name}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(doc.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                    >
                      Ver
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {contact.requests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-slate-600 font-medium">No hay solicitudes</p>
                <p className="text-slate-400 text-sm mt-1">Contacta a tu asesor para hacer una solicitud</p>
              </div>
            ) : (
              contact.requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-sm font-bold text-slate-900">
                      {req.request_code}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(req.status)}`}>
                      {getStatusLabel(req.status)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{req.request_type}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(req.created_at).toLocaleDateString('es-CL')}
                  </p>
                  {req.result_url && (
                    <a
                      href={req.result_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block text-center text-sm text-green-600 hover:underline"
                    >
                      Ver resultado →
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Contacto */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-sm text-slate-500 mb-3">¿Necesitas ayuda?</p>
          <a
            href={`https://wa.me/${contact.phone_number.replace(/\D/g, '')}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700"
          >
            💬 Escribir a MTZ
          </a>
        </div>
      </div>
    </div>
  );
}
