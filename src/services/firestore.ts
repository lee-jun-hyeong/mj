import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Score } from '../types/score';
import { Conti } from '../types/conti';

// Score 관련 함수
export async function createScore(score: Omit<Score, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'scores'), {
    ...score,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getScore(scoreId: string): Promise<Score | null> {
  const docRef = doc(db, 'scores', scoreId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as Score;
}

export async function getUserScores(userId: string): Promise<Score[]> {
  const q = query(
    collection(db, 'scores'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as Score[];
}

export async function updateScore(scoreId: string, updates: Partial<Score>): Promise<void> {
  const docRef = doc(db, 'scores', scoreId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteScore(scoreId: string): Promise<void> {
  const docRef = doc(db, 'scores', scoreId);
  await deleteDoc(docRef);
}

// Conti 관련 함수
export async function createConti(conti: Omit<Conti, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'contis'), {
    ...conti,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getConti(contiId: string): Promise<Conti | null> {
  const docRef = doc(db, 'contis', contiId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as Conti;
}

export async function getUserContis(userId: string): Promise<Conti[]> {
  const q = query(
    collection(db, 'contis'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as Conti[];
}

export async function updateConti(contiId: string, updates: Partial<Conti>): Promise<void> {
  const docRef = doc(db, 'contis', contiId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteConti(contiId: string): Promise<void> {
  const docRef = doc(db, 'contis', contiId);
  await deleteDoc(docRef);
}

