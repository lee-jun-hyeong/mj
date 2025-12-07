import { ScoreData, StaffData, MeasureData, NoteData } from './types/score';
import * as xml2js from 'xml2js';

/**
 * MusicXML을 현재 JSON 형식으로 변환
 */
export async function parseMusicXml(musicXmlContent: string): Promise<ScoreData> {
  const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
  const result = await parser.parseStringPromise(musicXmlContent);

  // MusicXML 구조 파싱
  const scorePartwise = result['score-partwise'] || result['score-timewise'];
  if (!scorePartwise) {
    throw new Error('Invalid MusicXML format');
  }

  // 제목 추출
  const work = scorePartwise.work;
  const title = work?.['work-title'] || scorePartwise['movement-title'] || 'Untitled';

  // 작곡가 추출
  const identification = scorePartwise.identification;
  const creator = identification?.creator;
  const composer = Array.isArray(creator)
    ? creator.find((c: any) => c.type === 'composer')?._
    : creator?._;

  // 파트 목록 추출
  const partList = scorePartwise['part-list'];
  const parts = scorePartwise.part || [];
  const partArray = Array.isArray(parts) ? parts : [parts];

  // 첫 번째 파트에서 박자표와 조표 추출
  const firstPart = partArray[0];
  const firstMeasure = Array.isArray(firstPart.measure) ? firstPart.measure[0] : firstPart.measure;

  // 박자표 추출
  const time = firstMeasure?.time || firstMeasure?.attributes?.['time'];
  const beats = (typeof time === 'object' && time?.beats) ? time.beats : (time?.beats || '4');
  const beatType = (typeof time === 'object' && time?.['beat-type']) ? time['beat-type'] : (time?.['beat-type'] || '4');
  const timeSignature = `${beats}/${beatType}`;

  // 조표 추출
  const key = firstMeasure?.key || firstMeasure?.attributes?.['key'];
  const fifths = (typeof key === 'object' && key?.fifths) ? key.fifths : (key?.fifths || '0');
  const mode = (typeof key === 'object' && key?.mode) ? key.mode : (key?.mode || 'major');
  const keySignature = convertFifthsToKey(parseInt(String(fifths)), String(mode));

  // 보표 데이터 생성
  const staves: StaffData[] = [];

  partArray.forEach((part: any, partIndex: number) => {
    const measures = Array.isArray(part.measure) ? part.measure : [part.measure];
    const staffMeasures: MeasureData[] = [];

    measures.forEach((measure: any, measureIndex: number) => {
      const notes: NoteData[] = [];
      const chords: string[] = [];
      const lyrics: string[] = [];
      const chordPositions: number[] = [];
      const lyricPositions: number[] = [];

      // 음표 추출
      const measureNotes = Array.isArray(measure.note) ? measure.note : (measure.note ? [measure.note] : []);
      let currentBeat = 0;
      const beatValue = parseInt(beatType);

      measureNotes.forEach((note: any, noteIndex: number) => {
        const duration = parseInt(String(note.duration || '1'));
        const durationType = getDurationType(duration, beatValue);
        const beatIncrement = duration / beatValue;

        // 쉼표 처리
        if (note.rest || note.pitch === undefined) {
          notes.push({
            pitch: '',
            duration: durationType,
            rest: true,
            beat: currentBeat
          });
          currentBeat += beatIncrement;
        } else {
          // 실제 음표
          const pitch = note.pitch;
          const step = (typeof pitch === 'object' && pitch?.step) ? pitch.step : (pitch?.step || 'C');
          const octave = (typeof pitch === 'object' && pitch?.octave) ? pitch.octave : (pitch?.octave || '4');
          const alter = (typeof pitch === 'object' && pitch?.alter) ? pitch.alter : (pitch?.alter || '0');
          const alterNum = parseInt(String(alter));
          const accidental = alterNum > 0 ? '#' : alterNum < 0 ? 'b' : '';
          const pitchString = `${step}${accidental}${octave}`;

          notes.push({
            pitch: pitchString,
            duration: durationType,
            rest: false,
            beat: currentBeat
          });

          // 코드 추출 (harmony 요소)
          const harmony = note.harmony || measure.harmony;
          if (harmony) {
            const harmonyArray = Array.isArray(harmony) ? harmony : [harmony];
            harmonyArray.forEach((h: any) => {
              const root = h.root;
              const rootStep = (typeof root === 'object' && root?.rootStep) ? root.rootStep : (root?.rootStep || 'C');
              const rootAlter = (typeof root === 'object' && root?.rootAlter) ? root.rootAlter : (root?.rootAlter || '0');
              const kind = h.kind || '';
              const alterNum = parseInt(String(rootAlter));
              const accidental = alterNum > 0 ? '#' : alterNum < 0 ? 'b' : '';
              const chordName = `${rootStep}${accidental}${kind}`;
              chords.push(chordName);
              chordPositions.push(currentBeat);
            });
          }

          // 가사 추출
          const lyric = note.lyric;
          if (lyric) {
            const lyricArray = Array.isArray(lyric) ? lyric : [lyric];
            lyricArray.forEach((l: any) => {
              const text = (typeof l === 'object' && l.text) ? l.text : (l.text || String(l));
              if (text && text.trim()) {
                lyrics.push(text.trim());
                lyricPositions.push(currentBeat);
              }
            });
          }

          currentBeat += beatIncrement;
        }
      });

      staffMeasures.push({
        notes,
        chords: chords.length > 0 ? chords : undefined,
        lyrics: lyrics.length > 0 ? lyrics : undefined,
        chordPositions: chordPositions.length > 0 ? chordPositions : undefined,
        lyricPositions: lyricPositions.length > 0 ? lyricPositions : undefined
      });
    });

    // 보표 타입 결정 (기본값: treble)
    const firstMeasureOfPart = Array.isArray(part.measure) ? part.measure[0] : part.measure;
    const clef = firstMeasureOfPart?.clef || firstMeasureOfPart?.attributes?.['clef'];
    const clefSign = (typeof clef === 'object' && clef?.sign) ? clef.sign : (clef?.sign || 'G');
    const staffClef = clefSign === 'G' || clefSign === 'g' ? 'treble' : 'bass';

    staves.push({
      clef: staffClef,
      measures: staffMeasures
    });
  });

  return {
    title,
    composer,
    timeSignature,
    keySignature,
    staves
  };
}

