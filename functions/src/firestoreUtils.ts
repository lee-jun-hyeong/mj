import * as admin from 'firebase-admin';
import { ScoreData } from './types/score';

export async function updateScoreStatus(
  db: admin.firestore.Firestore,
  scoreId: string,
  status: 'uploaded' | 'processing' | 'completed' | 'error',
  scoreData?: ScoreData,
  errorMessage?: string
): Promise<void> {
  const docRef = db.collection('scores').doc(scoreId);
  const updateData: any = {
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (scoreData) {
    updateData.scoreData = scoreData;
    updateData.originalKey = scoreData.keySignature;
  }

  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }

  await docRef.update(updateData);
}

