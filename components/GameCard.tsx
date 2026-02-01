import React, { useState } from 'react';
import { LottoGame } from '../types';
import NumberBall from './NumberBall';
import { Copy, Check, Save, Loader2, Info, Sparkles, Trash2 } from 'lucide-react';
import { saveGameToDb } from '../services/supabaseClient';

interface GameCardProps {
  game: LottoGame;
  index: number;
  hideActions?: boolean;
  isSavedView?: boolean;
  onDelete?: () => void;
  date?: string;
}

const GameCard: React.FC<GameCardProps> = ({ game, index, hideActions, isSavedView, onDelete, date }) => {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const hotNumbers = [4, 1, 8, 20, 2, 15, 23, 10, 7, 21];
  const coldNumbers = [14, 3, 18, 11, 9, 16, 17];

  const handleCopy = () => {
    const text = game.numbers.join(' ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (isSaving || saveStatus === 'success') return;
    setIsSaving(true);
    const result = await saveGameToDb(game);
    if (result.success) {
      setSaveStatus('success');
    } else {
      alert(`Erro ao salvar: ${result.error}`);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
    setIsSaving(false);
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary-200 transition-all duration-300 overflow-hidden flex flex-col relative">
      
      {/* Decorative Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-violet-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>

      {/* Card Header */}
      <div className="px-5 py-4 flex items-start justify-between">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-900 font-extrabold text-base flex items-center justify-center border border-slate-100 shadow-inner">
                 {index + 1}
             </div>
             <div className="flex flex-col">
                 <span className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                     {game.tags[0] || 'Palpite Otimizado'}
                     {game.probabilityScore >= 90 && <Sparkles size={12} className="text-amber-500 fill-amber-500" />}
                 </span>
                 <div className="flex flex-wrap gap-1 mt-1">
                    {game.tags.slice(1).map((tag, i) => (
                        <span key={i} className="text-[10px] font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-100">
                            {tag}
                        </span>
                    ))}
                 </div>
             </div>
         </div>
         
         <div className="flex items-start gap-3">
             <div className="flex flex-col items-end gap-1">
                 <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                     <span className="text-[10px] font-bold text-emerald-600 uppercase">Score</span>
                     <span className="text-sm font-black text-emerald-700">{game.probabilityScore}%</span>
                 </div>
                 {date && (
                     <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                         {date}
                     </span>
                 )}
             </div>

             {onDelete && (
                <button 
                    onClick={(e) => {
                         e.stopPropagation();
                         onDelete();
                    }}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors -mr-2"
                    title="Excluir"
                >
                    <Trash2 size={18} />
                </button>
             )}
         </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-5">
        {/* Numbers - Updated to Grid Layout for perfect 5x3 alignment */}
        <div className="bg-slate-50/50 rounded-xl p-4 mb-5 border border-slate-100/50 flex justify-center">
            <div className="grid grid-cols-5 gap-x-3 gap-y-3 sm:gap-x-5 sm:gap-y-4 justify-items-center">
            {game.numbers.map((num) => (
                <NumberBall 
                key={num} 
                number={num} 
                isHot={!isSavedView && hotNumbers.includes(num)}
                isCold={!isSavedView && coldNumbers.includes(num)}
                />
            ))}
            </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Reasoning */}
            <div className="flex gap-2.5 text-xs text-slate-500 max-w-sm leading-relaxed bg-white p-2 rounded-lg">
                <Info size={16} className="shrink-0 mt-0.5 text-primary-500" />
                <p><span className="font-semibold text-slate-700 block mb-0.5">Análise da IA:</span> {game.reasoning}</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                <button 
                    onClick={handleCopy}
                    className={`
                        flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border
                        ${copied 
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}
                    `}
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copiado' : 'Copiar'}
                </button>
                
                {!isSavedView && (
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || saveStatus === 'success'}
                        className={`
                            flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95
                            ${saveStatus === 'success' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : saveStatus === 'error'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-900 text-white border border-slate-900 hover:bg-slate-800'}
                        `}
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : 
                         saveStatus === 'success' ? <Check size={16} /> : <Save size={16} />}
                        {saveStatus === 'success' ? 'Salvo' : 'Salvar'}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;