/**
 * fifths 값을 조표로 변환
 */
function convertFifthsToKey(fifths: number, mode: string): string {
  const majorKeys: Record<number, string> = {
    0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#', 7: 'C#',
    [-1]: 'F', [-2]: 'Bb', [-3]: 'Eb', [-4]: 'Ab', [-5]: 'Db', [-6]: 'Gb', [-7]: 'Cb'
  };

  const minorKeys: Record<number, string> = {
    0: 'Am', 1: 'Em', 2: 'Bm', 3: 'F#m', 4: 'C#m', 5: 'G#m', 6: 'D#m', 7: 'A#m',
    [-1]: 'Dm', [-2]: 'Gm', [-3]: 'Cm', [-4]: 'Fm', [-5]: 'Bbm', [-6]: 'Ebm', [-7]: 'Abm'
  };

  if (mode === 'minor') {
    return minorKeys[fifths] || 'Am';
  }
  return majorKeys[fifths] || 'C';
}

/**
 * duration 값을 duration 타입으로 변환
 */
function getDurationType(duration: number, beatType: number): string {
  // duration은 divisions 단위이므로 beatType으로 나누어 beats로 변환
  const beats = duration / beatType;

  if (beats >= 4) return 'whole';
  if (beats >= 2) return 'half';
  if (beats >= 1) return 'quarter';
  if (beats >= 0.5) return 'eighth';
  return 'sixteenth';
}

