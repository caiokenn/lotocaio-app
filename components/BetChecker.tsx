import React, { useState, useEffect } from 'react';
import { getHistoricalResults } from '../services/geminiService';
import { getStoredDraws, saveDraws, getLatestDrawNumber } from '../services/supabaseClient';
import { HistoricalDraw } from '../types';
import { RefreshCw, RotateCcw, Loader2, ClipboardPaste, X, Database, Globe, Trophy } from 'lucide-react';

const BetChecker: React.FC = () => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [history, setHistory] = useState<HistoricalDraw[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdateInfo, setLastUpdateInfo] = useState<string>("");
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [manualPasteText, setManualPasteText] = useState("");

  const loadStoredData = async () => {
    setLoadingHistory(true);
    try {
      const storedDraws = await getStoredDraws();
      if (storedDraws && storedDraws.length > 0) {
        setHistory(storedDraws);
        setLastUpdateInfo(`#${storedDraws[0].concourse}`);
      } else {
        setLastUpdateInfo("Vazio");
        await handleSync();
      }
    } catch (error) {
      console.error("Failed to load stored history", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { loadStoredData(); }, []);

  const handleSync = async () => {
      if (isSyncing) return;
      setIsSyncing(true);
      try {
          const latestId = await getLatestDrawNumber();
          const newDraws = await getHistoricalResults(latestId);
          if (newDraws && newDraws.length > 0) {
              await saveDraws(newDraws);
              const updatedHistory = await getStoredDraws();
              setHistory(updatedHistory);
              if (updatedHistory.length > 0) setLastUpdateInfo(`#${updatedHistory[0].concourse}`);
          }
      } catch (err: any) {
          console.error("Sync error:", err);
      } finally {
          setIsSyncing(false);
      }
  }

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length < 19) setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  const processText = (text: string): boolean => {
    const matches = text.match(/\d+/g);
    if (matches) {
      const parsed = matches.map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n >= 1 && n <= 25);
      const uniqueNumbers = [...new Set(parsed)].slice(0, 19).sort((a, b) => a - b);
      if (uniqueNumbers.length > 0) {
        setSelectedNumbers(uniqueNumbers);
        return true;
      }
    }
    return false;
  };

  const handleSmartPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!processText(text)) setShowPasteInput(true);
    } catch (err) {
      setShowPasteInput(true);
    }
  };

  const calculateHits = (drawNumbers: number[]) => drawNumbers.filter(num => selectedNumbers.includes(num)).length;

  const getHitColor = (hits: number) => {
    if (hits === 15) return 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-200';
    if (hits === 14) return 'bg-emerald-400 text-white border-emerald-500';
    if (hits >= 11) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-50 text-slate-400 border-slate-100';
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Selection Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Conferidor Profissional</h2>
            <div className="flex items-center gap-2 mt-1.5">
                 <button 
                    onClick={handleSync} 
                    disabled={isSyncing} 
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-[10px] font-bold text-slate-600 transition-colors border border-slate-200"
                 >
                    <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
                    {isSyncing ? "SINCRONIZANDO..." : `BASE ATUALIZADA: ${lastUpdateInfo}`}
                 </button>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 p-1.5 bg-slate-50 rounded-xl border border-slate-200">
             <div className="px-4 flex flex-col justify-center">
                 <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 leading-none">{selectedNumbers.length}</span>
                    <span className="text-xs text-slate-400 font-bold uppercase">/ 19 máx</span>
                 </div>
             </div>
             <div className="h-8 w-px bg-slate-200"></div>
             <div className="flex gap-1">
                <button onClick={handleSmartPaste} className="p-2.5 text-primary-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Colar Área de Transferência"><ClipboardPaste size={20} /></button>
                <button onClick={() => {setSelectedNumbers([]); setShowPasteInput(false);}} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Limpar Tudo"><RotateCcw size={20} /></button>
             </div>
          </div>
        </div>

        {/* Manual Input Fallback */}
        {showPasteInput && (
          <div className="mb-6 animate-in slide-in-from-top-2">
            <div className="relative">
              <textarea
                className="w-full p-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 text-sm resize-none transition-all shadow-inner"
                placeholder="Cole os números aqui (ex: 01 02 03...)"
                rows={2}
                value={manualPasteText}
                onChange={(e) => { setManualPasteText(e.target.value); processText(e.target.value); }}
                autoFocus
              />
              <button onClick={() => setShowPasteInput(false)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600"><X size={14} /></button>
            </div>
          </div>
        )}

        {/* Number Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5 sm:gap-3">
          {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
            const isSelected = selectedNumbers.includes(num);
            return (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                className={`
                  h-11 sm:h-12 rounded-xl font-bold text-sm transition-all duration-200 border-2
                  ${isSelected 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20 transform scale-105' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-primary-300 hover:text-primary-600 hover:shadow-md'}
                `}
              >
                {num < 10 ? `0${num}` : num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
            <Globe size={16} className="text-primary-500" /> Resultados da Base
          </h3>
          <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500 shadow-sm">
            {history.length} CONCURSOS
          </span>
        </div>
        
        {loadingHistory ? (
           <div className="flex-1 flex flex-col items-center justify-center py-16">
             <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white p-3 rounded-full shadow-sm border border-slate-100 z-10">
                   <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
             </div>
             <p className="text-slate-500 text-sm font-medium animate-pulse">Carregando histórico...</p>
           </div>
        ) : (
          /* SCROLL AREA ADDED HERE */
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {history.length === 0 ? (
                <div className="py-20 text-center">
                    <Database className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Nenhum concurso salvo na base local.</p>
                </div>
            ) : (
                history.map((draw) => {
                const hits = calculateHits(draw.numbers);
                const isWin = hits >= 11;
                return (
                    <div key={draw.concourse} className={`p-4 transition-colors ${isWin && selectedNumbers.length >= 11 ? 'bg-emerald-50/40 hover:bg-emerald-50' : 'hover:bg-slate-50'}`}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            
                            {/* Concourse Info */}
                            <div className="flex flex-row sm:flex-col justify-between w-full sm:w-24 items-center sm:items-start shrink-0">
                                <div>
                                    <span className="block font-bold text-slate-800 text-sm flex items-center gap-1">
                                        #{draw.concourse}
                                        {isWin && selectedNumbers.length >= 11 && <Trophy size={12} className="text-amber-500 fill-amber-500" />}
                                    </span>
                                    <span className="block text-[10px] text-slate-400">{draw.date}</span>
                                </div>
                                {/* Mobile Badge */}
                                <div className={`sm:hidden px-2 py-0.5 rounded text-[10px] font-bold border ${getHitColor(hits)}`}>
                                    {hits}
                                </div>
                            </div>

                            {/* Numbers */}
                            <div className="flex-1 flex flex-wrap gap-1.5">
                                {draw.numbers.map(num => {
                                    const isHit = selectedNumbers.includes(num);
                                    return (
                                    <div key={num} className={`
                                        w-7 h-7 rounded-full text-[11px] flex items-center justify-center font-bold border
                                        ${isHit 
                                            ? 'bg-slate-800 text-white border-slate-800' 
                                            : 'bg-white text-slate-300 border-slate-100'}
                                    `}>
                                        {num}
                                    </div>
                                    );
                                })}
                            </div>

                            {/* Desktop Badge */}
                            <div className={`hidden sm:flex w-20 h-9 rounded-lg border items-center justify-center font-bold text-sm shadow-sm ${getHitColor(hits)}`}>
                                 {hits} pts
                            </div>
                        </div>
                    </div>
                );
                })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BetChecker;