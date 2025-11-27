import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface SharedLink {
  id: string;
  contiId: string;
  shareToken: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export async function createShareLink(contiId: string): Promise<{ shareId: string; shareToken: string }> {
  // 고유한 토큰 생성
  const shareToken = generateShareToken();

  const docRef = await addDoc(collection(db, 'shared'), {
    contiId,
    shareToken,
    isActive: true,
    createdAt: Timestamp.now(),
  });

  return { shareId: docRef.id, shareToken };
}

export async function getShareLinkByToken(shareToken: string): Promise<SharedLink | null> {
  const q = query(
    collection(db, 'shared'),
    where('shareToken', '==', shareToken),
    where('isActive', '==', true)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt.toDate(),
    expiresAt: data.expiresAt?.toDate(),
  } as SharedLink;
}

export async function deactivateShareLink(shareId: string): Promise<void> {
  const docRef = doc(db, 'shared', shareId);
  await updateDoc(docRef, {
    isActive: false,
  });
}

function generateShareToken(): string {
  // 간단한 토큰 생성 (실제로는 더 안전한 방법 사용 권장)
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
