import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow';
import { ScoreData, StaffData, MeasureData, NoteData } from '../types/score';

// VexFlow 음높이 매핑 (과학적 음높이 → VexFlow 형식)
// 유효하지 않은 pitch는 null 반환 (코드 기호 등 필터링)
const pitchToVexFlow = (pitch: string): string | null => {
  // 코드 기호 패턴 제거 (F#m7, Am, C 등)
  // 유효한 형식: A-G + (#|b)? + 숫자 (예: C4, F#4, Bb3)
  const match = pitch.match(/^([A-G])(#|b)?(\d+)$/);
  if (!match) {
    // 개발 모드에서만 경고 표시
    if (import.meta.env.DEV) {
      console.warn(`Invalid pitch format: "${pitch}" (possibly a chord symbol, skipping)`);
    }
    return null;
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
        lineNumber++;
      }

      const notes: StaveNote[] = [];

      // 마디의 음표 생성
      measure.notes.forEach((note: NoteData) => {
        if (note.rest || !note.pitch) {
          // 쉼표 처리: rest가 true이거나 pitch가 null/undefined인 경우
          const restNote = new StaveNote({
            clef: staff.clef,
            keys: ['b/4'],
            duration: durationToVexFlow(note.duration)
          });
          restNote.setStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' });
          notes.push(restNote);
        } else {
          const vexPitch = pitchToVexFlow(note.pitch);
          if (!vexPitch) {
            // 유효하지 않은 pitch: 대체 음표로 표시 (C4로 표시하고 스타일로 구분)
            const invalidNote = new StaveNote({
              clef: staff.clef,
              keys: ['c/4'],
              duration: durationToVexFlow(note.duration)
            });
            // 유효하지 않은 pitch 표시를 위한 스타일 (빨간색으로 표시)
            invalidNote.setStyle({
              fillStyle: '#ffcccc',
              strokeStyle: '#ff0000'
            });
            notes.push(invalidNote);
            if (import.meta.env.DEV) {
              console.warn(`Invalid pitch "${note.pitch}" in measure ${measureIndex + 1}, rendered as placeholder (red note)`);
            }
          } else {
            const staveNote = new StaveNote({
              clef: staff.clef,
              keys: [vexPitch],
              duration: durationToVexFlow(note.duration)
            });
            notes.push(staveNote);
          }
        }
      });

      if (notes.length > 0 && currentStave) {
        // 마디의 실제 시작 X 위치 계산
        const staveNoteStartX = currentStave.getNoteStartX();
        let measureStartX: number;

        // startX 정보가 있으면 이미지 내 상대 위치를 사용하여 계산
        if (measure.startX !== undefined && measure.startX !== null) {
          // startX는 0.0 ~ 1.0 범위의 상대 위치
          // 보표의 사용 가능한 너비에 비례하여 계산
          const availableWidth = staveWidth - 100; // 여백 제외
          measureStartX = staveNoteStartX + measure.startX * availableWidth;
        } else {
          // startX 정보가 없으면 기존 방식대로 균등 배치
          measureStartX = staveNoteStartX + (measureIndex % measuresPerLine) * measureWidth;
        }

        // 마디의 실제 너비 계산
        // startX가 있으면 다음 마디의 startX를 사용하여 실제 너비 계산
        let actualMeasureWidth = measureWidth;
        let nextMeasureStartX: number | null = null;

        if (measure.startX !== undefined && measure.startX !== null) {
          // 다음 마디의 startX 확인
          const nextMeasure = staff.measures[measureIndex + 1];
          if (nextMeasure && nextMeasure.startX !== undefined && nextMeasure.startX !== null) {
            const availableWidth = staveWidth - 100;
            nextMeasureStartX = staveNoteStartX + nextMeasure.startX * availableWidth;
            actualMeasureWidth = nextMeasureStartX - measureStartX;
          } else {
            // 다음 마디의 startX가 없으면 기본 measureWidth 사용
            actualMeasureWidth = measureWidth;
          }
        }

        // beat 위치를 픽셀 위치로 변환하는 함수
        const beatToPixel = (beat: number): number => {
          // 마디의 사용 가능한 너비 (여백 제외)
          // 실제 마디 너비를 사용하여 정확한 위치 계산
          const availableWidth = actualMeasureWidth - 20;
          // beat를 픽셀 위치로 변환 (0 beat = 마디 시작, numBeats = 마디 끝)
          return measureStartX + (beat / numBeats) * availableWidth;
        };

        // beat 정보가 있는지 확인
        const hasBeatInfo = measure.notes.some(note => note.beat !== undefined && note.beat !== null);

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

        // 마디의 beats가 박자표와 다르면 경고 (개발 모드에서만, 디버깅용)
        // 실제로는 부족한 beats를 쉼표로 채워서 해결하므로 경고만 표시
        if (import.meta.env.DEV && Math.abs(measureBeats - numBeats) > 0.01) { // 부동소수점 오차 고려
          // 경고를 더 조용하게 표시 (디버깅이 필요할 때만 확인)
          // console.warn(
          //   `[Measure ${measureIndex + 1}] Beats mismatch: ${measureBeats} vs ${numBeats}/${beatValue}`
          // );
        }

        // Voice는 마디의 실제 beats를 사용 (박자표와 다를 수 있음)
        // VexFlow Voice는 정수 beats만 받을 수 있으므로, measureBeats를 정수로 변환
        // measureBeats가 voiceBeats보다 작으면 "IncompleteVoice" 오류 발생
        // measureBeats가 voiceBeats보다 크면 "Too many ticks" 오류 발생
        // 따라서 voiceBeats를 실제 measureBeats의 올림값으로 설정하고, 부족한 beats를 쉼표로 채움
        const voiceBeats = Math.max(1, Math.ceil(measureBeats));

        const voice = new Voice({
          num_beats: voiceBeats,  // 마디의 실제 beats 사용 (올림)
          beat_value: beatValue
        });

        try {
          voice.addTickables(notes);

          // measureBeats가 voiceBeats보다 작으면 부족한 beats를 쉼표로 채움
          const missingBeats = voiceBeats - measureBeats;
          if (missingBeats > 0.01) { // 부동소수점 오차 고려
            // 부족한 beats를 쉼표로 채움
            let remainingBeats = missingBeats;
            while (remainingBeats > 0.01) {
              let restDuration: string;
              if (remainingBeats >= 2) {
                restDuration = 'half';
                remainingBeats -= 2;
              } else if (remainingBeats >= 1) {
                restDuration = 'quarter';
                remainingBeats -= 1;
              } else if (remainingBeats >= 0.5) {
                restDuration = 'eighth';
                remainingBeats -= 0.5;
              } else {
                restDuration = 'sixteenth';
                remainingBeats -= 0.25;
              }

              const restNote = new StaveNote({
                clef: staff.clef,
                keys: ['b/4'],
                duration: durationToVexFlow(restDuration)
              });
              restNote.setStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' });
              voice.addTickable(restNote);
            }
          }
        } catch (error) {
          console.error(`Error adding notes to voice (measure ${measureIndex + 1}):`, error);
          console.error(`Measure beats: ${measureBeats}, Voice beats: ${voiceBeats}, Time signature: ${numBeats}/${beatValue}`);
          console.error(`Notes in measure:`, measure.notes.map(n => `${n.pitch} (${n.duration})`));
          // 오류 발생 시 해당 마디를 건너뛰고 다음 마디로 진행
          return; // forEach에서는 return으로 다음 iteration으로 진행
        }

        // Formatter로 마디 내 음표 위치 조정
        // Formatter를 항상 실행해야 getBoundingBox() 등이 작동함
        // beat 정보가 있으면 Formatter의 width를 beat 기반으로 계산하여 음표들이 올바른 위치에 배치되도록 함
        const formatter = new Formatter();
        formatter.joinVoices([voice]);

        // beat 정보가 있으면 마지막 beat를 기준으로 width 계산
        // Formatter는 음표들을 균등하게 배치하므로, 마지막 beat 위치에 맞춰 width를 조정
        // 실제 마디 너비를 사용하여 더 정확한 배치
        let formatWidth = actualMeasureWidth - 20;
        if (hasBeatInfo) {
          // 마디 내 최대 beat 값 찾기
          let maxBeat = 0;
          measure.notes.forEach((noteData) => {
            if (noteData.beat !== undefined && noteData.beat !== null) {
              maxBeat = Math.max(maxBeat, noteData.beat);
            }
          });

          // 마지막 beat가 numBeats보다 작으면 그에 맞춰 width 조정
          // 예: 4/4 박자인데 마지막 beat가 3이면, width를 3/4로 조정
          if (maxBeat > 0 && maxBeat < numBeats) {
            formatWidth = (actualMeasureWidth - 20) * (maxBeat / numBeats);
          }

          // beat 정보가 있으면 Formatter가 음표들을 넓게 배치하도록 width를 크게 설정
          // 실제 beat 위치는 Formatter 후에 개별적으로 조정할 수 없으므로,
          // Formatter의 width를 조정하여 근사치를 맞춤
          formatWidth = actualMeasureWidth * 2; // 충분히 넓게 설정
        }

        formatter.format([voice], formatWidth);

        // 음표의 실제 X 위치 계산 (beat 정보 우선, 없으면 Formatter 사용)
        const notePositions: number[] = [];
        const noteBeatMap = new Map<number, number>(); // beat -> X 위치 매핑

        // 먼저 위치를 계산
        notes.forEach((_, index) => {
          const noteData = measure.notes[index];
          let noteX = 0;

          // beat 정보가 있으면 beat 기반으로 위치 계산
          if (noteData.beat !== undefined && noteData.beat !== null) {
            noteX = beatToPixel(noteData.beat);
            noteBeatMap.set(noteData.beat, noteX);
          } else if (hasBeatInfo) {
            // beat 정보가 있는데 이 음표만 beat가 없으면 대략적인 위치 계산
            const noteSpacing = (measureWidth - 20) / Math.max(notes.length, 1);
            noteX = measureStartX + (index * noteSpacing);
          } else {
            // beat 정보가 없으면 Formatter가 계산한 위치 사용 (나중에 Voice.draw() 후에 가져옴)
            noteX = 0; // 임시값, 나중에 업데이트
          }

          notePositions.push(noteX);
        });

        // beat 정보가 있으면 Formatter의 width를 조정하여 음표들이 올바른 위치에 배치되도록 함
        // VexFlow의 StaveNote에는 setX() 메서드가 없으므로, Formatter의 width를 조정하는 방법을 사용
        if (hasBeatInfo) {
          // 디버깅 로그 (개발 모드에서만)
          if (import.meta.env.DEV) {
            notes.forEach((_, index) => {
              const noteData = measure.notes[index];
              if (noteData.beat !== undefined && noteData.beat !== null) {
                const noteX = notePositions[index];
                console.log(`[Measure ${measureIndex + 1}, Note ${index}] beat=${noteData.beat}, expectedX=${noteX.toFixed(1)}, staveNoteStartX=${staveNoteStartX.toFixed(1)}`);
              }
            });
          }
          // Formatter의 width를 조정했으므로, 음표들이 beat 비율에 맞춰 배치됨
          // 추가 조정은 불가능하므로 Formatter가 계산한 위치를 사용
        } else {
          // beat 정보가 없으면 Formatter가 계산한 위치는 getX()를 사용하지 않고 대략적인 위치 계산만 사용
          // getX()는 내부적으로 getAbsoluteX()를 호출할 수 있어 오류 발생 가능
          notes.forEach((_, index) => {
            if (notePositions[index] === 0) {
              // 대략적인 위치 계산 (Formatter가 배치한 위치를 정확히 알 수 없으므로)
              // 실제 마디 너비를 사용
              const noteSpacing = (actualMeasureWidth - 20) / Math.max(notes.length, 1);
              notePositions[index] = measureStartX + (index * noteSpacing);
            }
          });
        }

        // Voice를 통해 그리기 (Formatter가 실행되어 TickContext가 설정되어 있음)
        voice.draw(ctx, currentStave);

        // 위치가 없거나 모두 0이면 대략적인 위치 계산
        if (notePositions.length === 0 || notePositions.every(pos => pos === 0 || isNaN(pos))) {
          const noteSpacing = (actualMeasureWidth - 20) / Math.max(notes.length, 1);
          for (let i = 0; i < notes.length; i++) {
            notePositions.push(measureStartX + (i * noteSpacing));
          }
        }

        // 코드 기호 표시 (보표 위에) - beat 위치 기반
        if (measure.chords && measure.chords.length > 0 && currentStave) {
          measure.chords.forEach((chord, chordIndex) => {
            if (chord) {
              try {
                ctx.setFont('Arial', 11, 'bold');
                let chordX = 0;

                // chordPositions가 있으면 beat 기반으로 위치 계산
                if (measure.chordPositions && measure.chordPositions[chordIndex] !== undefined) {
                  const chordBeat = measure.chordPositions[chordIndex];
                  chordX = beatToPixel(chordBeat);
                } else if (chordIndex < notePositions.length) {
                  // fallback: 해당 인덱스의 음표 위치 사용
                  chordX = notePositions[chordIndex];
                } else if (notePositions.length > 0) {
                  // fallback: 첫 번째 음표 위치 사용
                  chordX = notePositions[0];
                } else {
                  // fallback: 마디 시작 위치
                  chordX = measureStartX;
                }

                // 보표 위에 표시
                const chordY = currentStave!.getYForTopText(0) - 5;
                // 텍스트 중앙 정렬
                const textWidth = ctx.measureText(chord).width;
                ctx.fillText(chord, chordX - textWidth / 2, chordY);
              } catch (e) {
                console.warn(`Failed to add chord ${chord}:`, e);
              }
            }
          });
        }

        // 가사 표시 (보표 아래) - beat 위치 기반
        if (measure.lyrics && measure.lyrics.length > 0 && currentStave) {
          measure.lyrics.forEach((lyric, lyricIndex) => {
            if (lyric) {
              try {
                ctx.setFont('Arial', 11, 'normal');
                let lyricX = 0;

                // lyricPositions가 있으면 beat 기반으로 위치 계산
                if (measure.lyricPositions && measure.lyricPositions[lyricIndex] !== undefined) {
                  const lyricBeat = measure.lyricPositions[lyricIndex];
                  lyricX = beatToPixel(lyricBeat);
                } else if (lyricIndex < notePositions.length) {
                  // fallback: 해당 인덱스의 음표 위치 사용
                  lyricX = notePositions[lyricIndex];
                } else if (notePositions.length > 0) {
                  // fallback: 첫 번째 음표 위치 사용
                  lyricX = notePositions[0];
                } else {
                  // fallback: 마디 시작 위치
                  lyricX = measureStartX;
                }

                // 보표 아래에 표시
                const lyricY = currentStave!.getYForBottomText(0) + 15;
                // 텍스트 중앙 정렬
                const textWidth = ctx.measureText(lyric).width;
                ctx.fillText(lyric, lyricX - textWidth / 2, lyricY);
              } catch (e) {
                console.warn(`Failed to add lyric ${lyric}:`, e);
              }
            }
          });
        }

        // 마디선 그리기 (각 마디의 끝에)
        if (currentStave) {
          // 마디선 위치: 다음 마디의 startX가 있으면 그 위치, 없으면 measureStartX + actualMeasureWidth
          const measureEndX = nextMeasureStartX !== null
            ? nextMeasureStartX
            : (measureStartX + actualMeasureWidth);

          const staveTopY = currentStave.getYForLine(0);
          const staveBottomY = currentStave.getYForLine(4); // 5선 보표의 아래쪽

          // 마디선 그리기
          ctx.beginPath();
          ctx.moveTo(measureEndX, staveTopY);
          ctx.lineTo(measureEndX, staveBottomY);
          ctx.setStrokeStyle('#000000');
          ctx.setLineWidth(1);
          ctx.stroke();
        }
      }
    });

    // 다음 보표를 위한 간격
    yPosition += staveSpacing;
  });
}
