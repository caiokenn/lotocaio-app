import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wand2, RefreshCw, ClipboardCheck, TrendingUp, Save, Database, Loader2, Trash2, Zap, Ticket, Trophy, Sparkles, PieChart, BarChart3, Wallet, LogOut } from 'lucide-react';
import { generateLottoSuggestions } from './services/geminiService';
import { getSavedGames, deleteSavedGame, getStoredDraws, supabase, signOut } from './services/supabaseClient';
import { LottoGame, AppView, FrequentCombination, SavedGame } from './types';
import GameCard from './components/GameCard';
import StatsDashboard from './components/StatsDashboard';
import BetChecker from './components/BetChecker';
import LoginScreen from './components/LoginScreen';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App State
  const [view, setView] = useState<AppView>(AppView.GENERATOR);
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<LottoGame[]>([]);
  const [combinations, setCombinations] = useState<FrequentCombination[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [dbCount, setDbCount] = useState(0);
  
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    }).catch(err => {
      console.warn("Sessão não pôde ser verificada (Provável erro de configuração/rede):", err);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
        // Only load DB stats if logged in
        getStoredDraws().then(draws => setDbCount(draws.length)).catch(() => {});
    }
  }, [session]);

  const handleGenerate = async () => {
    setLoading(true);
    setHasGenerated(false);
    try {
      const data = await generateLottoSuggestions();
      setGames(data.games);
      setCombinations(data.frequentCombinations);
      setHasGenerated(true);
    } catch (error) {
      console.error(error);
      alert("Não foi possível conectar com a IA. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const loadSavedGames = async () => {
    setLoadingSaved(true);
    const data = await getSavedGames();
    setSavedGames(data);
    setLoadingSaved(false);
  };

  const handleDeleteSaved = async (id: number) => {
      if(window.confirm('Tem certeza que deseja apagar este jogo?')) {
          await deleteSavedGame(id);
          setSavedGames(savedGames.filter(g => g.id !== id));
      }
  }

  const handleLogout = async () => {
      await signOut();
      setSession(null);
  }

  useEffect(() => {
    if (view === AppView.SAVED && session) {
      loadSavedGames();
    }
  }, [view, session]);

  // Auth Loading State (Splash)
  if (authLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
      );
  }

  // Render Login if no session
  if (!session) {
      return <LoginScreen />;
  }

  // Navigation Items Config
  const navItems = [
    { view: AppView.GENERATOR, label: 'Início', icon: Wand2 },
    { view: AppView.CHECKER, label: 'Conferir', icon: ClipboardCheck },
    { view: AppView.SAVED, label: 'Carteira', icon: Wallet },
    { view: AppView.DASHBOARD, label: 'Análise', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-slate-50/50 selection:bg-primary-100 selection:text-primary-900">
      
      {/* Header - Fixed & High Z-Index */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView(AppView.GENERATOR)}>
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10 group-hover:scale-105 transition-transform">
              <Ticket size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight leading-none text-slate-900">LotoCaio</h1>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sistema v3.0</span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
             {navItems.map((item) => (
               <button
                 key={item.view}
                 onClick={() => setView(item.view)}
                 className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                   view === item.view 
                     ? 'bg-white text-slate-900 shadow-sm' 
                     : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                 }`}
               >
                 <item.icon size={16} />
                 {item.label}
               </button>
             ))}
          </nav>

          {/* Action (Desktop): Logout */}
          <div className="hidden md:block">
              <button 
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Sair do sistema"
              >
                  <LogOut size={18} />
              </button>
          </div>
          
          {/* Mobile: Just Logout Icon (Nav is bottom) */}
          <div className="md:hidden">
            <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600"
            >
                <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-8 content-spacer">
        
        {/* View: GENERATOR */}
        <div className={view === AppView.GENERATOR ? 'block animate-in fade-in slide-in-from-bottom-2 duration-300' : 'hidden'}>
            
            {/* Hero / Empty State */}
            {!hasGenerated && !loading && (
                <div className="flex flex-col items-center justify-center text-center py-12 sm:py-20">
                    <div className="mb-8 p-4 bg-white rounded-2xl shadow-soft border border-slate-100 relative">
                         <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">BETA</div>
                         <Sparkles size={32} className="text-slate-900" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        Inteligência Artificial
                    </h2>
                    <p className="text-slate-500 max-w-lg mx-auto text-base sm:text-lg mb-10 leading-relaxed">
                        Nossa engine analisa {dbCount > 0 ? `${dbCount} concursos históricos` : 'a base de dados'} para encontrar padrões matemáticos ocultos e gerar palpites de alta probabilidade.
                    </p>
                    
                    <button
                        onClick={handleGenerate}
                        className="group flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-slate-900/10 hover:bg-slate-800 hover:scale-[1.02] transition-all active:scale-95"
                    >
                        <Zap size={20} className="fill-white" />
                        Gerar Palpites
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-white p-4 rounded-full shadow-md border border-slate-100 z-10">
                            <Loader2 size={32} className="text-primary-600 animate-spin" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 animate-pulse">Processando Big Data...</h3>
                    <p className="text-slate-500 text-sm mt-2">
                        {dbCount > 0 
                         ? `Analisando ${dbCount} concursos completos da sua base.`
                         : 'Cruzando concursos com padrões matemáticos.'}
                    </p>
                </div>
            )}

            {/* Results */}
            {hasGenerated && (
              <>
                 <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                         <Ticket size={20} className="text-slate-400" />
                         Sugestões Geradas
                     </h3>
                     <button 
                        onClick={handleGenerate} 
                        className="text-sm font-semibold text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                     >
                        <RefreshCw size={14} /> Atualizar
                     </button>
                 </div>

                 <div className="grid grid-cols-1 gap-5 mb-12">
                  {games.map((game, index) => (
                    <GameCard key={index} game={game} index={index} />
                  ))}
                </div>

                {/* Insight Cards */}
                {combinations.length > 0 && (
                   <div className="border-t border-slate-200 pt-8">
                     <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-amber-500" />
                        Insights da Análise
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                       {combinations.map((combo, idx) => (
                         <div key={idx} className="bg-white rounded-xl p-5 shadow-card border border-slate-100 flex flex-col justify-between hover:shadow-card-hover transition-shadow">
                           <div className="flex justify-between items-start mb-3">
                             <div className="bg-primary-50 text-primary-600 p-1.5 rounded-md">
                                <Trophy size={16} />
                             </div>
                             <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full uppercase tracking-wider">{combo.type}</span>
                           </div>
                           <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 min-h-[40px]">
                               {combo.description}
                           </p>
                           <div className="flex items-center justify-between mt-auto">
                                <div className="flex gap-1">
                                    {combo.numbers.slice(0,5).map(n => (
                                    <span key={n} className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center">
                                        {n}
                                    </span>
                                    ))}
                                </div>
                                <span className="text-sm font-bold text-slate-800">{combo.count}x</span>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </>
            )}
        </div>

        {/* View: CHECKER */}
        <div className={view === AppView.CHECKER ? 'block animate-in fade-in slide-in-from-bottom-2 duration-300' : 'hidden'}>
          <BetChecker />
        </div>

        {/* View: SAVED */}
        <div className={view === AppView.SAVED ? 'block animate-in fade-in slide-in-from-bottom-2 duration-300' : 'hidden'}>
             <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h2 className="text-2xl font-bold text-slate-800">Minha Carteira</h2>
                    <button 
                        onClick={loadSavedGames}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Atualizar lista"
                    >
                        <RefreshCw size={20} className={loadingSaved ? 'animate-spin' : ''} />
                    </button>
                </div>

                {loadingSaved ? (
                     <div className="py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
                        <p className="text-slate-500 text-sm">Sincronizando dados...</p>
                    </div>
                ) : savedGames.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Save className="w-6 h-6 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Nenhum palpite salvo</h3>
                        <p className="text-slate-500 text-sm mb-6">Salve seus palpites favoritos para acompanhá-los aqui.</p>
                        <button 
                            onClick={() => setView(AppView.GENERATOR)}
                            className="text-sm font-bold text-primary-600 hover:underline"
                        >
                            Ir para o Gerador
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {savedGames.map((game, index) => (
                            <div key={game.id}>
                                <GameCard 
                                    game={{
                                        numbers: game.numbers,
                                        reasoning: game.reasoning,
                                        probabilityScore: game.score,
                                        tags: game.tags || []
                                    }} 
                                    index={index}
                                    isSavedView={true}
                                    onDelete={() => handleDeleteSaved(game.id)}
                                    date={new Date(game.created_at).toLocaleDateString('pt-BR')}
                                />
                            </div>
                        ))}
                    </div>
                )}
             </div>
        </div>

        {/* View: DASHBOARD */}
        <div className={view === AppView.DASHBOARD ? 'block animate-in fade-in slide-in-from-bottom-2 duration-300' : 'hidden'}>
          <StatsDashboard />
        </div>
      </main>

      {/* Mobile Bottom Navigation - FIXED & SOLID */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe pt-2 px-6 shadow-[0_-4px_6px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center h-14">
            {navItems.map((item) => (
                <button 
                    key={item.view}
                    onClick={() => setView(item.view)}
                    className={`flex flex-col items-center justify-center w-14 gap-1 transition-colors duration-200 ${
                        view === item.view ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <item.icon size={22} strokeWidth={view === item.view ? 2.5 : 2} className={view === item.view ? 'fill-slate-100' : ''} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </button>
            ))}
        </div>
      </nav>

    </div>
  );
};

export default App;