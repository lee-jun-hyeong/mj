import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export async function processOMR(imageUrl: string): Promise<string> {
  const processOMRFunction = httpsCallable(functions, 'processOMR');

  try {
    const result = await processOMRFunction({ imageUrl });
    const data = result.data as { musicXml: string };
    return data.musicXml;
  } catch (error) {
    console.error('OMR 처리 오류:', error);
    throw error;
  }
}

