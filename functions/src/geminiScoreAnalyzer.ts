import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScoreData, NoteData, MeasureData } from './types/score';
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
  // 사용 가능한 모델: gemini-2.5-pro (이미지 지원, 더 정확한 분석)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro'
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
          "startX": 0.0,
          "notes": [
            {
              "pitch": "C4",
              "duration": "quarter",
              "rest": false,
              "beat": 0
            },
            {
              "pitch": "E4",
              "duration": "quarter",
              "rest": false,
              "beat": 1
            }
          ],
          "chords": ["C", "Am"],
          "chordPositions": [0, 2],
          "lyrics": ["주", "께", "와"],
          "lyricPositions": [0, 1, 2]
        },
        {
          "startX": 0.25,
          "notes": [...]
        }
      ]
    }
  ]
}

중요 사항:
1. **박자표 (Time Signature) 분석** (매우 중요, 반드시 정확히 확인):
   - 보표 시작 부분의 박자표를 **매우 정확히** 확인하세요 (예: 3/4, 4/4, 2/4, 6/8 등)
   - **박자표는 보표의 시작 부분, 조표 바로 다음에 있습니다**
   - 분자(위 숫자)는 한 마디의 박 수, 분모(아래 숫자)는 박의 단위입니다
   - **3/4와 4/4를 혼동하지 마세요**: 3/4는 위에 3, 아래에 4가 있고, 4/4는 위에 4, 아래에 4가 있습니다
   - 모든 보표에서 동일한 박자표를 사용하는지 확인하세요
   - 예: 3/4 = 한 마디에 4분음표 3개, 4/4 = 한 마디에 4분음표 4개
   - **박자표를 확인할 때 숫자를 정확히 읽으세요. 3과 4를 혼동하지 마세요**

2. **조표 (Key Signature) 분석**:
   - 보표 시작 부분의 샵(#) 또는 플랫(b) 개수를 정확히 세세요
   - 조표가 없으면 (샵/플랫이 없으면) "C" (C major) 또는 "Am" (A minor)입니다
   - 샵 1개 = G 또는 Em, 샵 2개 = D 또는 Bm, 샵 3개 = A 또는 F#m
   - 플랫 1개 = F 또는 Dm, 플랫 2개 = Bb 또는 Gm, 플랫 3개 = Eb 또는 Cm
   - 코드 진행을 보고 major인지 minor인지 판단하세요 (첫 코드가 C면 C major, Am이면 A minor)

3. **음높이 (Pitch) 분석** (매우 중요):
   - pitch는 반드시 과학적 음높이 표기법만 사용하세요 (C4, D#4, E4, F4, G4, A4, B4, C5 등)
   - C4 = 중앙 C (Middle C)
   - 샵(#)은 "#"로, 플랫(b)은 "b"로 표기
   - **절대 코드 기호를 pitch에 넣지 마세요**: "F#m7", "Am", "C" 같은 코드 기호는 pitch가 아닙니다
   - 코드 기호는 chords 배열에만 넣고, pitch는 실제 음높이만 사용하세요
   - 예: 코드가 "F#m7"이고 실제 음이 F#4라면 → pitch: "F#4", chords: ["F#m7"]

4. **음표 길이 (Duration) 및 위치 (Beat) 분석** (매우 중요):
   - duration은 다음 중 하나를 사용: "whole", "half", "quarter", "eighth", "sixteenth"
   - 각 마디의 총 duration이 박자표와 일치하는지 확인하세요
   - **beat 필드**: 각 음표가 마디 내에서 어느 위치에 있는지 표시 (0부터 시작)
   - beat는 quarter note를 기준으로 계산: quarter = 1 beat, half = 2 beats, whole = 4 beats, eighth = 0.5 beats
   - 예: 4/4 박자에서 첫 번째 quarter note는 beat: 0, 두 번째는 beat: 1, 세 번째는 beat: 2, 네 번째는 beat: 3
   - 예: 4/4 박자에서 첫 번째 eighth note는 beat: 0, 두 번째는 beat: 0.5, 세 번째는 beat: 1, 네 번째는 beat: 1.5
   - **반드시 각 음표의 beat 위치를 정확히 계산하여 제공하세요**

5. **코드 및 가사 매핑** (매우 중요):
   - 각 마디의 음표, 코드, 가사를 정확히 매핑하세요
   - 한국어 가사가 있으면 반드시 포함하세요
   - 코드 기호가 있으면 chords 배열에 포함하세요 (예: "C", "Am7", "Dm7", "G", "G/F")
   - **chordPositions 배열**: 각 코드가 어떤 beat에 위치하는지 명시 (chords 배열과 인덱스 매칭)
   - **lyricPositions 배열**: 각 가사가 어떤 beat에 위치하는지 명시 (lyrics 배열과 인덱스 매칭)
   - 예: chords: ["C", "Am"], chordPositions: [0, 2] → C는 beat 0에, Am은 beat 2에
   - 예: lyrics: ["주", "께"], lyricPositions: [0, 1] → "주"는 beat 0에, "께"는 beat 1에
   - 코드나 가사가 없는 beat는 배열에서 생략하세요

6. **보표 구조** (매우 중요):
   - **모든 보표를 빠짐없이 포함하세요**: 이미지에 보이는 모든 보표를 staves 배열에 추가하세요
   - 보표 수를 정확히 세세요: 각 보표는 보표선(5개의 가로선)으로 구분됩니다
   - 여러 보표가 있으면 각각 staves 배열에 추가하세요
   - 쉼표는 rest: true로 표시하세요
   - **보표를 건너뛰지 마세요**: 모든 보표를 순서대로 포함하세요

8. **검증** (반드시 수행, 매우 중요):
   - **박자표를 다시 한 번 확인하세요**: 3/4인지 4/4인지 정확히 확인하세요
   - **각 마디의 음표 duration 합이 박자표와 정확히 일치해야 합니다**
   - 예: 3/4 박자이면 각 마디의 duration 합이 정확히 3 beats가 되어야 합니다 (quarter=1, half=2, eighth=0.5, sixteenth=0.25)
   - 예: 4/4 박자이면 각 마디의 duration 합이 정확히 4 beats가 되어야 합니다 (quarter=1, half=2, whole=4, eighth=0.5, sixteenth=0.25)
   - 마디의 beats가 부족하면 다음 마디의 음표가 잘못 분석된 것일 수 있습니다
   - 마디의 beats가 초과하면 음표가 잘못 분할되었거나 중복된 것일 수 있습니다
   - **각 마디를 분석한 후 반드시 duration 합을 계산하여 박자표와 일치하는지 확인하세요**
   - **보표 수를 확인하세요**: 모든 보표가 staves 배열에 포함되었는지 확인하세요
   - 조표와 실제 코드 진행이 일치하는지 확인하세요
   - 모든 pitch가 유효한 형식인지 확인하세요 (A-G + #/b + 숫자만 허용)
   - 코드 기호가 pitch 필드에 들어가지 않았는지 확인하세요

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

