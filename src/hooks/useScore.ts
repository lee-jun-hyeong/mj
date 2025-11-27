import { useState, useEffect } from 'react';
import { Score } from '../types/score';
import { getUserScores, getScore } from '../services/firestore';

export function useScore(scoreId?: string) {
  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scoreId) {
      setLoading(false);
      return;
    }

    const loadScore = async () => {
      try {
        setLoading(true);
        const scoreData = await getScore(scoreId);
        setScore(scoreData);
        setError(null);
      } catch (err) {
        console.error('악보 로드 오류:', err);
        setError('악보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadScore();
  }, [scoreId]);

  return { score, loading, error };
}

export function useScores(userId?: string) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadScores = async () => {
      try {
        setLoading(true);
        const scoresData = await getUserScores(userId);
        setScores(scoresData);
        setError(null);
      } catch (err) {
        console.error('악보 목록 로드 오류:', err);
        setError('악보 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadScores();
  }, [userId]);

  return { scores, loading, error, refetch: () => userId && getUserScores(userId).then(setScores) };
}

