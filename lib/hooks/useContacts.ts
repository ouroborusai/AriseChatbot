'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Contact, CompanyLink } from '@/lib/types';

export function useContacts() {
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const searchContacts = useCallback((query: string, contacts: Contact[]) => {
    const q = query.toLowerCase();
    return contacts.filter(
      (c) =>
        c.phone_number.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, []);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    const { error } = await supabase.from('contacts').update(updates).eq('id', id);
    if (error) throw error;
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, [supabase]);

  return { contacts, loading, refetch: fetchContacts, searchContacts, updateContact };
}

export function useAllCompanies() {
  const supabase = createClient();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('id, legal_name, rut')
      .order('legal_name', { ascending: true });
    
    if (error) console.error('Error fetching all companies:', error);
    else setCompanies(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { companies, loading, refetch: fetchAll };
}

export function useContactCompanies(contactId: string | null) {
  const supabase = createClient();
  const [companyLinks, setCompanyLinks] = useState<CompanyLink[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchCompaniesForContact = useCallback(async (cid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_companies')
      .select('company_id, is_primary, companies(id, legal_name)')
      .eq('contact_id', cid);

    if (error) {
      console.error('Error fetching contact companies:', error);
      setCompanyLinks([]);
    } else {
      const links = (data || []).map((item: any) => ({
        company_id: item.company_id,
        is_primary: item.is_primary,
        companies: item.companies ? [item.companies].flat()[0] : null,
      })) as CompanyLink[];
      setCompanyLinks(links);
      const primary = links.find((l) => l.is_primary)?.company_id || '';
      setSelectedCompanyId(primary);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!contactId) {
      setCompanyLinks([]);
      setSelectedCompanyId('');
      return;
    }
    fetchCompaniesForContact(contactId);
  }, [contactId, fetchCompaniesForContact]);

  const createAndLinkCompany = useCallback(async (contactId: string, companyName: string) => {
    const { data: company, error: cErr } = await supabase
      .from('companies')
      .insert({ legal_name: companyName.trim() })
      .select('id, legal_name')
      .single();
    if (cErr) throw cErr;

    const { error: linkErr } = await supabase
      .from('contact_companies')
      .upsert({ contact_id: contactId, company_id: company.id, is_primary: companyLinks.length === 0 });
    if (linkErr) throw linkErr;

    await fetchCompaniesForContact(contactId);
  }, [supabase, companyLinks.length, fetchCompaniesForContact]);

  const setPrimaryCompany = useCallback(async (contactId: string, companyId: string) => {
    await supabase.from('contact_companies').update({ is_primary: false }).eq('contact_id', contactId);
    await supabase.from('contact_companies').update({ is_primary: true }).eq('contact_id', contactId).eq('company_id', companyId);
    setSelectedCompanyId(companyId);
    await fetchCompaniesForContact(contactId);
  }, [supabase, fetchCompaniesForContact]);

  const linkExistingCompany = useCallback(async (contactId: string, companyId: string) => {
    const { error: linkErr } = await supabase
      .from('contact_companies')
      .upsert({ 
        contact_id: contactId, 
        company_id: companyId, 
        is_primary: companyLinks.length === 0 
      });
    if (linkErr) throw linkErr;
    await fetchCompaniesForContact(contactId);
  }, [supabase, companyLinks.length, fetchCompaniesForContact]);

  return {
    companyLinks,
    selectedCompanyId,
    setSelectedCompanyId,
    loading,
    refetch: () => contactId && fetchCompaniesForContact(contactId),
    createAndLinkCompany,
    linkExistingCompany,
    setPrimaryCompany,
  };
}