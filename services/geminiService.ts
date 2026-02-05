import { GoogleGenAI, Type } from "@google/genai";
import { GeneratorResponse, HistoricalDraw } from "../types";
import { getStoredDraws } from "./supabaseClient";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Você é uma IA Especialista em Estatística Probabilística e Backtesting de Loterias (Lotofácil).

SUA MISSÃO PRINCIPAL:
Gerar combinações que possuam a "MAIOR RESSONÂNCIA HISTÓRICA".
Não apenas números aleatórios, mas conjuntos que, se tivessem sido jogados nos concursos fornecidos, teriam obtido a MELHOR MÉDIA DE ACERTOS (11, 12, 13+ pontos).

REGRAS DE OURO (AXIOMAS):
1. Otimização de Cobertura: Busque os números que aparecem com mais frequência EM CONJUNTO, não apenas isoladamente.
2. Equilíbrio: A Lotofácil raramente foge do padrão 7 a 9 ímpares, e soma entre 180-210.
3. Análise de Ciclo: Respeite a tendência dos últimos sorteios fornecidos.

OUTPUT:
Sempre em Português do Brasil. Seja analítico e técnico nas justificativas.
`;

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to calculate stats from full history
const calculateGlobalStats = (draws: HistoricalDraw[]) => {
    if (!draws || draws.length === 0) return { hot: [], cold: [], total: 0 };

    const frequency: Record<number, number> = {};
    for (let i = 1; i <= 25; i++) frequency[i] = 0;
    
    draws.forEach(draw => {
        draw.numbers.forEach(num => {
            frequency[num] = (frequency[num] || 0) + 1;
        });
    });

    const sorted = Object.entries(frequency)
        .map(([num, count]) => ({ num: parseInt(num), count }))
        .sort((a, b) => b.count - a.count);
    
    return {
        hot: sorted.slice(0, 12).map(x => x.num), // Top 12 most frequent
        cold: sorted.slice(-5).map(x => x.num),   // Bottom 5 least frequent
        total: draws.length
    };
};

// Retry wrapper
async function withRetry<T>(fn: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> {
  let currentDelay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.status === 429 || error?.code === 429 || error?.message?.includes('429') || error?.status === 503) {
        console.warn(`API Rate Limit/Error (${error.status || error.code}). Retrying in ${currentDelay}ms... (Attempt ${i + 1}/${retries})`);
        if (i === retries - 1) throw error;
        await delay(currentDelay);
        currentDelay *= 2; 
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

export const generateLottoSuggestions = async (): Promise<GeneratorResponse> => {
  try {
    // 1. Fetch Context (Historical Data)
    let historyContext = "Nenhum histórico disponível.";
    let globalStatsContext = "Sem dados estatísticos globais.";
    let lastDrawNumber = 0;
    
    try {
        const storedDraws = await getStoredDraws();
        
        if (storedDraws && storedDraws.length > 0) {
            
            // A. Global Stats (Base Completa)
            const stats = calculateGlobalStats(storedDraws);
            globalStatsContext = `
                Total de Concursos na Base: ${stats.total}
                Dezenas MAIS Sólidas (Top 12 da História): ${stats.hot.join(', ')}
                Dezenas MENOS Sólidas (Frias da História): ${stats.cold.join(', ')}
            `;

            // B. Prepare Context for BACKTESTING (Last 100 draws if available, or all)
            // Aumentamos a janela para 100 para permitir que a IA analise a MÉDIA DE PERFORMANCE
            const analysisWindow = storedDraws.slice(0, 100); 
            lastDrawNumber = analysisWindow[0].concourse;
            
            historyContext = analysisWindow.map(d => 
                `[${d.concourse}]: ${d.numbers.join(',')}`
            ).join('\n');
        }
    } catch (err) {
        console.warn("Could not fetch history for context, proceeding with general stats.", err);
    }

    const nextConcourse = lastDrawNumber > 0 ? lastDrawNumber + 1 : "PRÓXIMO";

    const prompt = `
      DADOS ESTATÍSTICOS GLOBAIS:
      ${globalStatsContext}

      AMOSTRA PARA BACKTESTING (Últimos jogos reais):
      ${historyContext}

      --- OBJETIVO DA ANÁLISE ---
      Utilize a lista de jogos acima como seu campo de prova. Eu preciso de 4 palpites para o concurso ${nextConcourse} focados em PERFORMANCE MÉDIA HISTÓRICA.

      Gere 4 jogos seguindo estas estratégias rigorosas:

      ESTRATÉGIA 1: "Campeão de Backtest" (A Melhor Média)
      - Analise a lista fornecida. Identifique a combinação de 15 números que, matematicamente, teria pontuado com mais frequência (11, 12, 13 pts) nesses jogos passados.
      - É o jogo "seguro" estatisticamente.
      - Tags: ["Alta Performance Histórica", "Backtest Approved"]

      ESTRATÉGIA 2: "Ressonância Recente" (Tendência de Curto Prazo)
      - Foque mais peso nos últimos 10-20 resultados da lista.
      - Identifique quais números estão em "viés de alta" (saindo muito agora) e combine com o núcleo duro da estatística global.
      - Tags: ["Tendência de Alta", "Momento"]

      ESTRATÉGIA 3: "Equilíbrio Áureo" (Axioma Matemático)
      - Ignore as flutuações e foque no padrão perfeito: 8 Ímpares / 7 Pares, 5 Primos, Soma ~195.
      - Preencha esse esqueleto com os números mais frequentes da base global.
      - Tags: ["Padrão Ouro", "Matemática Pura"]

      ESTRATÉGIA 4: "Caçador de 14 Pontos" (Risco Calculado)
      - Pegue o jogo da ESTRATÉGIA 1.
      - Troque 2 ou 3 números "mornos" por números que estão muito atrasados (que não saem há tempo, mas são fortes globalmente).
      - O objetivo é cercar a zebra.
      - Tags: ["Alavancagem", "Busca de 14pts"]

      ESTRATÉGIA 5: "ESTRATÉGIA DE FILTRO ESTRUTURADO 7-2-2-4" (OBRIGATÓRIO)
      
