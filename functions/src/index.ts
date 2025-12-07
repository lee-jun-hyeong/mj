import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { analyzeScoreImage } from './geminiScoreAnalyzer';
import { updateScoreStatus } from './firestoreUtils';
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();

// Gemini API 키를 Secrets로 정의
const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Storage에 이미지가 업로드되면 트리거
export const processScoreImage = functions.storage
  .onObjectFinalized(
    {
      bucket: 'michael-jesus.firebasestorage.app',
      secrets: [geminiApiKey],
    },
    async (event) => {
      const object = event.data;
    const filePath = object.name || '';

    // scores/ 폴더의 이미지만 처리
    if (!filePath || !filePath.startsWith('scores/')) {
      console.log('File is not in scores/ folder, skipping');
      return;
    }

    // 이미지 파일만 처리
    const contentType = object.contentType;
    if (!contentType || !contentType.startsWith('image/')) {
      console.log('File is not an image, skipping');
      return;
    }

    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    // Firestore에서 파일 경로로 문서 찾기
    const db = admin.firestore();
    const scoresRef = db.collection('scores');

    // 방법 1: filePath로 직접 찾기
    let snapshot = await scoresRef
      .where('filePath', '==', filePath)
      .where('status', '==', 'uploaded')
      .limit(1)
      .get();

    // 방법 2: filePath가 없으면 최근 업로드된 문서 중에서 찾기 (한글 파일명 처리)
    if (snapshot.empty) {
      console.log(`No document found with filePath: ${filePath}, trying alternative method...`);

      // 최근 5분 이내에 생성된 uploaded 상태의 문서 찾기
      const fiveMinutesAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
      snapshot = await scoresRef
        .where('status', '==', 'uploaded')
        .where('createdAt', '>=', fiveMinutesAgo)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      // 파일 이름이 포함된 문서 찾기 (URL 인코딩된 경로와 비교)
      const fileName = filePath.split('/').pop() || '';
      let matchingDoc = null;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const docFilePath = data.filePath || '';
        const docFileName = docFilePath.split('/').pop() || '';

        // 파일 이름 비교 (인코딩 차이 고려)
        if (docFileName === fileName ||
            decodeURIComponent(docFileName) === decodeURIComponent(fileName) ||
            docFilePath.includes(fileName) ||
            filePath.includes(docFileName)) {
          matchingDoc = doc;
          break;
        }
      }

      if (matchingDoc) {
        snapshot = {
          empty: false,
          docs: [matchingDoc]
        } as any;
      }
    }

    if (snapshot.empty) {
      console.log(`No matching score document found for file: ${filePath}`);
      console.log(`File path details - name: ${filePath.split('/').pop()}, full path: ${filePath}`);
      return;
    }

    const scoreDoc = snapshot.docs[0];
    const scoreId = scoreDoc.id;
    const imageUrl = scoreDoc.data().imageUrl; // Firestore에 저장된 URL 사용

    try {
      // 상태를 processing으로 변경
      await updateScoreStatus(db, scoreId, 'processing');

      // Gemini API로 악보 분석 (Firestore에 저장된 imageUrl 사용)
      const scoreData = await analyzeScoreImage(imageUrl, geminiApiKey.value());

      // 상태를 completed로 변경하고 결과 저장
      await updateScoreStatus(db, scoreId, 'completed', scoreData);

      console.log(`Successfully processed score: ${scoreId}`);
    } catch (error) {
      console.error(`Error processing score ${scoreId}:`, error);

      // 상태를 error로 변경
      await updateScoreStatus(
        db,
        scoreId,
        'error',
        undefined,
        error instanceof Error ? error.message : '알 수 없는 오류'
      );
    }
  });

