import React from 'react';
import { FileCode } from 'lucide-react';

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map(t => (
            <div key={t.id} className="loop-card p-8 bg-white border-none shadow-arise relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer rounded-[32px]">
               <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 bg-[#f7f9fb] rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-primary transition-all">
                    <FileCode size={20} />
                  </div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] bg-[#f2f4f6] px-3 py-1.5 rounded-lg">
                    {t.category}
                  </span>
                </div>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.1em] leading-tight mb-3 group-hover:text-primary transition-colors">{t.name}</p>
                <div className="w-full h-1 bg-[#f2f4f6] mt-4 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-primary/20" />
                </div>
            </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-32 text-center bg-white/50 backdrop-blur-md rounded-[40px] border border-dashed border-slate-200">
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em]">No secondary skills discovered</p>
          </div>
        )}
      </div>
    </div>
  );
}
