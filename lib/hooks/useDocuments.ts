'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ClientDocument, Contact, Company } from '@/lib/types';

export function useDocuments() {
  const supabase = createClient();
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('client_documents')
      .select('*, contacts:contacts(phone_number, name), companies:companies(id, legal_name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) console.error('Error fetching docs:', error);
    else setDocuments((data || []) as ClientDocument[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const deleteDocument = useCallback(async (id: string) => {
    const { error } = await supabase.from('client_documents').delete().eq('id', id);
    if (error) throw error;
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, [supabase]);

  const filterDocuments = useCallback((
    docs: ClientDocument[],
    filters: { contactId?: string; companyId?: string; type?: string; search?: string }
  ) => {
    return docs.filter((doc) => {
      if (filters.contactId && doc.contact_id !== filters.contactId) return false;
      if (filters.companyId && doc.company_id !== filters.companyId) return false;
      if (filters.type) {
        if (!doc.title?.toLowerCase().includes(filters.type.toLowerCase())) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!doc.title?.toLowerCase().includes(q) && 
            !doc.file_name?.toLowerCase().includes(q) &&
            !doc.contacts?.name?.toLowerCase().includes(q) &&
            !doc.companies?.legal_name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, []);

  return { documents, loading, refetch: fetchDocuments, deleteDocument, filterDocuments };
}

export function useDocumentFilters() {
  const [contactFilter, setContactFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const clearFilters = useCallback(() => {
    setContactFilter('');
    setCompanyFilter('');
    setTypeFilter('');
    setSearchQuery('');
  }, []);

  const hasFilters = useMemo(() => 
    !!(contactFilter || companyFilter || typeFilter || searchQuery), 
    [contactFilter, companyFilter, typeFilter, searchQuery]
  );

  return {
    filters: { contactId: contactFilter, companyId: companyFilter, type: typeFilter, search: searchQuery },
    contactFilter, setContactFilter,
    companyFilter, setCompanyFilter,
    typeFilter, setTypeFilter,
    searchQuery, setSearchQuery,
    clearFilters, hasFilters
  };
}

export function useContactsList() {
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    supabase.from('contacts').select('id, phone_number, name').order('name').then(({ data }) => {
      if (data) setContacts(data);
    });
  }, [supabase]);

  return contacts;
}

export function useCompaniesList() {
  const supabase = createClient();
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    supabase.from('companies').select('id, legal_name').order('legal_name').then(({ data }) => {
      if (data) setCompanies(data);
    });
  }, [supabase]);

  return companies;
}