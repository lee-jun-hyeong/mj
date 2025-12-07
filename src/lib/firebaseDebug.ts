// Firebase 연결 상태 확인 유틸리티
import { db, storage } from '../config/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { ref, listAll } from 'firebase/storage';

export async function checkFirebaseConnection(): Promise<{
  firestore: boolean;
  storage: boolean;
  error?: string;
}> {
  try {
    // Firestore 연결 테스트 - 실제 컬렉션에 접근 시도
    const firestoreTest = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);

      // scores 컬렉션이 있으면 사용, 없으면 빈 쿼리로 연결만 확인
      const testQuery = query(collection(db, 'scores'), limit(1));

      getDocs(testQuery)
        .then(() => {
          clearTimeout(timeout);
          resolve(true);
        })
        .catch((error) => {
          // 권한 오류나 네트워크 오류가 아닌 경우 (예: 컬렉션이 없는 경우)도 연결은 성공으로 간주
          if (error.code === 'permission-denied' || error.code === 'unavailable') {
            clearTimeout(timeout);
            resolve(false);
          } else {
            // 컬렉션이 없어도 연결은 성공으로 간주
            clearTimeout(timeout);
            resolve(true);
          }
        });
    });

    // Storage 연결 테스트 - 루트 경로 리스트 시도
    const storageTest = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);

      // 루트 경로에 접근하여 연결 확인
      const rootRef = ref(storage, '');

      listAll(rootRef)
        .then(() => {
          clearTimeout(timeout);
          resolve(true);
        })
        .catch((error) => {
          // 권한 오류는 연결 실패로 간주
          if (error.code === 'storage/unauthorized' || error.code === 'storage/unauthenticated') {
            clearTimeout(timeout);
            resolve(false);
          } else {
            // 다른 오류는 연결은 성공으로 간주 (예: 빈 버킷)
            clearTimeout(timeout);
            resolve(true);
          }
        });
    });

    return {
      firestore: firestoreTest,
      storage: storageTest
    };
  } catch (error) {
    return {
      firestore: false,
      storage: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

