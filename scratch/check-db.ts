import { getSupabaseAdmin } from '../lib/supabase-admin';

async function checkRecentAppointments() {
  console.log('--- BUSCANDO CITAS RECIENTES EN DB ---');
  const { data, error } = await getSupabaseAdmin()
    .from('appointments')
    .select('*, contacts(name)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.table(data.map(a => ({
    id: a.id,
    date: a.appointment_date,
    time: a.appointment_time,
    status: a.status,
    contact: a.contacts?.name || '---',
    created: a.created_at
  })));
}

checkRecentAppointments();
