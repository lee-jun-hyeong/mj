import { initializeApp } from 'firebase/app';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase 설정 - michael-jesus 프로젝트
// 환경 변수가 있으면 우선 사용, 없으면 기본값 사용
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDU068ZCFHfN_coIE11m_gcy3yeCPykeio",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "michael-jesus.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "michael-jesus",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "michael-jesus.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "51418627624",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:51418627624:web:484630da85570b699d3f1d"
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const db = getFirestore(app);

// 개발 모드에서 Emulator 연결
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('🔥 Firebase Emulators connected');
  } catch (error) {
    console.warn('Emulator connection error (may already be connected):', error);
  }
}

export default app;
