import { X, MessageSquare, Activity, Bot, ShieldCheck, Send, Power, Cpu, Zap, ArrowRight } from 'lucide-react';
import { parseUIMessageContent } from '@/lib/whatsapp-parser';

interface ChatMessage {
  sender_type: 'user' | 'agent' | 'bot';
  content: string;
  created_at: string;
}

interface Contact {
  full_name?: string;
  phone?: string;
  convStatus?: string;
}

interface ChatNeuralSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContact: Contact;
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
  selectedContact,
  chatMessages,
  newMessage,
  setNewMessage,
  onSendMessage,
  onToggleHandoff,
  isSending = false
}: ChatNeuralSlideOverProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-[#010409] h-full flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-white/5">
        
        {/* HEADER SECTION */}
        <header className="p-8 md:p-10 flex items-center justify-between bg-white/5 backdrop-blur-3xl sticky top-0 z-10 border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white/5 text-white rounded-[22px] flex items-center justify-center font-black text-lg border border-white/10 shadow-2xl uppercase italic">
                {selectedContact?.full_name?.[0] || '?'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-[#010409] rounded-full shadow-[0_0_10px_#22c55e]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight leading-none mb-2 uppercase italic">{selectedContact?.full_name || 'Nodo_Desconocido'}</h3>
              <div className="flex items-center gap-4">
                 <span className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 text-[8px] font-black text-green-500 uppercase tracking-widest border border-green-500/20 shadow-lg">
                   <Activity size={10} className="animate-pulse" />
                   LINK_ESTABLISHED
                 </span>
                 <p className="text-[10px] font-mono text-slate-600 font-black tracking-widest">+{selectedContact?.phone}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all text-slate-500 hover:text-white group">
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </header>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-transparent custom-scrollbar relative">
          {/* GRID OVERLAY */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-5">
              <MessageSquare size={120} strokeWidth={1} className="mb-8" />
              <p className="text-[10px] font-black uppercase tracking-[1.5em] text-white">Neural_Mapping</p>
            </div>
          )}

          <div className="relative space-y-10">
            {chatMessages.map((m, idx) => {
              const isBot = m.sender_type === 'bot';
              const isClient = m.sender_type === 'user';
              const isAgent = m.sender_type === 'agent';
              
              return (
                <div key={idx} className={`flex ${isClient ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                  <div className={`max-w-[85%] space-y-3`}>
                    
                    {/* BUBBLE HEADER */}
                    <div className={`flex items-center gap-3 mb-1 ${isClient ? 'justify-start' : 'justify-end'}`}>
                       {isBot ? (
                          <>
                             <Cpu size={12} className="text-green-500" />
                             <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Logic v2.5</span>
                          </>
                       ) : isAgent ? (
                          <>
                             <ShieldCheck size={12} className="text-blue-500" />
                             <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Admin_Node</span>
                          </>
                       ) : (
                          <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">User_Request</span>
                       )}
                    </div>

                    <div className={`p-6 rounded-[32px] text-[13px] font-medium leading-relaxed shadow-2xl transition-all relative overflow-hidden ${
                      isClient 
                        ? 'bg-white text-slate-900 rounded-tl-none border border-white' 
                        : isBot
                          ? 'bg-slate-900/80 backdrop-blur-xl text-slate-200 rounded-tr-none border border-white/5'
                          : 'bg-green-500 text-slate-900 rounded-tr-none font-bold'
                    }`}>
                      {(() => {
                        const { textParts, buttonParts } = parseUIMessageContent(m.content);
                        return (
                          <div className="space-y-4">
                            {textParts.map((text, tidx) => (
                              <p key={tidx} className="tracking-tight whitespace-pre-wrap">{text}</p>
                            ))}
                            {buttonParts.map((group, gidx) => (
                              <div key={gidx} className={`flex flex-wrap gap-2 pt-4 mt-4 border-t ${isClient || !isBot ? 'border-black/10' : 'border-white/5'}`}>
                                {group.map((btn, bidx) => (
                                  <button
                                    key={bidx}
                                    onClick={() => setNewMessage(btn)}
                                    className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 border ${
                                       isBot ? 'bg-white/5 border-white/10 text-white hover:bg-green-500 hover:text-slate-900 hover:border-transparent' : 'bg-black/5 border-black/10 text-slate-900 hover:bg-black/10'
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
                      <div className={`mt-4 flex items-center gap-3 opacity-30 text-[8px] font-black uppercase tracking-widest ${isClient || !isBot ? 'text-slate-900' : 'text-white'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="p-8 md:p-10 bg-white/5 backdrop-blur-3xl border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between mb-8">
             <button 
               onClick={onToggleHandoff}
               className={`flex items-center gap-4 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border shadow-2xl ${
                 selectedContact?.convStatus === 'waiting_human'
                  ? 'bg-green-500 text-slate-900 border-green-400'
                  : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-white'
               }`}
             >
               <Power size={16} />
               {selectedContact?.convStatus === 'waiting_human' ? 'CONTROL_HUMANO_ACTIVO' : 'IA_AUTÓNOMA'}
             </button>
             <div className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] italic">
               Loop_Neural_v2.5
             </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-white/5 rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <textarea 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={selectedContact?.convStatus === 'waiting_human' ? "ESCRIBIR_COMANDO_HUMANO..." : "MODO_ESCUCHA_IA_..."}
              className="w-full bg-white/5 border border-white/5 rounded-[32px] p-8 pr-24 text-[13px] font-medium text-white outline-none focus:bg-white/10 focus:border-green-500/30 transition-all resize-none h-32 lg:h-40 relative z-10 placeholder:text-slate-700"
            />
            <button
              onClick={onSendMessage}
              disabled={!newMessage.trim() || isSending}
              className="absolute right-6 bottom-6 w-14 h-14 bg-white text-slate-900 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-2xl z-20 disabled:opacity-10"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
