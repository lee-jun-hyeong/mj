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
    const result = xml2js(musicXml, { compact: true, ignoreComment: true }) as ElementCompact;

    // MusicXML 구조 파싱
    const scorePartwise = (result as any)['score-partwise'] || (result as any)['score-timewise'];
    if (!scorePartwise) {
      throw new Error('유효하지 않은 MusicXML 형식입니다.');
    }

    const part = scorePartwise.part;
    if (!part) {
      return [];
    }

    const measures = Array.isArray(part.measure) ? part.measure : [part.measure];
    const parsedMeasures: ParsedMeasure[] = [];

    measures.forEach((measure: any) => {
      const parsedMeasure: ParsedMeasure = { notes: [] };

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
    });

    return parsedMeasures;
  } catch (error) {
    console.error('MusicXML 파싱 오류:', error);
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

