import { createClient } from '@supabase/supabase-js';
import { LottoGame, SavedGame, HistoricalDraw } from '../types';

// Credenciais via Variáveis de Ambiente (Segurança)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials not found in environment variables.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- AUTHENTICATION ---

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
};

// --- SAVED GAMES (JOGOS GERADOS) ---

export const saveGameToDb = async (game: LottoGame): Promise<{ success: boolean; error?: string }> => {
  try {
    const payload = {
      numbers: game.numbers,
      reasoning: game.reasoning || "Sem análise",
      score: game.probabilityScore || 0,
      tags: Array.isArray(game.tags) ? game.tags : []
    };

    console.log("Tentando salvar payload:", payload);

    const { error } = await supabase
      .from('saved_games')
      .insert([payload]);

    if (error) {
        console.error("Supabase Error Object:", error);
        
        if (error.message && (error.message.includes('tags') || error.message.includes('column'))) {
             console.warn("Erro de coluna detectado. Tentando salvar sem o campo 'tags'...");
             const fallbackPayload = {
                 numbers: game.numbers,
                 reasoning: game.reasoning || "Sem análise",
                 score: game.probabilityScore || 0
             };
             const { error: fallbackError } = await supabase.from('saved_games').insert([fallbackPayload]);
             if (fallbackError) throw fallbackError;
             return { success: true };
        }
        throw error;
    }
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao salvar no Supabase (Catch):", err);
    const msg = err.message || JSON.stringify(err);
    return { success: false, error: msg };
  }
};

export const getSavedGames = async (): Promise<SavedGame[]> => {
  try {
    const { data, error } = await supabase
      .from('saved_games')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SavedGame[];
  } catch (err) {
    console.error("Erro ao buscar jogos:", err);
    return [];
  }
};

export const deleteSavedGame = async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('saved_games').delete().eq('id', id);
    return !error;
}

// --- HISTORICAL RESULTS (CONCURSOS) ---

export const getStoredDraws = async (): Promise<HistoricalDraw[]> => {
    try {
        const { data, error } = await supabase
            .from('draw_results')
            .select('*')
            .order('concourse', { ascending: false });
        
        if (error) throw error;
        return data as HistoricalDraw[];
    } catch (err) {
        console.error("Erro ao buscar sorteios salvos:", err);
        return [];
    }
}

export const getLatestDrawNumber = async (): Promise<number> => {
    try {
        const { data, error } = await supabase
            .from('draw_results')
            .select('concourse')
            .order('concourse', { ascending: false })
            .limit(1);

        if (error) {
            // Se a tabela não existir, retorna 0 para forçar busca completa
            if (error.code === '42P01') return 0; 
            throw error;
        }
        
        if (data && data.length > 0) {
            return data[0].concourse;
        }
        return 0;
    } catch (err) {
        console.warn("Não foi possível obter o último concurso (tabela vazia ou erro):", err);
        return 0;
    }
}

export const saveDraws = async (draws: HistoricalDraw[]): Promise<{ success: boolean; count: number }> => {
    if (!draws || draws.length === 0) return { success: true, count: 0 };
    
    try {
        // Usa upsert para evitar duplicatas baseadas na coluna 'concourse' (deve ser unique no BD)
        const { error } = await supabase
            .from('draw_results')
            .upsert(draws, { onConflict: 'concourse' });

        if (error) throw error;
        return { success: true, count: draws.length };
    } catch (err) {
        console.error("Erro ao salvar sorteios:", err);
        return { success: false, count: 0 };
    }
}