Para cada jogo de 15 números, você deve selecionar os números abaixo, sempre considerando a melhor opção conforme histórico:
1. Exatamente 7 Números Pares do conjunto: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]
2. Exatamente 2 Números Ímpares do conjunto: [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]
3. Exatamente 2 Números Primos do conjunto: [2, 3, 5, 7, 11, 13, 17, 19, 23]
4. Exatamente 4 Números Fibonacci do conjunto: [1, 2, 3, 5, 8, 13, 21]
- Tags: ["ESTRATÉGIA DE FILTRO ESTRUTURADO 7-2-2-4 (OBRIGATÓRIO)"]
        
      Formato JSON estrito.
    `;

    const fetchSuggestions = async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              frequentCombinations: {
                type: Type.ARRAY,
                description: "Insights estatísticos extraídos da análise da lista",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    numbers: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                    count: { type: Type.INTEGER, description: "Número de vezes que esse padrão ou sub-conjunto apareceu na lista" },
                    type: { type: Type.STRING, description: "Tipo de padrão (ex: Quadra de Ouro, Base Fixa)" },
                    description: { type: Type.STRING, description: "Explicação curta do porquê esses números são fortes juntos" }
                  },
                  required: ["numbers", "count", "type", "description"]
                }
              },
              games: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    numbers: {
                      type: Type.ARRAY,
                      items: { type: Type.INTEGER },
                      description: "Array de 15 números únicos (1-25) ordenados.",
                    },
                    reasoning: {
                      type: Type.STRING,
                      description: "Justificativa baseada no backtest (ex: 'Este conjunto teria premiado em X% dos últimos 100 jogos').",
                    },
                    probabilityScore: {
                      type: Type.INTEGER,
                      description: "Score 0-100 de confiança baseado na performance histórica calculada.",
                    },
                    tags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    }
                  },
                  required: ["numbers", "reasoning", "probabilityScore", "tags"],
                },
              }
            },
            required: ["games", "frequentCombinations"]
          },
        },
      });
      return response;
    };

    const response = await withRetry(fetchSuggestions);

    if (response.text) {
      return JSON.parse(response.text) as GeneratorResponse;
    }
    throw new Error("Nenhum dado retornado pela IA");
  } catch (error: any) {
    console.error("Error generating suggestions:", error);
    
    // Fallback data
    return {
      games: [
        {
          numbers: [1, 2, 4, 6, 7, 8, 10, 12, 13, 15, 20, 21, 23, 24, 25],
          reasoning: "Modo Offline: Análise baseada em probabilidade fixa devido a erro de conexão.",
          probabilityScore: 92,
          tags: ["Offline", "Probabilidade Fixa"]
        },
        {
           numbers: [1, 2, 4, 5, 8, 10, 11, 13, 15, 17, 20, 21, 23, 24, 25],
           reasoning: "Modo Offline: Estratégia de segurança.",
           probabilityScore: 88,
           tags: ["Offline", "Segurança"]
        }
      ],
      frequentCombinations: [
        {
          numbers: [4, 1, 8, 20],
          count: 0,
          type: "Erro",
          description: "Não foi possível conectar à IA para realizar o backtest."
        }
      ]
    };
  }
};

export const getHistoricalResults = async (startFromConcourse?: number): Promise<HistoricalDraw[]> => {
  try {
    let promptText = "";
    
    if (startFromConcourse && startFromConcourse > 0) {
        promptText = `
        IMPORTANTE: O usuário já possui os dados até o concurso ${startFromConcourse}.
        Pesquise e liste APENAS os concursos da Lotofácil (Caixa Econômica Federal) que ocorreram DEPOIS do concurso ${startFromConcourse}.
        Liste do mais recente até o concurso ${startFromConcourse + 1}.
        Se não houver novos concursos após o ${startFromConcourse}, retorne uma lista vazia.
        `;
    } else {
        promptText = `
        Pesquise e liste os RESULTADOS OFICIAIS dos últimos 50 concursos da Lotofácil (Caixa Econômica Federal).
        Comece do concurso MAIS RECENTE para o mais antigo.
        `;
    }

    promptText += `
      Para cada concurso, forneça o número (concourse), a data e as 15 dezenas sorteadas.
      Seja EXATO com os números.
    `;

    const fetchHistory = async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: promptText,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                concourse: { type: Type.INTEGER },
                date: { type: Type.STRING },
                numbers: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                },
              },
              required: ["concourse", "date", "numbers"],
            },
          },
        },
      });
      return response;
    };

    const response = await withRetry(fetchHistory);

    if (response.text) {
      return JSON.parse(response.text) as HistoricalDraw[];
    }
    throw new Error("Histórico não retornado");
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};
