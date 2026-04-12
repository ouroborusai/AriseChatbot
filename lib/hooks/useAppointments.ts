import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Appointment {
  id: string;
  contact_id: string;
  company_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string;
  created_at: string;
  contacts?: {
    name: string;
    phone_number: string;
  };
  companies?: {
    legal_name: string;
  };
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          contacts(name, phone_number),
          companies(legal_name)
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (e) {
      console.error('Error fetching appointments:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (e) {
      console.error('Error updating appointment status:', e);
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Error deleting appointment:', e);
    }
  };

  useEffect(() => {
    fetchAppointments();

    // Suscribirse a cambios en tiempo real
    // ID único para evitar colisiones en tiempo real
    const channelId = Math.random().toString(36).slice(2, 7);
    const channelName = `appointments-${channelId}`;

    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'appointments' 
      }, () => {
        console.log('[Realtime] Cambio en citas, refrescando...');
        fetchAppointments();
      })
      .subscribe();

    return () => {
      console.log('[Realtime] Limpiando canal citas...');
      supabase.removeChannel(subscription);
    };
  }, []);

  return {
    appointments,
    loading,
    refetch: fetchAppointments,
    updateStatus,
    deleteAppointment
  };
}
