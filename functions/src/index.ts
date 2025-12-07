import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { analyzeScoreImage } from './geminiScoreAnalyzer';
import { correctWithAI } from './aiCorrector';
import { parseMusicXml } from './musicXmlParser';
import { processWithAudiveris, downloadImageToTemp } from './audiverisProcessor';
import { processWithAudiverisCloudRun } from './audiverisCloudRun';
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
      memory: '2GiB',
      timeoutSeconds: 540,
      cpu: 2,
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

      let scoreData;

      // Audiveris 사용 여부 확인 (환경 변수로 제어, 기본값: true)
      const useAudiveris = process.env.USE_AUDIVERIS !== 'false';

      if (useAudiveris) {
        try {
          // Audiveris + AI 하이브리드 방식
          console.log('Using Audiveris + AI hybrid approach');

          // Cloud Run URL 확인 (환경 변수 또는 기본값)
          const cloudRunUrl = process.env.AUDIVERIS_CLOUD_RUN_URL || 'https://audiveris-service-51418627624.us-central1.run.app';

          // Cloud Run 서비스를 통해 Audiveris 실행
          console.log(`Using Cloud Run service: ${cloudRunUrl}`);
          const musicXmlContent = await processWithAudiverisCloudRun(imageUrl, cloudRunUrl);
          console.log('Audiveris Cloud Run processing completed, MusicXML length:', musicXmlContent.length);

          // MusicXML 파싱
          const audiverisResult = await parseMusicXml(musicXmlContent);
          console.log('MusicXML parsed successfully:', {
            title: audiverisResult.title,
            timeSignature: audiverisResult.timeSignature,
            keySignature: audiverisResult.keySignature,
            stavesCount: audiverisResult.staves.length
          });

          // AI로 보정
          console.log('Starting AI correction...');
          scoreData = await correctWithAI(audiverisResult, imageUrl, geminiApiKey.value());
          console.log('AI correction completed');
        } catch (audiverisError) {
          console.error('Audiveris processing failed, falling back to AI-only:', audiverisError);
          console.error('Error details:', audiverisError instanceof Error ? audiverisError.message : String(audiverisError));
          // Audiveris 실패 시 AI만 사용
          scoreData = await analyzeScoreImage(imageUrl, geminiApiKey.value());
        }
      } else {
        // AI만 사용 (기존 방식)
        console.log('Using AI-only approach (USE_AUDIVERIS=false)');
        scoreData = await analyzeScoreImage(imageUrl, geminiApiKey.value());
      }

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

