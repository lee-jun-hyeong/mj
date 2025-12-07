import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScoreData } from './types/score';
import * as https from 'https';

/**
 * Audiveris 결과를 AI로 보정
 */
export async function correctWithAI(
  audiverisResult: ScoreData,
  imageUrl: string,
  apiKey?: string
): Promise<ScoreData> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro'
  });

  // 이미지 다운로드
  const imageBuffer = await downloadImage(imageUrl);

  // 이미지 MIME 타입 감지
  const mimeType = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[0]?.slice(1) || 'png';
  const imageMimeType = `image/${mimeType === 'jpg' ? 'jpeg' : mimeType}`;

  // Audiveris 결과를 JSON 문자열로 변환
  const audiverisJson = JSON.stringify(audiverisResult, null, 2);

  const prompt = `이 악보 이미지를 분석하고, 제공된 Audiveris 분석 결과를 보정해주세요.

**Audiveris 분석 결과:**
\`\`\`json
${audiverisJson}
\`\`\`

**보정 작업:**
1. **Beat 위치 정확도 향상**: 각 음표의 beat 위치를 이미지에서 정확히 확인하여 보정
2. **코드/가사 매핑 정확도 향상**: 코드와 가사가 어떤 beat에 위치하는지 정확히 매핑
3. **박자표 검증**: Audiveris가 분석한 박자표가 정확한지 확인하고 수정
4. **조표 검증**: Audiveris가 분석한 조표가 정확한지 확인하고 수정
5. **음표 위치 정확도**: 각 음표가 마디 내에서 정확한 위치에 있는지 확인

**출력 형식:**
보정된 결과를 다음 JSON 형식으로 출력하세요:

\`\`\`json
{
  "title": "곡 제목",
  "composer": "작곡가",
  "timeSignature": "박자 (예: "3/4", "4/4")",
  "keySignature": "조 (예: "C", "G", "Am")",
  "staves": [
    {
      "clef": "treble",
      "measures": [
        {
          "notes": [
            {
              "pitch": "C4",
              "duration": "quarter",
              "rest": false,
              "beat": 0
            }
          ],
          "chords": ["C"],
          "chordPositions": [0],
          "lyrics": ["주"],
          "lyricPositions": [0]
        }
      ]
    }
  ]
}
\`\`\`

**중요 사항:**
- Audiveris 결과를 기본으로 사용하되, 이미지에서 확인한 정확한 정보로 보정
- 각 음표의 beat 위치를 정확히 계산 (0부터 시작)
- 코드와 가사가 어떤 beat에 위치하는지 정확히 매핑
- 박자표와 조표를 이미지에서 직접 확인하여 정확히 보정

JSON만 출력하고 다른 설명은 포함하지 마세요.`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: imageMimeType,
          data: imageBuffer.toString('base64')
        }
      }
    ]);

    const response = result.response;
    const text = response.text();

    // JSON 추출
    let jsonText = text;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                      text.match(/```\s*([\s\S]*?)\s*```/);

    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      const braceMatch = text.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonText = braceMatch[0];
      }
    }

    // JSON 파싱
    const correctedData = JSON.parse(jsonText) as ScoreData;

    // 기본 검증
    if (!correctedData.title || !correctedData.timeSignature || !correctedData.keySignature || !correctedData.staves) {
      throw new Error('Invalid corrected score data structure');
    }

    return correctedData;
  } catch (error) {
    console.error('AI correction error:', error);
    throw new Error(`악보 보정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 이미지 URL에서 이미지 데이터를 다운로드
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

