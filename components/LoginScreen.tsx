import React, { useState } from 'react';
import { signIn } from '../services/supabaseClient';
import { Lock, Mail, Loader2, Ticket, ArrowRight, AlertCircle } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login')) {
           setError('E-mail ou senha incorretos.');
        } else {
           setError(error.message);
        }
      }
      // Session state update is handled by the listener in App.tsx
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-slate-200 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-slate-900/20">
            <Ticket className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">LotoCaio</h1>
          <p className="text-slate-500 text-sm mt-1">Acesso exclusivo para membros.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">E-mail</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="seu@email.com"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Senha</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg font-bold text-sm hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6 shadow-lg shadow-slate-900/10"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                Autenticando...
              </>
            ) : (
              <>
                Entrar no Sistema
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-400">
            &copy; 2026 LotoCaio Sistema v3.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;