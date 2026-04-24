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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {templates.map(t => (
            <div key={t.id} className="loop-card p-10 bg-white/5 border-white/5 shadow-2xl relative overflow-hidden group hover:bg-white/[0.08] hover:border-white/10 transition-all cursor-pointer rounded-[40px]">
               {/* GLOW DETAIL */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               
               <div className="flex items-center justify-between mb-10 relative z-10">
                  <div className="w-14 h-14 bg-white/5 rounded-[22px] flex items-center justify-center text-slate-600 group-hover:bg-green-500 group-hover:text-slate-900 transition-all border border-white/5 group-hover:border-transparent shadow-xl">
                    <FileCode size={24} />
                  </div>
                  <span className="text-[8px] font-black text-green-500 uppercase tracking-[0.2em] bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20 shadow-lg">
                    {t.category}
                  </span>
                </div>
                
                <div className="relative z-10">
                   <p className="text-[12px] font-black text-white uppercase tracking-tight leading-tight mb-4 group-hover:text-green-500 transition-colors italic">{t.name}</p>
                   <div className="flex items-center justify-between mt-8">
                      <div className="flex items-center gap-3 text-slate-700">
                         <Layers size={14} />
                         <span className="text-[8px] font-black uppercase tracking-widest">Skill_Node</span>
                      </div>
                      <ArrowUpRight size={18} className="text-slate-700 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                   </div>
                </div>
                
                <div className="w-full h-1.5 bg-white/5 mt-8 rounded-full overflow-hidden border border-white/5 relative z-10">
                  <div className="w-1/3 h-full bg-gradient-to-r from-green-500 to-transparent opacity-40" />
                </div>
            </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-40 text-center bg-white/5 backdrop-blur-3xl rounded-[48px] border border-dashed border-white/10">
            <Cpu size={48} className="mx-auto text-slate-800 mb-8 opacity-20" />
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] italic">No secondary skills discovered in node</p>
          </div>
        )}
      </div>
    </div>
  );
}
