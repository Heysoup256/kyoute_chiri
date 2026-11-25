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

const EMPTY_STATS: QuizStatsState = {
  countryStats: {},
  featureStats: {},
  climateQuiz: { total: 0, correct: 0, bestStreak: 0 },
  koppenBestScores: {},
};

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

/**
 * 白地図演習の現在のセッション内正誤状態（ブラウザ永続保存は行わない）
 */
export function useQuizStats() {
  const [stats, setStats] = useState<QuizStatsState>(EMPTY_STATS);

  const recordCountryResult = useCallback((iso3: string, isCorrect: boolean) => {
    setStats((prev) => ({
      ...prev,
      countryStats: bumpCounter(prev.countryStats, iso3, isCorrect),
    }));
  }, []);

  const recordFeatureResult = useCallback((featureId: string, isCorrect: boolean) => {
    setStats((prev) => ({
      ...prev,
      featureStats: bumpCounter(prev.featureStats, featureId, isCorrect),
    }));
  }, []);

  const recordClimateQuizResult = useCallback((isCorrect: boolean, currentStreak: number) => {
    setStats((prev) => ({
      ...prev,
      climateQuiz: {
        total: prev.climateQuiz.total + 1,
        correct: prev.climateQuiz.correct + (isCorrect ? 1 : 0),
        bestStreak: Math.max(prev.climateQuiz.bestStreak, currentStreak),
      },
    }));
  }, []);

  const recordKoppenScore = useCallback(
    (key: string, exactPct: number, groupPct: number, rank: 'S' | 'A' | 'B' | 'C' | 'D') => {
      setStats((prev) => {
        const existing = prev.koppenBestScores[key];
        if (existing && existing.exactPct > exactPct) {
          return prev;
        }
        return {
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
