import React from 'react';

export default function Dashboard() {
  return (
    <main className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ouroborus AI</h1>
          <p className="text-slate-500">Neural Brain Dashboard v6.0</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            Diamond Level
          </span>
          <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard title="Total Revenue" value="$42,500.00" change="+12.5%" />
        <MetricCard title="Inventory Health" value="98.2%" change="Optimal" />
        <MetricCard title="Active Contacts" value="1,073" change="+54 today" />
      </div>

      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold mb-4">Neural Insights</h2>
        <div className="space-y-4">
          <InsightItem text="Stock low on SKU-882 (Flour). Automatic reorder triggered." status="alert" />
          <InsightItem text="New high-value contact detected: 'Bakery Group Inc'." status="success" />
          <InsightItem text="Weekly financial reconciliation complete. 0 discrepancies." status="info" />
        </div>
      </section>
    </main>
  );
}

function MetricCard({ title, value, change }: any) {
  return (
    <div className="surface-card p-6">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-3xl font-bold mt-1">{value}</h3>
      <p className="text-xs text-blue-600 font-medium mt-2">{change}</p>
    </div>
  );
}

function InsightItem({ text, status }: any) {
  return (
    <div className="flex items-center gap-3 p-3 tonal-bg rounded-lg">
      <div className={`w-2 h-2 rounded-full ${status === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
      <p className="text-sm text-slate-700">{text}</p>
    </div>
  );
}
