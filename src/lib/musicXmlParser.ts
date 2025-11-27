import { xml2js, ElementCompact } from 'xml-js';

export interface ParsedNote {
  pitch: string; // VexFlow 형식: 'c/4', 'd/4' 등
  duration: string; // VexFlow 형식: '4', '8', 'w' 등
  octave: number;
  step: string;
  alter?: number; // 샵/플랫
}

export interface ParsedMeasure {
  notes: ParsedNote[];
  timeSignature?: { beats: number; beatType: number };
  key?: { fifths: number };
  clef?: { sign: string; line: number };
}

export function parseMusicXML(musicXml: string): ParsedMeasure[] {
  try {
    console.log('MusicXML 파싱 시작, 길이:', musicXml.length);

    const result = xml2js(musicXml, { compact: true, ignoreComment: true }) as ElementCompact;
    console.log('XML 파싱 결과:', result);

    // MusicXML 구조 파싱
    const scorePartwise = (result as any)['score-partwise'] || (result as any)['score-timewise'];
    if (!scorePartwise) {
      console.error('score-partwise 또는 score-timewise를 찾을 수 없습니다. 결과:', result);
      throw new Error('유효하지 않은 MusicXML 형식입니다.');
    }

    console.log('scorePartwise:', scorePartwise);

    // part가 배열일 수도 있고 단일 객체일 수도 있음
    let part = scorePartwise.part;
    if (!part) {
      // part-list에서 part 찾기 시도
      if (scorePartwise['part-list'] && scorePartwise['part-list']['score-part']) {
        console.log('part-list에서 part 찾기 시도');
      }
      console.error('part를 찾을 수 없습니다. scorePartwise:', scorePartwise);
      return [];
    }

    // part가 배열인 경우 첫 번째 part 사용
    if (Array.isArray(part)) {
      part = part[0];
    }

    console.log('part:', part);

    const measures = part.measure;
    if (!measures) {
      console.error('measure를 찾을 수 없습니다. part:', part);
      return [];
    }

    const measureArray = Array.isArray(measures) ? measures : [measures];
    console.log('measures 개수:', measureArray.length);

    const parsedMeasures: ParsedMeasure[] = [];

    measureArray.forEach((measure: any, index: number) => {
      const parsedMeasure: ParsedMeasure = { notes: [] };
      console.log(`Measure ${index} 파싱:`, measure);

      // Attributes 파싱
      if (measure.attributes) {
        const attrs = measure.attributes;

        if (attrs.time) {
          parsedMeasure.timeSignature = {
            beats: parseInt(attrs.time.beats?._text || attrs.time.beats || '4'),
            beatType: parseInt(attrs.time['beat-type']?._text || attrs.time['beat-type'] || '4'),
          };
        }

        if (attrs.key) {
          parsedMeasure.key = {
            fifths: parseInt(attrs.key.fifths?._text || attrs.key.fifths || '0'),
          };
        }

        if (attrs.clef) {
          parsedMeasure.clef = {
            sign: attrs.clef.sign?._text || attrs.clef.sign || 'G',
            line: parseInt(attrs.clef.line?._text || attrs.clef.line || '2'),
          };
        }
      }

      // Notes 파싱
      const notes = measure.note;
      if (notes) {
        const noteArray = Array.isArray(notes) ? notes : [notes];
        console.log(`Measure ${index}의 notes 개수:`, noteArray.length);

        noteArray.forEach((note: any) => {
          if (note.rest) {
            // 쉼표는 건너뛰기
            return;
          }

          if (note.pitch) {
            const pitch = note.pitch;
            const step = pitch.step?._text || pitch.step || 'C';
            const octave = parseInt(pitch.octave?._text || pitch.octave || '4');
            const alter = pitch.alter ? parseInt(pitch.alter?._text || pitch.alter || '0') : 0;

            const duration = note.duration?._text || note.duration || '4';
            const type = note.type?._text || note.type || 'quarter';

            // VexFlow 형식으로 변환
            const vexPitch = convertToVexFlowPitch(step, octave, alter);
            const vexDuration = convertToVexFlowDuration(type, duration);

            parsedMeasure.notes.push({
              pitch: vexPitch,
              duration: vexDuration,
              octave,
              step,
              alter,
            });
          }
        });
      }

      parsedMeasures.push(parsedMeasure);
      console.log(`Measure ${index} 파싱 완료, notes 개수:`, parsedMeasure.notes.length);
    });

    console.log('전체 파싱 완료, measures 개수:', parsedMeasures.length);
    return parsedMeasures;
  } catch (error) {
    console.error('MusicXML 파싱 오류:', error);
    console.error('오류 상세:', error instanceof Error ? error.stack : String(error));
    return [];
  }
}

function convertToVexFlowPitch(step: string, octave: number, alter: number): string {
  const stepLower = step.toLowerCase();
  let pitch = stepLower;

  // 샵/플랫 처리
  if (alter === 1) {
    pitch = stepLower + '#';
  } else if (alter === -1) {
    pitch = stepLower + 'b';
  }

  return `${pitch}/${octave}`;
}

function convertToVexFlowDuration(type: string, duration: string): string {
  // MusicXML type을 VexFlow duration으로 변환
  const typeMap: { [key: string]: string } = {
    'whole': 'w',
    'half': 'h',
    'quarter': '4',
    'eighth': '8',
    '16th': '16',
    '32nd': '32',
  };

  return typeMap[type] || duration || '4';
}

