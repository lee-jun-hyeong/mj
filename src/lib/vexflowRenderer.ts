import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow';
import { ScoreData, StaffData, MeasureData, NoteData } from '../types/score';

// VexFlow 음높이 매핑 (과학적 음높이 → VexFlow 형식)
const pitchToVexFlow = (pitch: string): string => {
  const match = pitch.match(/^([A-G])(#|b)?(\d+)$/);
  if (!match) {
    console.warn(`Invalid pitch format: ${pitch}, using C4`);
    return 'c/4';
  }

  const [, note, accidental, octave] = match;
  const noteLower = note.toLowerCase();
  const acc = accidental === '#' ? '#' : accidental === 'b' ? 'b' : '';

  return `${noteLower}${acc}/${octave}`;
};

// duration을 VexFlow 형식으로 변환
const durationToVexFlow = (duration: string): string => {
  const mapping: Record<string, string> = {
    'whole': 'w',
    'half': 'h',
    'quarter': 'q',
    'eighth': '8',
    'sixteenth': '16'
  };
  return mapping[duration] || 'q';
};

export function renderScore(canvas: HTMLCanvasElement, scoreData: ScoreData): void {
  const renderer = new Renderer(canvas, Renderer.Backends.CANVAS);
  const ctx = renderer.getContext();

  // 캔버스 크기 설정
  const width = Math.max(1200, canvas.parentElement?.clientWidth || 1200);
  let totalHeight = 100;

  // 높이 계산: 각 보표마다 충분한 공간 확보
  scoreData.staves.forEach((staff) => {
    const measureLines = Math.ceil(staff.measures.length / 4);
    totalHeight += measureLines * 200; // 각 줄당 200px
    totalHeight += 50; // 보표 간 간격
  });

  canvas.width = width;
  canvas.height = totalHeight;
  renderer.resize(width, totalHeight);

  ctx.setFont('Arial', 16, 'bold');

  let yPosition = 60;
  const staveWidth = width - 100;
  const staveSpacing = 250;

  // 제목 표시
  if (scoreData.title) {
    ctx.setFont('Arial', 24, 'bold');
    const titleWidth = ctx.measureText(scoreData.title).width;
    ctx.fillText(scoreData.title, (width - titleWidth) / 2, 40);
    ctx.setFont('Arial', 12);
  }

  scoreData.staves.forEach((staff: StaffData) => {
    const [numerator, denominator] = scoreData.timeSignature.split('/');
    const numBeats = parseInt(numerator);
    const beatValue = parseInt(denominator);

    const measuresPerLine = 4;
    const measureWidth = (staveWidth - 100) / measuresPerLine;
    let currentStave: Stave | null = null;
    let xPosition = 0;
    let lineNumber = 0;

    // 각 마디를 개별적으로 처리
    staff.measures.forEach((measure: MeasureData, measureIndex: number) => {
      // 새 줄 시작 시 보표 생성
      if (measureIndex % measuresPerLine === 0) {
        if (currentStave) {
          yPosition += 200; // 다음 줄로 이동
        }

        currentStave = new Stave(50, yPosition, staveWidth);

        if (staff.clef === 'treble') {
          currentStave.addClef('treble');
        } else if (staff.clef === 'bass') {
          currentStave.addClef('bass');
        }

        if (scoreData.timeSignature) {
          currentStave.addTimeSignature(`${numerator}/${denominator}`);
        }

        if (scoreData.keySignature) {
          // VexFlow가 지원하는 조표 매핑
          // Major keys: C, G, D, A, E, B, F#, C#, F, Bb, Eb, Ab, Db, Gb
          // Minor keys: Am, Em, Bm, F#m, C#m, G#m, Dm, Bbm, Fm, Cm, Gm, Cbm
          const keySignatures: Record<string, string> = {
            // Major keys
            'C': 'C', 'G': 'G', 'D': 'D', 'A': 'A', 'E': 'E', 'B': 'B',
            'F#': 'F#', 'C#': 'C#', 'F': 'F', 'Bb': 'Bb', 'Eb': 'Eb',
            'Ab': 'Ab', 'Db': 'Db', 'Gb': 'Gb',
            // Minor keys
            'Am': 'Am', 'Em': 'Em', 'Bm': 'Bm', 'F#m': 'F#m', 'C#m': 'C#m',
            'G#m': 'G#m', 'Dm': 'Dm', 'Bbm': 'Bbm', 'Fm': 'Fm', 'Cm': 'Cm',
            'Gm': 'Gm', 'Cbm': 'Cbm'
          };
          const key = keySignatures[scoreData.keySignature] || 'C';
          try {
            currentStave.addKeySignature(key);
          } catch (e) {
            console.warn(`Failed to add key signature ${key}:`, e);
          }
        }

        currentStave.setContext(ctx).draw();
        xPosition = currentStave.getNoteStartX();
        lineNumber++;
      }

      const notes: StaveNote[] = [];

      // 마디의 음표 생성
      measure.notes.forEach((note: NoteData) => {
        if (note.rest) {
          const restNote = new StaveNote({
            clef: staff.clef,
            keys: ['b/4'],
            duration: durationToVexFlow(note.duration)
          });
          restNote.setStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' });
          notes.push(restNote);
        } else {
          const vexPitch = pitchToVexFlow(note.pitch);
          const staveNote = new StaveNote({
            clef: staff.clef,
            keys: [vexPitch],
            duration: durationToVexFlow(note.duration)
          });
          notes.push(staveNote);
        }
      });

      if (notes.length > 0 && currentStave) {
        // 각 음표를 보표에 연결
        notes.forEach((note) => {
          note.setContext(ctx).setStave(currentStave!);
        });

        // 마디의 실제 beats 계산 (음표 duration 기반)
        const durationMap: Record<string, number> = {
          'whole': 4, 'half': 2, 'quarter': 1, 'eighth': 0.5, 'sixteenth': 0.25
        };
        let measureBeats = 0;
        measure.notes.forEach((noteData) => {
          measureBeats += durationMap[noteData.duration] || 1;
        });

        // 마디의 beats가 박자표와 다르면 경고
        if (Math.abs(measureBeats - numBeats) > 0.01) { // 부동소수점 오차 고려
          console.warn(
            `Measure ${measureIndex + 1} has ${measureBeats} beats but time signature is ${numBeats}/${beatValue}. ` +
            `Using actual measure beats to avoid "Too many ticks" error.`
          );
        }

        // Voice는 마디의 실제 beats를 사용 (박자표와 다를 수 있음)
        // 마디의 beats가 박자표보다 크면 "Too many ticks" 오류 발생하므로
        // 실제 beats에 맞춰 Voice 생성 (분석 오류일 수 있지만 렌더링은 진행)
        const voiceBeats = Math.max(1, Math.ceil(measureBeats));

        const voice = new Voice({
          num_beats: voiceBeats,  // 마디의 실제 beats 사용
          beat_value: beatValue
        });

        try {
          voice.addTickables(notes);
        } catch (error) {
          console.error(`Error adding notes to voice (measure ${measureIndex + 1}):`, error);
          console.error(`Measure beats: ${measureBeats}, Voice beats: ${voiceBeats}, Time signature: ${numBeats}/${beatValue}`);
          console.error(`Notes in measure:`, measure.notes.map(n => `${n.pitch} (${n.duration})`));
          // 오류 발생 시 해당 마디를 건너뛰고 다음 마디로 진행
          xPosition += measureWidth;
          return; // forEach에서는 return으로 다음 iteration으로 진행
        }

        // Formatter로 마디 내 음표 위치 조정
        const formatter = new Formatter();
        formatter.joinVoices([voice]);
        formatter.format([voice], measureWidth - 20);

        // 음표 그리기
        voice.draw(ctx, currentStave);

        // 음표의 실제 X 위치 가져오기 (Formatter가 계산한 위치 사용)
        const notePositions: number[] = [];
        notes.forEach((note, index) => {
          try {
            // VexFlow StaveNote의 getAbsoluteX() 메서드 사용
            const staveNote = note as any;
            if (staveNote.getAbsoluteX && typeof staveNote.getAbsoluteX === 'function') {
              notePositions.push(staveNote.getAbsoluteX());
            } else if (staveNote.getX && typeof staveNote.getX === 'function') {
              notePositions.push(staveNote.getX());
            } else {
              // 대략적인 위치 계산 (Formatter가 배치한 위치 추정)
              const noteSpacing = measureWidth / Math.max(notes.length, 1);
              notePositions.push(xPosition + (index * noteSpacing));
            }
          } catch (e) {
            // 오류 발생 시 대략적인 위치 계산
            const noteSpacing = measureWidth / Math.max(notes.length, 1);
            notePositions.push(xPosition + (index * noteSpacing));
          }
        });

        // 위치가 없거나 모두 0이면 대략적인 위치 계산
        if (notePositions.length === 0 || notePositions.every(pos => pos === 0 || isNaN(pos))) {
          for (let i = 0; i < notes.length; i++) {
            const noteSpacing = measureWidth / Math.max(notes.length, 1);
            notePositions.push(xPosition + (i * noteSpacing));
          }
        }

        // 코드 기호 표시 (첫 번째 음표 위에)
        if (measure.chords && measure.chords.length > 0 && notePositions.length > 0) {
          measure.chords.forEach((chord, chordIndex) => {
            if (chordIndex < notePositions.length && chord) {
              try {
                ctx.setFont('Arial', 11, 'bold');
                const noteX = notePositions[chordIndex] || notePositions[0];
                ctx.fillText(chord, noteX - 5, yPosition - 15);
              } catch (e) {
                console.warn(`Failed to add chord ${chord}:`, e);
              }
            }
          });
        }

        // 가사 표시 (음표 아래)
        if (measure.lyrics && measure.lyrics.length > 0 && notePositions.length > 0) {
          measure.lyrics.forEach((lyric, lyricIndex) => {
            if (lyricIndex < notePositions.length && lyric) {
              try {
                ctx.setFont('Arial', 11, 'normal');
                const noteX = notePositions[lyricIndex] || notePositions[0];
                ctx.fillText(lyric, noteX - 5, yPosition + 90);
              } catch (e) {
                console.warn(`Failed to add lyric ${lyric}:`, e);
              }
            }
          });
        }
      }

      xPosition += measureWidth;
    });

    // 다음 보표를 위한 간격
    yPosition += staveSpacing;
  });
}
