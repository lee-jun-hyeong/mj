import { ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface UploadProgress {
  progress: number;
  state: 'running' | 'paused' | 'success' | 'error';
}

export interface UploadResult {
  url: string;
  filePath: string;
}

export async function uploadImage(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const storageRef = ref(storage, `scores/${Date.now()}_${file.name}`);
  const filePath = storageRef.fullPath;
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({
          progress,
          state: snapshot.state as 'running' | 'paused' | 'success' | 'error'
        });
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url: downloadURL, filePath });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

