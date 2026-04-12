'use client';

import { Action, ListOption, Template } from './types';

interface ActionEditorProps {
  actions: Action[];
  onChangeActions: (actions: Action[]) => void;
  listOptions: ListOption[];
  onChangeListOptions: (options: ListOption[]) => void;
  responseType: 'text' | 'buttons' | 'list';
  onChangeResponseType: (type: 'text' | 'buttons' | 'list') => void;
  allTemplates: Template[];
  currentTemplateId: string;
}

export default function ActionEditor({
  actions,
  onChangeActions,
  listOptions,
  onChangeListOptions,
  responseType,
  onChangeResponseType,
  allTemplates,
  currentTemplateId,
}: ActionEditorProps) {

  const addAction = () => {
    if (responseType !== 'buttons') return;
    if (actions.length >= 3) return;
    onChangeActions([...actions, { type: 'button', id: '', title: '', next_template_id: '' }]);
  };

  const updateAction = (index: number, field: keyof Action, value: string) => {
    onChangeActions(actions.map((a, i) => i === index ? { ...a, [field]: value === '' ? undefined : value } : a));
  };

  const removeAction = (index: number) => {
    onChangeActions(actions.filter((_, i) => i !== index));
    if (actions[index].type === 'list') {
      onChangeListOptions([]);
    }
  };

  const addListOption = () => {
    if (listOptions.length >= 10) return;
    onChangeListOptions([...listOptions, { id: `opt_${listOptions.length + 1}`, title: '', description: '', next_template_id: '' }]);
  };

  const updateListOption = (index: number, field: keyof ListOption, value: string) => {
    onChangeListOptions(listOptions.map((opt, i) => i === index ? { ...opt, [field]: value === '' ? undefined : value } : opt));
  };

  const removeListOption = (index: number) => {
    onChangeListOptions(listOptions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-2xl">
        {['text', 'buttons', 'list'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChangeResponseType(t as any)}
            className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${responseType === t ? 'bg-white shadow-sm text-slate-900 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="text-lg">{t === 'text' ? '💬' : t === 'buttons' ? '🔘' : '📋'}</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">{t}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[200px]">
        {responseType === 'buttons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase">Config Botones</span>
              <button type="button" onClick={addAction} disabled={actions.length >= 3} className="text-[10px] font-black text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg transition-all">+ ADD</button>
            </div>
            <div className="space-y-3">
              {actions.map((action, index) => (
                  <div key={index} className="group p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all relative">
                    <button type="button" onClick={() => removeAction(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-white shadow-sm rounded-full text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    <input
                      value={action.title || ''}
                      onChange={(e) => updateAction(index, 'title', e.target.value)}
                      placeholder="Título botón"
                      className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 mb-2"
                    />
                    <select
                      value={action.next_template_id || ''}
                      onChange={(e) => updateAction(index, 'next_template_id', e.target.value)}
                      className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-500 focus:ring-0"
                    >
                      <option value="">🔌 Sin conectar</option>
                      {allTemplates.filter(t => t.id !== currentTemplateId).map(t => <option key={t.id} value={t.id}>→ Enlazar a: {t.name}</option>)}
                    </select>
                  </div>
              ))}
            </div>
          </div>
        )}

        {responseType === 'list' && (
          <div className="space-y-4">
              <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase">Items de Lista</span>
              <button type="button" onClick={addListOption} disabled={listOptions.length >= 10} className="text-[10px] font-black text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-all">+ ITEM</button>
            </div>
            <div className="space-y-3">
              {listOptions.map((opt, idx) => (
                <div key={idx} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      value={opt.title}
                      onChange={(e) => updateListOption(idx, 'title', e.target.value)}
                      placeholder="Título (Ej: Facturación)"
                      className="flex-1 bg-white border border-blue-100 rounded-xl px-3 py-2 text-xs font-bold text-blue-900"
                    />
                    <button type="button" onClick={() => removeListOption(idx)} className="text-rose-400 text-sm">✕</button>
                  </div>
                  <select
                    value={opt.next_template_id || ''}
                    onChange={(e) => updateListOption(idx, 'next_template_id', e.target.value)}
                    className="w-full bg-white/50 border border-blue-50 rounded-lg px-3 py-1.5 text-[9px] font-bold text-blue-600"
                  >
                    <option value="">🔌 Detalle</option>
                    {allTemplates.filter(t => t.id !== currentTemplateId).map(t => <option key={t.id} value={t.id}>→ Enlazar a: {t.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
