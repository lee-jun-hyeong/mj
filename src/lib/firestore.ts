import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  Timestamp,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ScoreDocument, ScoreData } from '../types/score';

const SCORES_COLLECTION = 'scores';

export async function createScoreDocument(imageUrl: string, filePath?: string): Promise<string> {
  const docData: any = {
    imageUrl,
    status: 'uploaded',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  // 파일 경로가 있으면 저장 (Functions에서 문서를 찾기 위해)
  if (filePath) {
    docData.filePath = filePath;
  }

  const docRef = await addDoc(collection(db, SCORES_COLLECTION), docData);
  return docRef.id;
}

export async function updateScoreStatus(
  scoreId: string,
  status: ScoreDocument['status'],
  scoreData?: ScoreData,
  errorMessage?: string
): Promise<void> {
  const docRef = doc(db, SCORES_COLLECTION, scoreId);
  const updateData: any = {
    status,
    updatedAt: Timestamp.now()
  };

  if (scoreData) {
    updateData.scoreData = scoreData;
    updateData.originalKey = scoreData.keySignature;
  }

  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }

  await updateDoc(docRef, updateData);
}

export async function getScore(scoreId: string): Promise<ScoreDocument | null> {
  const docRef = doc(db, SCORES_COLLECTION, scoreId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date()
  } as ScoreDocument;
}

export function subscribeToScore(
  scoreId: string,
  callback: (score: ScoreDocument | null) => void,
  onError?: (error: Error) => void
): () => void {
  const docRef = doc(db, SCORES_COLLECTION, scoreId);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }

      const data = docSnap.data();
      callback({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as ScoreDocument);
    },
    (error) => {
      console.error('Firestore snapshot error:', error);
      onError?.(new Error(`Firestore 연결 오류: ${error.message}`));
    }
  );
}

/**
 * 모든 악보 목록 가져오기 (최신순)
 */
export async function getAllScores(maxResults: number = 50): Promise<ScoreDocument[]> {
  const scoresRef = collection(db, SCORES_COLLECTION);
  const q = query(scoresRef, orderBy('createdAt', 'desc'), limit(maxResults));

  const snapshot = await getDocs(q);

  const scores: ScoreDocument[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    scores.push({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as ScoreDocument);
  });

  return scores;
}

/**
 * 악보 목록 실시간 구독
 */
export function subscribeToScores(
  callback: (scores: ScoreDocument[]) => void,
  onError?: (error: Error) => void,
  maxResults: number = 50
): () => void {
  const scoresRef = collection(db, SCORES_COLLECTION);
  const q = query(scoresRef, orderBy('createdAt', 'desc'), limit(maxResults));

  return onSnapshot(
    q,
    (snapshot) => {
      const scores: ScoreDocument[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        scores.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as ScoreDocument);
      });
      callback(scores);
    },
    (error) => {
      console.error('Firestore snapshot error:', error);
      onError?.(new Error(`Firestore 연결 오류: ${error.message}`));
    }
  );
}

