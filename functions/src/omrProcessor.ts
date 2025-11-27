import { logger } from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Cloud Run OMR 서비스 URL (환경 변수에서 가져오기)
// 배포 시: firebase functions:config:set omr.service_url="..." 또는
// Firebase Console에서 환경 변수 설정
const omrServiceUrl = defineString('OMR_SERVICE_URL', {
  default: '',
  description: 'Cloud Run OMR 서비스 URL',
});

const getOMRServiceUrl = (): string => {
  return omrServiceUrl.value();
};

// OMR 처리 함수
export const processOMR = onCall(async (request) => {
  const { imageUrl } = request.data;

  if (!imageUrl) {
    throw new Error('이미지 URL이 필요합니다.');
  }

  const serviceUrl = getOMRServiceUrl();
    logger.info('OMR 처리 시작', { imageUrl, omrServiceUrl: serviceUrl || '로컬 처리' });

    try {
      // Cloud Run 서비스가 설정되어 있으면 사용
      if (serviceUrl) {
        logger.info('Cloud Run OMR 서비스 호출', { url: serviceUrl });
        const musicXml = await callCloudRunOMR(imageUrl, serviceUrl);
        logger.info('OMR 처리 완료 (Cloud Run)', { musicXmlLength: musicXml.length });
        return { musicXml };
      }

      // Cloud Run이 없으면 로컬 처리 (플레이스홀더)
      logger.info('로컬 OMR 처리 (플레이스홀더)');
      const tempFilePath = await downloadImage(imageUrl);
      const musicXml = await processImageWithOMR(tempFilePath);

      // 임시 파일 정리
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      logger.info('OMR 처리 완료 (로컬)', { musicXmlLength: musicXml.length });
      return { musicXml };
    } catch (error) {
      logger.error('OMR 처리 오류', error);
      // 에러 발생 시 기본 MusicXML 반환
      const fallbackMusicXml = getFallbackMusicXML();
      logger.warn('폴백 MusicXML 반환', { error: String(error) });
      return { musicXml: fallbackMusicXml };
    }
  }
);

// Cloud Run OMR 서비스 호출
async function callCloudRunOMR(imageUrl: string, serviceUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(serviceUrl);
    const postData = JSON.stringify({ imageUrl });

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 300000, // 5분 타임아웃
    };

    const client = url.protocol === 'https:' ? https : http;

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`OMR 서비스 오류: ${res.statusCode} - ${data}`));
          return;
        }

        try {
          const response = JSON.parse(data);
          if (response.musicXml) {
            resolve(response.musicXml);
          } else {
            reject(new Error('OMR 서비스 응답에 musicXml이 없습니다.'));
          }
        } catch (error) {
          reject(new Error(`응답 파싱 오류: ${error}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`OMR 서비스 요청 오류: ${error}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('OMR 서비스 요청 타임아웃'));
    });

    req.write(postData);
    req.end();
  });
}

// 이미지 다운로드 함수
async function downloadImage(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir();
    const fileName = `omr_${Date.now()}.jpg`;
    const filePath = path.join(tempDir, fileName);
    const file = fs.createWriteStream(filePath);
    const url = new URL(imageUrl);

    const client = url.protocol === 'https:' ? https : http;

    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`이미지 다운로드 실패: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(filePath);
      });

      file.on('error', (err) => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// OMR 처리 함수 (플레이스홀더)
async function processImageWithOMR(imagePath: string): Promise<string> {
  // TODO: 실제 OMR 라이브러리 통합
  // 예: Audiveris, OpenOMR, 또는 외부 API 호출

  logger.info('OMR 처리 중 (플레이스홀더)', { imagePath });

  // 기본 MusicXML 반환 (실제로는 OMR 결과 사용)
  return getFallbackMusicXML();
}

// 폴백 MusicXML 생성
function getFallbackMusicXML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
}
