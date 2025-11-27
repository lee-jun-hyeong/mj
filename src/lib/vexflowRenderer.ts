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
      stave.addClef(clef.toLowerCase());
      if (key !== 0) {
        // Key signature는 간단히 처리 (실제로는 더 복잡)
        stave.addKeySignature(key > 0 ? 'F#' : 'Bb');
      }
      stave.addTimeSignature(`${timeSignature.beats}/${timeSignature.beatType}`);
    }

    stave.setContext(ctx).draw();

    // Notes 생성
    const staveNotes = measure.notes.map((note: ParsedNote) => {
      return new StaveNote({
        clef: clef.toLowerCase(),
        keys: [note.pitch],
        duration: note.duration,
      });
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

