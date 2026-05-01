import { X, MessageSquare, Activity, Bot, ShieldCheck, Send, Power, Cpu, Zap, ArrowRight } from 'lucide-react';
import { parseUIMessageContent } from '@/lib/whatsapp-parser';
import type { CRMContactType } from '@/app/crm/page';

import { Message } from '@/types/database';

export type ChatMessage = Pick<Message, 'id' | 'content' | 'sender_type' | 'created_at'>;

interface ChatNeuralSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  contact: CRMContactType | null;
  chatMessages: ChatMessage[];
  newMessage: string;
  setNewMessage: (msg: string) => void;
  onSendMessage: () => void;
  onToggleHandoff: () => void;
  isSending?: boolean;
}

export function ChatNeuralSlideOver({
  isOpen,
  onClose,
  contact,
  chatMessages,
  newMessage,
  setNewMessage,
  onSendMessage,
  onToggleHandoff,
  isSending = false
}: ChatNeuralSlideOverProps) {
  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white h-full flex flex-col animate-in slide-in-from-right duration-700 overflow-hidden shadow-[-40px_0_100px_rgba(0,0,0,0.2)] border-l border-slate-100">
        
        {/* DECORATIVE BACKGROUND ACCENTS */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full -z-10" />

        {/* HEADER SECTION */}
        <header className="p-10 md:p-12 flex items-center justify-between bg-white/40 backdrop-blur-3xl sticky top-0 z-20 border-b border-slate-100">
          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 text-neural-dark rounded-xl flex items-center justify-center font-black text-2xl border border-slate-200 shadow-inner uppercase italic group-hover:bg-primary group-hover:text-white transition-all duration-500">
                {contact?.full_name?.[0] || '?'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary border-4 border-white rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-neural-dark tracking-tighter leading-none mb-3 uppercase italic">{contact?.full_name || 'Nodo_Desconocido'}</h3>
              <div className="flex items-center gap-6">
                 <span className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-primary/10 text-[9px] font-black text-primary uppercase tracking-[0.3em] border border-primary/10 shadow-sm italic">
                   <Activity size={12} className="animate-pulse" />
                   ARISE_LINK_ESTABLISHED_v11.9.1
                 </span>
                 <p className="text-[11px] font-black text-slate-400 font-mono tracking-widest italic opacity-60">+{contact?.phone}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-16 h-16 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition-all duration-500 text-slate-300 hover:text-neural-dark group shadow-sm hover:shadow-xl">
            <X size={24} className="group-hover:rotate-180 transition-transform duration-700" />
          </button>
        </header>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-transparent custom-scrollbar relative">
          {/* GRID OVERLAY */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />

          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-5 scale-110">
              <MessageSquare size={160} strokeWidth={1} className="mb-10 text-neural-dark" />
              <p className="text-[12px] font-black uppercase tracking-[2em] text-neural-dark italic">Neural_Mapping</p>
            </div>
          )}

          <div className="relative space-y-12">
            {chatMessages.map((m, idx) => {
              const isBot = m.sender_type === 'bot';
              const isClient = m.sender_type === 'user';
              const isAgent = m.sender_type === 'agent';
              
              return (
                <div key={idx} className={`flex ${isClient ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-8 duration-700`}>
                  <div className={`max-w-[85%] space-y-4`}>
                    
                    {/* BUBBLE HEADER */}
                    <div className={`flex items-center gap-4 mb-2 ${isClient ? 'justify-start' : 'justify-end'} opacity-40`}>
                       {isBot ? (
                          <>
                             <Cpu size={14} className="text-primary" />
                             <span className="text-[8px] font-black text-neural-dark uppercase tracking-widest italic">ARISE_NEURAL_ENGINE_v11.9.1</span>
                          </>
                       ) : isAgent ? (
                          <>
                             <ShieldCheck size={14} className="text-accent" />
                             <span className="text-[8px] font-black text-neural-dark uppercase tracking-widest italic">Admin_Node</span>
                          </>
                       ) : (
                          <span className="text-[8px] font-black text-neural-dark uppercase tracking-widest italic">User_Request</span>
                       )}
                    </div>

                    <div className={`p-8 rounded-xl text-[14px] font-bold tracking-tight leading-relaxed shadow-2xl transition-all relative overflow-hidden italic ${
                      isClient 
                        ? 'bg-neural-dark text-white rounded-tl-none' 
                        : isBot
                          ? 'bg-slate-50 text-neural-dark rounded-tr-none border border-slate-100'
                          : 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/20'
                    }`}>
                      {(() => {
                        const { textParts, buttonParts } = parseUIMessageContent(m.content);
                        return (
                          <div className="space-y-6">
                            {textParts.map((text, tidx) => (
                              <p key={tidx} className="whitespace-pre-wrap">{text}</p>
                            ))}
                            {buttonParts.map((group, gidx) => (
                              <div key={gidx} className={`flex flex-wrap gap-3 pt-6 mt-6 border-t ${isClient ? 'border-white/10' : 'border-slate-100'}`}>
                                {group.map((btn, bidx) => (
                                  <button
                                    key={bidx}
                                    onClick={() => setNewMessage(btn)}
                                    className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 border italic ${
                                       isBot ? 'bg-white border-slate-200 text-neural-dark hover:bg-primary hover:text-white hover:border-primary shadow-sm' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                    }`}
                                  >
                                    {btn}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      <div className={`mt-6 flex items-center gap-4 opacity-40 text-[9px] font-black uppercase tracking-widest italic ${isClient ? 'text-white' : 'text-neural-dark'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        <Activity size={10} className="animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="p-10 md:p-12 bg-white/60 backdrop-blur-3xl border-t border-slate-100 shadow-[0_-20px_80px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-10">
             <button 
               onClick={onToggleHandoff}
               className={`flex items-center gap-4 px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border shadow-2xl italic ${
                 (contact as any)?.convStatus === 'waiting_human'
                  ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20'
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-white hover:border-primary/30 hover:text-primary'
               }`}
             >
               <Power size={18} className={(contact as any)?.convStatus === 'waiting_human' ? 'animate-pulse' : ''} />
               {(contact as any)?.convStatus === 'waiting_human' ? 'CONTROL_HUMANO_ACTIVO' : 'IA_AUTÓNOMA'}
             </button>
             <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic opacity-60">
               ARISE_NEURAL_ENGINE_v11.9.1
             </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-xl blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
            <textarea 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={(contact as any)?.convStatus === 'waiting_human' ? "ESCRIBIR_COMANDO_HUMANO..." : "MODO_ESCUCHA_IA_..."}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-10 pr-28 text-[15px] font-bold text-neural-dark outline-none focus:bg-white focus:border-primary/30 transition-all resize-none h-36 lg:h-44 relative z-10 placeholder:text-slate-300 focus:shadow-2xl italic custom-scrollbar"
            />
            <button
              onClick={onSendMessage}
              disabled={!newMessage.trim() || isSending}
              className="absolute right-8 bottom-8 w-16 h-16 bg-neural-dark text-white rounded-xl flex items-center justify-center hover:bg-primary hover:scale-110 active:scale-95 transition-all duration-500 shadow-2xl z-20 disabled:opacity-30 group/send"
            >
              {isSending ? (
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={24} className="group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
