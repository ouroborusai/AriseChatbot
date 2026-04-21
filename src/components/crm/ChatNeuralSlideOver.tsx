import React from 'react';
import { X, MessageSquare, Activity, Bot, ShieldCheck, Send, Power } from 'lucide-react';

interface ChatNeuralSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContact: any;
  chatMessages: any[];
  newMessage: string;
  setNewMessage: (msg: string) => void;
  onSendMessage: () => void;
  onToggleHandoff: () => void;
}

export function ChatNeuralSlideOver({ 
  isOpen, 
  onClose, 
  selectedContact, 
  chatMessages, 
  newMessage, 
  setNewMessage, 
  onSendMessage,
  onToggleHandoff
}: ChatNeuralSlideOverProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden shadow-2xl">
        <header className="p-6 md:p-10 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-none">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-900 text-white rounded-[18px] md:rounded-[20px] flex items-center justify-center font-black text-base md:text-lg shadow-md uppercase">
                {selectedContact?.full_name?.[0]}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-none mb-1 md:mb-2 uppercase">{selectedContact?.full_name}</h3>
              <div className="flex items-center gap-2 md:gap-4">
                 <span className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-emerald-50 text-[7px] md:text-[8px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100/50">
                   <Activity size={10} />
                   Live_Comm
                 </span>
                 <p className="text-[7px] md:text-[9px] font-mono text-slate-400">+{selectedContact?.phone}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#f7f9fb] hover:bg-rose-50 rounded-xl md:rounded-2xl transition-all text-slate-400 hover:text-rose-500">
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-10 bg-[#f7f9fb]/50 custom-scrollbar">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-10">
              <MessageSquare size={80} strokeWidth={1} className="mb-6" />
              <p className="text-[9px] font-black uppercase tracking-[1em]">Establishing_Link</p>
            </div>
          )}
          {chatMessages.map((m, idx) => {
            const isAgent = m.sender_type === 'agent';
            const isBot = m.sender_type === 'bot';
            const isClient = m.sender_type === 'user';
            
            return (
              <div key={idx} className={`flex \${isClient ? 'justify-start' : 'justify-end'}`}>
                <div className={`group relative max-w-[90%] p-5 md:p-6 rounded-[24px] md:rounded-[28px] text-[12px] md:text-[13px] font-bold leading-relaxed shadow-sm transition-all hover:shadow-md \${
                  isClient 
                    ? 'bg-white text-slate-700 rounded-tl-none ring-1 ring-slate-100' 
                    : isBot
                      ? 'bg-[#191c1e] text-white rounded-tr-none'
                      : 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20'
                }`}>
                  {(isBot || isAgent) && (
                    <div className={`flex items-center gap-3 mb-3 md:mb-4 text-[7px] font-black uppercase tracking-[0.3em] opacity-40 \${!isBot ? 'text-white/70' : ''}`}>
                      {isBot ? <Bot size={12} /> : <ShieldCheck size={12} />}
                      {isBot ? 'Arise_Neural_Engine' : 'Human_Supervisor'}
                    </div>
                  )}
                  <p className="tracking-tight">{m.content}</p>
                  <div className={`mt-3 md:mt-4 flex items-center gap-3 opacity-30 text-[8px] font-black uppercase tracking-widest`}>
                    {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 md:p-10 bg-white border-none shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between mb-6 md:mb-8">
             <button 
               onClick={onToggleHandoff}
               className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] transition-all \${
                 selectedContact?.convStatus === 'waiting_human'
                  ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200 rotate-0'
                  : 'bg-[#f2f4f6] text-slate-400 hover:bg-slate-200'
               }`}
             >
               <Power className="w-4 h-4 md:w-5 md:h-5" />
               {selectedContact?.convStatus === 'waiting_human' ? 'Manual_Control' : 'AI_Operational'}
             </button>
             <div className="text-[7px] md:text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] italic">
               v9.0_Diamond_Protocol
             </div>
          </div>
          
          <div className="relative">
            <textarea 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={selectedContact?.convStatus === 'waiting_human' ? "Escribe como Agente Humano..." : "La IA responderá automáticamente..."}
              className="w-full bg-[#f7f9fb] border-none rounded-[24px] md:rounded-[32px] p-6 md:p-8 pr-20 md:pr-24 text-[12px] md:text-[13px] font-bold text-slate-800 outline-none focus:bg-white focus:shadow-arise transition-all resize-none h-32 md:h-40"
            />
            <button 
              onClick={onSendMessage}
              disabled={!newMessage.trim()}
              className="absolute right-4 bottom-4 md:right-6 md:bottom-6 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#135bec] to-[#0045bd] text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-primary/40 disabled:opacity-20 disabled:grayscale"
            >
              <Send className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
