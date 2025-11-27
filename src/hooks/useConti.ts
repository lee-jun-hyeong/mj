import { useState, useEffect } from 'react';
import { Conti } from '../types/conti';
import { getUserContis, getConti, createConti, updateConti, deleteConti } from '../services/firestore';

export function useConti(contiId?: string) {
  const [conti, setConti] = useState<Conti | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contiId) {
      setLoading(false);
      return;
    }

    const loadConti = async () => {
      try {
        setLoading(true);
        const contiData = await getConti(contiId);
        setConti(contiData);
        setError(null);
      } catch (err) {
        console.error('콘티 로드 오류:', err);
        setError('콘티를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadConti();
  }, [contiId]);

  return { conti, loading, error };
}

export function useContis(userId?: string) {
  const [contis, setContis] = useState<Conti[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadContis = async () => {
      try {
        setLoading(true);
        const contisData = await getUserContis(userId);
        setContis(contisData);
        setError(null);
      } catch (err) {
        console.error('콘티 목록 로드 오류:', err);
        setError('콘티 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadContis();
  }, [userId]);

  const refetch = async () => {
    if (!userId) return;
    try {
      const contisData = await getUserContis(userId);
      setContis(contisData);
    } catch (err) {
      console.error('콘티 목록 재로드 오류:', err);
    }
  };

  return { contis, loading, error, refetch };
}

export function useContiActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (conti: Omit<Conti, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      const id = await createConti(conti);
      return id;
    } catch (err) {
      console.error('콘티 생성 오류:', err);
      setError('콘티 생성 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const update = async (contiId: string, updates: Partial<Conti>) => {
    try {
      setLoading(true);
      setError(null);
      await updateConti(contiId, updates);
    } catch (err) {
      console.error('콘티 업데이트 오류:', err);
      setError('콘티 업데이트 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (contiId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteConti(contiId);
    } catch (err) {
      console.error('콘티 삭제 오류:', err);
      setError('콘티 삭제 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, remove, loading, error };
}

