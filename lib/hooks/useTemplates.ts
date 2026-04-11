'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Template } from '@/app/components/templates/types';

export function useTemplates() {
  // Memoizar el cliente para evitar loop infinito de re-renderizado
  const supabase = useMemo(() => createClient(), []);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    const { data } = await supabase.from('templates').select('*').order('priority');
    if (data && data.length > 0) {
      // Si hay plantillas en BD, usar SOLO esas (la BD es la fuente de verdad)
      const normalized = data.map((t: any) => ({
        ...t,
        actions: t.actions || [],
        segment: t.segment || 'todos',
        is_active: t.is_active ?? true,
        priority: t.priority || 50
      }));
      setTemplates(normalized);
    } else {
      // Si NO hay plantillas en BD, mantener vacío hasta que el usuario decida restaurar
      setTemplates([]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchTemplates(); }, []); // Solo ejecutar al montar, fetchTemplates ya está memoizado

  const saveTemplate = useCallback(async (template: Partial<Template> & { id: string }) => {
    const t = { id: template.id, name: template.name!, content: template.content!, category: template.category || 'general', service_type: template.service_type, trigger: template.trigger, actions: template.actions || [], is_active: template.is_active ?? true, priority: template.priority || 50, segment: template.segment || 'todos', workflow: template.workflow || 'general' };
    await supabase.from('templates').upsert(t);
    setTemplates(prev => prev.find(x => x.id === t.id) ? prev.map(x => x.id === t.id ? t : x) : [...prev, t]);
  }, [supabase]);

  const deleteTemplate = useCallback(async (id: string) => {
    await supabase.from('templates').delete().eq('id', id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, [supabase]);

  const toggleActive = useCallback(async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    const updated = { ...template, is_active: !template.is_active };
    await supabase.from('templates').update({ is_active: updated.is_active }).eq('id', id);
    setTemplates(prev => prev.map(t => t.id === id ? updated : t));
  }, [supabase, templates]);

  const deleteAllTemplates = useCallback(async () => {
    const { data } = await supabase.from('templates').select('id');
    if (data && data.length > 0) {
      const ids = data.map(d => d.id);
      await supabase.from('templates').delete().in('id', ids);
    }
    setTemplates([]);
  }, [supabase]);

  return { templates, loading, refetch: fetchTemplates, fetchTemplates, saveTemplate, deleteTemplate, deleteAllTemplates, toggleActive };
}

export function useTemplateFilters() {
  const [category, setCategory] = useState('todos');
  const [segment, setSegment] = useState('todos');
  const [service, setService] = useState('todos');
  const [search, setSearch] = useState('');

  return { category, setCategory, segment, setSegment, service, setService, search, setSearch };
}