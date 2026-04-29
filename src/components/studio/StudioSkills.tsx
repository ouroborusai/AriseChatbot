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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map(t => (
            <div key={t.id} className="bg-white border border-slate-100 p-8 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all cursor-pointer rounded-xl">
               <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="w-12 h-12 bg-slate-50 rounded-md flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all border border-slate-100 group-hover:border-transparent shadow-sm">
                    <FileCode size={20} />
                  </div>
                  <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-3 py-1.5 rounded-sm border border-primary/10 italic">
                    {t.category}
                  </span>
                </div>
                
                <div className="relative z-10">
                   <p className="text-[13px] font-black text-neural-dark uppercase tracking-tighter leading-tight mb-4 group-hover:text-primary transition-colors">{t.name}</p>
                   <div className="flex items-center justify-between mt-8">
                      <div className="flex items-center gap-3 text-slate-400">
                         <Layers size={14} className="text-accent" />
                         <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Skill_Node</span>
                      </div>
                      <ArrowUpRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                   </div>
                </div>
                
                <div className="w-full h-1 bg-slate-50 mt-8 rounded-full overflow-hidden border border-slate-100 relative z-10 p-0.5">
                  <div className="w-1/3 h-full bg-primary/40 rounded-full" />
                </div>
            </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Cpu size={40} className="mx-auto text-slate-200 mb-8 animate-pulse" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">No secondary skills discovered in node</p>
          </div>
        )}
      </div>
    </div>
  );
}
