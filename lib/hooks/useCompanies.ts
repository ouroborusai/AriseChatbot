'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Company, ClientDocument } from '@/lib/types';

export function useCompanies() {
  const supabase = createClient();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching companies:', error);
    else setCompanies(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const createCompany = useCallback(async (name: string, rut?: string) => {
    const { data, error } = await supabase.from('companies').insert({ legal_name: name, rut: rut || null }).select().single();
    if (error) throw error;
    return data;
  }, [supabase]);

  const updateCompany = useCallback(async (id: string, updates: Partial<Company>) => {
    const { error } = await supabase.from('companies').update(updates).eq('id', id);
    if (error) throw error;
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, [supabase]);

  const deleteCompany = useCallback(async (id: string) => {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  }, [supabase]);

  const searchCompanies = useCallback((query: string) => {
    const q = query.toLowerCase();
    return companies.filter((c) => c.legal_name.toLowerCase().includes(q) || c.rut?.toLowerCase().includes(q));
  }, [companies]);

  return { companies, loading, refetch: fetchCompanies, createCompany, updateCompany, deleteCompany, searchCompanies };
}

export function useCompanyContacts(companyId: string | null) {
  const supabase = createClient();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCompanyContacts = useCallback(async (cid: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('contact_companies').select('contact_id, company_id, role, is_primary, contacts(phone_number, name)').eq('company_id', cid);
    if (error) console.error('Error fetching company contacts:', error);
    else setContacts(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!companyId) { setContacts([]); return; }
    fetchCompanyContacts(companyId);
  }, [companyId, fetchCompanyContacts]);

  const linkContact = useCallback(async (contactId: string, companyId: string, role?: string) => {
    const { error } = await supabase.from('contact_companies').insert({ contact_id: contactId, company_id: companyId, role: role || null, is_primary: false });
    if (error) throw error;
    await fetchCompanyContacts(companyId);
  }, [supabase, fetchCompanyContacts]);

  const unlinkContact = useCallback(async (contactId: string, companyId: string) => {
    const { error } = await supabase.from('contact_companies').delete().eq('contact_id', contactId).eq('company_id', companyId);
    if (error) throw error;
    await fetchCompanyContacts(companyId);
  }, [supabase, fetchCompanyContacts]);

  return { contacts, loading, refetch: () => companyId && fetchCompanyContacts(companyId), linkContact, unlinkContact };
}

export function useClientDocuments(companyId: string | null) {
  const supabase = createClient();
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClientDocuments = useCallback(async (cid: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('client_documents').select('*, contacts(phone_number, name)').eq('company_id', cid).order('created_at', { ascending: false });
    if (error) console.error('Error fetching company documents:', error);
    else setDocuments((data || []) as ClientDocument[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!companyId) { setDocuments([]); return; }
    fetchClientDocuments(companyId);
  }, [companyId, fetchClientDocuments]);

  const deleteDocument = useCallback(async (docId: string) => {
    const { error } = await supabase.from('client_documents').delete().eq('id', docId);
    if (error) throw error;
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  }, [supabase]);

  return { documents, loading, refetch: () => companyId && fetchClientDocuments(companyId), deleteDocument };
}