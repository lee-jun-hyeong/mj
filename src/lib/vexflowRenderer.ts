import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow';
import { ParsedMeasure, ParsedNote } from './musicXmlParser';

export function renderScore(
  container: HTMLDivElement,
  measures: ParsedMeasure[],
  width: number = 800
): void {
  // 기존 내용 제거
  container.innerHTML = '';

  if (measures.length === 0) {
    container.innerHTML = '<p>표시할 악보가 없습니다.</p>';
    return;
  }

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  const ctx = renderer.getContext();

  const staveWidth = width - 20;
  const staveSpacing = 120;
  let yPosition = 40;

  // 첫 번째 measure에서 clef, key, time signature 가져오기
  const firstMeasure = measures[0];
  const clef = firstMeasure.clef?.sign || 'G';
  const key = firstMeasure.key?.fifths || 0;
  const timeSignature = firstMeasure.timeSignature || { beats: 4, beatType: 4 };

  measures.forEach((measure, measureIndex) => {
    if (measure.notes.length === 0) return;

    // Stave 생성
    const stave = new Stave(10, yPosition, staveWidth);

    // 첫 번째 measure에만 clef, key, time signature 추가
    if (measureIndex === 0) {
      // VexFlow 5.0 addClef는 문자열을 받음
      try {
        const clefType = clef.toLowerCase() === 'g' ? 'treble' :
                        clef.toLowerCase() === 'f' ? 'bass' :
                        clef.toLowerCase() === 'c' ? 'alto' : 'treble';
        stave.addClef(clefType);
      } catch (e) {
        // addClef 실패 시 기본값 사용
        console.warn('Clef 추가 실패, 기본값 사용:', e);
        try {
          stave.addClef('treble');
        } catch (e2) {
          console.warn('기본 Clef 추가도 실패:', e2);
        }
      }

      if (key !== 0) {
        // Key signature는 간단히 처리 (실제로는 더 복잡)
        try {
          stave.addKeySignature(key > 0 ? 'F#' : 'Bb');
        } catch (e) {
          console.warn('Key signature 추가 실패:', e);
        }
      }

      try {
        stave.addTimeSignature(`${timeSignature.beats}/${timeSignature.beatType}`);
      } catch (e) {
        console.warn('Time signature 추가 실패:', e);
      }
    }

    stave.setContext(ctx).draw();

    // Notes 생성
    // VexFlow 5.0에서는 StaveNote에 clef 속성을 올바른 형식으로 설정해야 함
    const clefType = clef.toLowerCase() === 'g' ? 'treble' :
                    clef.toLowerCase() === 'f' ? 'bass' :
                    clef.toLowerCase() === 'c' ? 'alto' : 'treble';

    const staveNotes = measure.notes.map((note: ParsedNote) => {
      try {
        return new StaveNote({
          keys: [note.pitch],
          duration: note.duration,
          clef: clefType,
        });
      } catch (error) {
        console.error('StaveNote 생성 오류:', error, { pitch: note.pitch, duration: note.duration, clef: clefType });
        // clef 없이 재시도
        return new StaveNote({
          keys: [note.pitch],
          duration: note.duration,
        });
      }
    });

    // Voice 생성 및 포맷팅
    const voice = new Voice({
      numBeats: timeSignature.beats,
      beatValue: timeSignature.beatType,
    });
    voice.addTickables(staveNotes);

    new Formatter().joinVoices([voice]).format([voice], staveWidth - 20);
    voice.draw(ctx, stave);

    yPosition += staveSpacing;
  });

  // 컨테이너 높이 조정
  renderer.resize(width, yPosition + 60);
}

