export interface LottoGame {
  numbers: number[];
  reasoning: string;
  probabilityScore: number;
  tags: string[];
}

export interface FrequentCombination {
  numbers: number[];
  count: number;
  type: string; // e.g., "Par", "Trio", "Quadra"
  description: string;
}

export interface GeneratorResponse {
  games: LottoGame[];
  frequentCombinations: FrequentCombination[];
}

export interface HistoricalDraw {
  concourse: number;
  date: string;
  numbers: number[];
}

export interface SavedGame {
  id: number;
  created_at: string;
  numbers: number[];
  reasoning: string;
  score: number;
  tags?: string[];
}

export interface AnalysisData {
  hotNumbers: { number: number; frequency: string }[];
  coldNumbers: number[];
  patterns: {
    oddEven: string;
    repeats: number;
    primes: number[];
    sumRange: string;
  };
  recentStreaks: number[];
}

export enum AppView {
  GENERATOR = 'GENERATOR',
  DASHBOARD = 'DASHBOARD',
  CHECKER = 'CHECKER',
  SAVED = 'SAVED',
}