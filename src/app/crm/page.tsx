'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CRMPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, activeChats: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCRMData() {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { count: activeCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('is_open', true);

      if (contactData) setContacts(contactData);
      setStats({
        total: contactData?.length || 0,
        activeChats: activeCount || 0
      });
      setLoading(false);
    }

    fetchCRMData();
  }, []);

  return (
    <main className="p-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Contact Intelligence</h1>
        <p className="text-slate-500 font-medium mt-1">CRM Management & Neural Communication</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatMini title="Total Contacts" value={loading ? '..' : stats.total} />
        <StatMini title="Active Chats" value={loading ? '..' : stats.activeChats} />
        <StatMini title="Lead Conversion" value="24%" />
        <StatMini title="AI Response Rate" value="99.8%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 executive-card p-8">
          <h2 className="text-xl font-bold mb-6">Recent Contacts</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="h-20 bg-base animate-pulse rounded-base" />
            ) : contacts.length > 0 ? (
              contacts.slice(0, 5).map((contact) => (
                <ContactRow 
                  key={contact.id} 
                  name={contact.name || contact.phone_number} 
                  status={contact.segment || 'prospecto'} 
                  time={new Date(contact.created_at).toLocaleDateString()} 
                />
              ))
            ) : (
              <p className="text-sm text-slate-400">No contacts found in database.</p>
            )}
          </div>
        </section>

        <section className="executive-card p-8">
          <h2 className="text-xl font-bold mb-6">Segments</h2>
          <div className="space-y-4">
             <SegmentItem label="Clients" count={contacts.filter(c => c.segment === 'cliente').length} color="bg-primary" />
             <SegmentItem label="Prospects" count={contacts.filter(c => c.segment === 'prospecto').length} color="bg-amber-400" />
             <SegmentItem label="Family" count={contacts.filter(c => c.segment === 'familia').length} color="bg-emerald-400" />
          </div>
        </section>
      </div>
    </main>
  );
}

function StatMini({ title, value }: any) {
  return (
    <div className="executive-card p-6">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function ContactRow({ name, status, time }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-base/30 rounded-base hover:bg-base/50 transition-colors cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
          {name[0]}
        </div>
        <div>
          <p className="font-bold text-slate-900">{name}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">{time}</p>
        </div>
      </div>
      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
        status === 'cliente' ? 'bg-emerald-100 text-emerald-700' : 
        status === 'familia' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
      }`}>
        {status}
      </span>
    </div>
  );
}

function SegmentItem({ label, count, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <span className="font-bold text-slate-900">{count}</span>
    </div>
  );
}

