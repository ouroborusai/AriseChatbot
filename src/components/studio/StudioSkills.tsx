import React from 'react';
import { FileCode, ArrowUpRight, Cpu, Layers } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: string;
}

interface StudioSkillsProps {
  templates: Template[];
}

export function StudioSkills({ templates }: StudioSkillsProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {templates.map(t => (
            <div key={t.id} className="bg-white border border-slate-100 p-6 shadow-sm relative overflow-hidden group hover:border-[#22c55e]/30 transition-all cursor-pointer rounded-2xl">
               <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-[#22c55e] group-hover:text-white transition-all border border-slate-100 group-hover:border-transparent">
                    <FileCode size={18} />
                  </div>
                  <span className="text-[7px] font-black text-[#22c55e] uppercase tracking-widest bg-[#22c55e]/10 px-2.5 py-1 rounded-md border border-[#22c55e]/10">
                    {t.category}
                  </span>
                </div>
                
                <div className="relative z-10">
                   <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-tight mb-3 group-hover:text-[#22c55e] transition-colors">{t.name}</p>
                   <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-2 text-slate-400">
                         <Layers size={12} />
                         <span className="text-[7px] font-black uppercase tracking-widest">Skill_Node</span>
                      </div>
                      <ArrowUpRight size={14} className="text-slate-300 group-hover:text-[#22c55e] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                   </div>
                </div>
                
                <div className="w-full h-1 bg-slate-50 mt-6 rounded-full overflow-hidden border border-slate-100 relative z-10">
                  <div className="w-1/3 h-full bg-[#22c55e]/40" />
                </div>
            </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-24 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Cpu size={32} className="mx-auto text-slate-200 mb-6" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">No secondary skills discovered in node</p>
          </div>
        )}
      </div>
    </div>
  );
}
