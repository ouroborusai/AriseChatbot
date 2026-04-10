'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Template } from '@/app/components/templates/types';

export function useTemplates() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    const { data } = await supabase.from('templates').select('*').order('priority');
    if (data && data.length > 0) {
      const merged = [...(await import('@/app/components/templates')).DEFAULT_TEMPLATES as Template[]];
      data.forEach((t: any) => {
        if (!merged.find(m => m.id === t.id)) {
          merged.push({ ...t, actions: t.actions || [], segment: t.segment || 'todos', is_active: t.is_active ?? true, priority: t.priority || 50 });
        }
      });
      setTemplates(merged);
    } else {
      setTemplates((await import('@/app/components/templates')).DEFAULT_TEMPLATES as Template[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const saveTemplate = useCallback(async (template: Partial<Template> & { id: string }) => {
    const t = { id: template.id, name: template.name!, content: template.content!, category: template.category || 'general', service_type: template.service_type, trigger: template.trigger, actions: template.actions || [], is_active: template.is_active ?? true, priority: template.priority || 50, segment: template.segment || 'todos' };
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

  return { templates, loading, refetch: fetchTemplates, saveTemplate, deleteTemplate, toggleActive };
}

export function useTemplateFilters() {
  const [category, setCategory] = useState('todos');
  const [segment, setSegment] = useState('todos');
  const [service, setService] = useState('todos');
  const [search, setSearch] = useState('');

  return { category, setCategory, segment, setSegment, service, setService, search, setSearch };
}