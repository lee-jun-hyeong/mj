import { useEffect, useRef, useState } from 'react';
import { useScore } from '../../hooks/useScore';
import ScorePlayer from '../ScorePlayer/ScorePlayer';
import { parseMusicXML } from '../../lib/musicXmlParser';
import { renderScore } from '../../lib/vexflowRenderer';
import { processOMR } from '../../services/omr';
import { updateScore } from '../../services/firestore';
import './ScoreViewer.css';

interface ScoreViewerProps {
  scoreId: string;
}

function ScoreViewer({ scoreId }: ScoreViewerProps) {
  const { score, loading, error } = useScore(scoreId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [reprocessing, setReprocessing] = useState(false);

  useEffect(() => {
    if (!score || !containerRef.current) return;

    try {
      // MusicXML이 비어있거나 유효하지 않은지 확인
      const isEmptyMusicXml = !score.musicXml ||
        score.musicXml.trim() === '' ||
        score.musicXml.trim() === '<?xml version="1.0" encoding="UTF-8"?><score-partwise></score-partwise>' ||
        score.musicXml.includes('<score-partwise></score-partwise>');

      if (isEmptyMusicXml) {
        // MusicXML이 비어있으면 원본 이미지만 표시
        console.warn('MusicXML이 비어있습니다. 원본 이미지를 표시합니다.');
        if (containerRef.current) {
          containerRef.current.innerHTML = '<p>악보 데이터가 없습니다. OMR 처리가 필요합니다.</p>';
        }
        return;
      }

      // MusicXML 파싱
      console.log('MusicXML 데이터:', score.musicXml.substring(0, 500));
      const measures = parseMusicXML(score.musicXml);
      console.log('파싱된 measures:', measures);

      if (measures.length > 0 && measures.some(m => m.notes.length > 0)) {
        // 실제 MusicXML 데이터가 있으면 렌더링
        console.log('악보 렌더링 시작');
        renderScore(containerRef.current, measures, 800);
        console.log('악보 렌더링 완료');
      } else {
        // 파싱된 데이터가 없으면 메시지 표시
        console.warn('파싱된 데이터가 없습니다. measures:', measures);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <p>악보 데이터를 파싱할 수 없습니다. 원본 이미지를 확인해주세요.</p>
            <details>
              <summary>디버그 정보</summary>
              <pre>${JSON.stringify({
                measuresCount: measures.length,
                hasNotes: measures.some(m => m.notes.length > 0),
                musicXmlPreview: score.musicXml.substring(0, 200)
              }, null, 2)}</pre>
            </details>
          `;
        }
      }
    } catch (err) {
      console.error('악보 렌더링 오류:', err);
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <p>악보를 표시하는 중 오류가 발생했습니다.</p>
          <details>
            <summary>오류 상세</summary>
            <pre>${err instanceof Error ? err.stack : String(err)}</pre>
          </details>
        `;
      }
    }
  }, [score]);

  const handleReprocessOMR = async () => {
    if (!score || !score.imageUrl || reprocessing) return;

    setReprocessing(true);
    try {
      console.log('OMR 재처리 시작:', score.imageUrl);
      const musicXml = await processOMR(score.imageUrl);
      console.log('OMR 재처리 완료, MusicXML 길이:', musicXml.length);

      if (musicXml && musicXml.trim() !== '' && !musicXml.includes('<score-partwise></score-partwise>')) {
        await updateScore(scoreId, { musicXml });
        // 페이지 새로고침으로 업데이트된 데이터 로드
        window.location.reload();
      } else {
        alert('OMR 처리가 완료되었지만 유효한 악보 데이터를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('OMR 재처리 오류:', error);
      alert('OMR 재처리 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setReprocessing(false);
    }
  };

  if (loading) {
    return <div className="score-viewer loading">악보를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="score-viewer error">{error}</div>;
  }

  if (!score) {
    return <div className="score-viewer">악보를 찾을 수 없습니다.</div>;
  }

  const isEmptyMusicXml = !score.musicXml ||
    score.musicXml.trim() === '' ||
    score.musicXml.trim() === '<?xml version="1.0" encoding="UTF-8"?><score-partwise></score-partwise>' ||
    score.musicXml.includes('<score-partwise></score-partwise>');

  return (
    <div className="score-viewer">
      <h3>{score.title}</h3>
      {isEmptyMusicXml && score.imageUrl && (
        <div className="omr-reprocess">
          <p>악보 데이터가 없습니다. OMR 처리를 다시 시도하세요.</p>
          <button
            onClick={handleReprocessOMR}
            disabled={reprocessing}
            className="btn-reprocess"
          >
            {reprocessing ? '처리 중...' : 'OMR 재처리'}
          </button>
        </div>
      )}
      <ScorePlayer scoreId={score.id} />
      <div className="score-container" ref={containerRef}></div>
      {score.imageUrl && (
        <div className="score-image">
          <img src={score.imageUrl} alt={score.title} />
        </div>
      )}
    </div>
  );
}

export default ScoreViewer;

