'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInventory() {
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');
      
      if (data) setItems(data);
      setLoading(false);
    }

    fetchInventory();
  }, []);

  return (
    <main className="p-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Operations Hub</h1>
        <p className="text-slate-500 font-medium mt-1">Supply Chain & Physical Stock Management</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatMini title="Total SKUs" value={loading ? '..' : items.length} />
        <StatMini title="Low Stock Items" value={items.filter(i => i.current_stock <= i.min_stock_alert).length} />
        <StatMini title="Pending Reorders" value="--" />
        <StatMini title="Asset Valuation" value="Calculated" />
      </div>

      <div className="executive-card overflow-hidden">
        <div className="p-8 border-b border-base flex justify-between items-center">
          <h2 className="text-xl font-bold">Inventory Items</h2>
          <button className="bg-primary text-white px-4 py-2 rounded-base text-xs font-bold shadow-micro-glow hover:opacity-90 transition-opacity">
            + New Item
          </button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-base/50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              <th className="p-4 pl-8">Name / SKU</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-center">Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center animate-pulse text-slate-300 font-bold italic">Loading Neural Assets...</td></tr>
            ) : items.length > 0 ? (
              items.map((item) => (
                <InventoryRow 
                  key={item.id}
                  name={item.name} 
                  sku={item.sku || 'N/A'} 
                  cat={item.category || 'General'} 
                  stock={`${item.current_stock} ${item.unit || 'uds'}`} 
                  status={item.current_stock <= item.min_stock_alert ? 'Critical' : 'Optimal'} 
                />
              ))
            ) : (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">No assets found in warehouse.</td></tr>
            )}
          </tbody>
        </table>
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

function InventoryRow({ name, sku, cat, stock, status }: any) {
  return (
    <tr className="hover:bg-base/20 transition-colors group">
      <td className="p-4 pl-8">
        <p className="font-bold text-slate-900">{name}</p>
        <p className="text-[10px] text-slate-400 font-bold">{sku}</p>
      </td>
      <td className="p-4 text-sm text-slate-500 font-medium">{cat}</td>
      <td className="p-4 text-sm font-bold text-center text-slate-900">{stock}</td>
      <td className="p-4">
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
          status === 'Optimal' ? 'bg-emerald-100 text-emerald-700' : 
          status === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {status}
        </span>
      </td>
      <td className="p-4 pr-8 text-right opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-primary font-bold text-xs uppercase tracking-tighter">Edit</button>
      </td>
    </tr>
  );
}

