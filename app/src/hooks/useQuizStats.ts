import { useCallback, useState } from 'react';

export interface AccuracyCounter {
  correct: number;
  wrong: number;
}

export interface KoppenBestRecord {
  exactPct: number;
  groupPct: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  updatedAt: string;
}

export interface QuizStatsState {
  countryStats: Record<string, AccuracyCounter>;
  featureStats: Record<string, AccuracyCounter>;
  climateQuiz: {
    total: number;
    correct: number;
    bestStreak: number;
  };
  koppenBestScores: Record<string, KoppenBestRecord>;
}

const STORAGE_KEY = 'kyoute_chiri_blank_stats_v1';

const EMPTY_STATS: QuizStatsState = {
  countryStats: {},
  featureStats: {},
  climateQuiz: { total: 0, correct: 0, bestStreak: 0 },
  koppenBestScores: {},
};

function loadInitialStats(): QuizStatsState {
  if (typeof window === 'undefined') return EMPTY_STATS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATS;
    const parsed = JSON.parse(raw) as Partial<QuizStatsState>;
    return {
      countryStats: parsed.countryStats ?? {},
      featureStats: parsed.featureStats ?? {},
      climateQuiz: {
        total: parsed.climateQuiz?.total ?? 0,
        correct: parsed.climateQuiz?.correct ?? 0,
        bestStreak: parsed.climateQuiz?.bestStreak ?? 0,
      },
      koppenBestScores: parsed.koppenBestScores ?? {},
    };
  } catch {
    return EMPTY_STATS;
  }
}

function saveStats(next: QuizStatsState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ストレージ容量超過・プライベートモード等では静かに継続
  }
}

function bumpCounter(
  map: Record<string, AccuracyCounter>,
  key: string,
  isCorrect: boolean,
): Record<string, AccuracyCounter> {
  const prev = map[key] ?? { correct: 0, wrong: 0 };
  return {
    ...map,
    [key]: {
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
    },
  };
}

export function useQuizStats() {
  const [stats, setStats] = useState<QuizStatsState>(loadInitialStats);

  const recordCountryResult = useCallback((iso3: string, isCorrect: boolean) => {
    setStats((prev) => {
      const next: QuizStatsState = {
        ...prev,
        countryStats: bumpCounter(prev.countryStats, iso3, isCorrect),
      };
      saveStats(next);
      return next;
    });
  }, []);

  const recordFeatureResult = useCallback((featureId: string, isCorrect: boolean) => {
    setStats((prev) => {
      const next: QuizStatsState = {
        ...prev,
        featureStats: bumpCounter(prev.featureStats, featureId, isCorrect),
      };
      saveStats(next);
      return next;
    });
  }, []);

  const recordClimateQuizResult = useCallback((isCorrect: boolean, currentStreak: number) => {
    setStats((prev) => {
      const next: QuizStatsState = {
        ...prev,
        climateQuiz: {
          total: prev.climateQuiz.total + 1,
          correct: prev.climateQuiz.correct + (isCorrect ? 1 : 0),
          bestStreak: Math.max(prev.climateQuiz.bestStreak, currentStreak),
        },
      };
      saveStats(next);
      return next;
    });
  }, []);

  const recordKoppenScore = useCallback(
    (key: string, exactPct: number, groupPct: number, rank: 'S' | 'A' | 'B' | 'C' | 'D') => {
      setStats((prev) => {
        const existing = prev.koppenBestScores[key];
        if (existing && existing.exactPct > exactPct) {
          return prev;
        }
        const next: QuizStatsState = {
          ...prev,
          koppenBestScores: {
            ...prev.koppenBestScores,
            [key]: {
              exactPct,
              groupPct,
              rank,
              updatedAt: new Date().toISOString().slice(0, 10),
            },
          },
        };
        saveStats(next);
        return next;
      });
    },
    [],
  );

  const getWeakCountryIso3s = useCallback((): string[] => {
    return Object.entries(stats.countryStats)
      .filter(([, v]) => v.wrong > 0 && v.wrong >= v.correct)
      .map(([iso]) => iso);
  }, [stats.countryStats]);

  const getWeakFeatureIds = useCallback((): string[] => {
    return Object.entries(stats.featureStats)
      .filter(([, v]) => v.wrong > 0 && v.wrong >= v.correct)
      .map(([fid]) => fid);
  }, [stats.featureStats]);

  const resetStats = useCallback(() => {
    saveStats(EMPTY_STATS);
    setStats(EMPTY_STATS);
  }, []);

  return {
    stats,
    recordCountryResult,
    recordFeatureResult,
    recordClimateQuizResult,
    recordKoppenScore,
    getWeakCountryIso3s,
    getWeakFeatureIds,
    resetStats,
  };
}
