import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ServiceRequest {
  id: string;
  request_code: string;
  contact_id: string;
  company_id: string | null;
  request_type: string;
  description: string;
  status: 'pending' | 'resolved' | 'cancelled';
  created_at: string;
  contacts?: {
    name: string;
    phone_number: string;
  };
  companies?: {
    legal_name: string;
  };
}

export function useServiceRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          contacts(name, phone_number),
          companies(legal_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (e) {
      console.error('Error fetching service requests:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'resolved' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (e) {
      console.error('Error updating request status:', e);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('requests_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'service_requests' 
      }, () => {
        console.log('[Realtime] Cambio detectado en solicitudes, actualizando...');
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return {
    requests,
    loading,
    refetch: fetchRequests,
    updateStatus
  };
}
