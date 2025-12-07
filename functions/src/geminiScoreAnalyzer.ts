import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScoreData } from './types/score';
import * as https from 'https';

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
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

/**
 * Gemini API를 사용하여 악보 이미지 분석
 */
export async function analyzeScoreImage(imageUrl: string, apiKey?: string): Promise<ScoreData> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(key);
  // 사용 가능한 모델: gemini-2.5-flash-lite (이미지 지원)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite'
  });

  // 이미지 다운로드
  const imageBuffer = await downloadImage(imageUrl);

  // 이미지 MIME 타입 감지
  const mimeType = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[0]?.slice(1) || 'png';
  const imageMimeType = `image/${mimeType === 'jpg' ? 'jpeg' : mimeType}`;

  const prompt = `이 악보 이미지를 정확하게 분석하여 다음 JSON 형식으로 출력해주세요.

{
  "title": "곡 제목",
  "composer": "작곡가 이름 (있는 경우, 없으면 생략)",
  "timeSignature": "박자 (예: "3/4", "4/4")",
  "keySignature": "조 (예: "C", "G", "D", "Am", "Em")",
  "staves": [
    {
      "clef": "treble",
      "measures": [
        {
          "notes": [
            {
              "pitch": "C4",
              "duration": "quarter",
              "rest": false
            }
          ],
          "chords": ["C"],
          "lyrics": ["주께", "와"]
        }
      ]
    }
  ]
}

중요 사항:
1. **박자표 (Time Signature) 분석**:
   - 보표 시작 부분의 박자표를 정확히 확인하세요 (예: 3/4, 4/4, 2/4 등)
   - 분자(위 숫자)는 한 마디의 박 수, 분모(아래 숫자)는 박의 단위입니다
   - 모든 보표에서 동일한 박자표를 사용하는지 확인하세요
   - 예: 3/4 = 한 마디에 4분음표 3개, 4/4 = 한 마디에 4분음표 4개

2. **조표 (Key Signature) 분석**:
   - 보표 시작 부분의 샵(#) 또는 플랫(b) 개수를 정확히 세세요
   - 조표가 없으면 (샵/플랫이 없으면) "C" (C major) 또는 "Am" (A minor)입니다
   - 샵 1개 = G 또는 Em, 샵 2개 = D 또는 Bm, 샵 3개 = A 또는 F#m
   - 플랫 1개 = F 또는 Dm, 플랫 2개 = Bb 또는 Gm, 플랫 3개 = Eb 또는 Cm
   - 코드 진행을 보고 major인지 minor인지 판단하세요 (첫 코드가 C면 C major, Am이면 A minor)

3. **음높이 (Pitch) 분석**:
   - pitch는 과학적 음높이 표기법을 사용하세요 (C4, D#4, E4, F4, G4, A4, B4, C5 등)
   - C4 = 중앙 C (Middle C)
   - 샵(#)은 "#"로, 플랫(b)은 "b"로 표기

4. **음표 길이 (Duration) 분석**:
   - duration은 다음 중 하나를 사용: "whole", "half", "quarter", "eighth", "sixteenth"
   - 각 마디의 총 duration이 박자표와 일치하는지 확인하세요

5. **코드 및 가사 매핑**:
   - 각 마디의 음표, 코드, 가사를 정확히 매핑하세요
   - 한국어 가사가 있으면 반드시 포함하세요
   - 코드 기호가 있으면 chords 배열에 포함하세요 (예: "C", "Am7", "Dm7", "G", "G/F")

6. **보표 구조**:
   - 여러 보표가 있으면 각각 staves 배열에 추가하세요
   - 쉼표는 rest: true로 표시하세요

7. **검증**:
   - 각 마디의 음표 duration 합이 박자표와 일치하는지 확인하세요
   - 조표와 실제 코드 진행이 일치하는지 확인하세요

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

    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonText = text;

    // ```json ... ``` 형식 제거
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                      text.match(/```\s*([\s\S]*?)\s*```/);

    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // { ... } 형식 직접 추출
      const braceMatch = text.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonText = braceMatch[0];
      }
    }

    // JSON 파싱
    const scoreData = JSON.parse(jsonText) as ScoreData;

    // 기본 검증
    if (!scoreData.title || !scoreData.timeSignature || !scoreData.keySignature || !scoreData.staves) {
      throw new Error('Invalid score data structure');
    }

    return scoreData;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`악보 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

