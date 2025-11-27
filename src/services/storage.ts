import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export async function uploadScoreImage(
  userId: string,
  scoreId: string,
  file: File
): Promise<string> {
  const storageRef = ref(
    storage,
    `scores/${userId}/${scoreId}/original.${file.name.split('.').pop()}`
  );

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

