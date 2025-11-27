import { useEffect, useRef } from 'react';
import { useScore } from '../../hooks/useScore';
import ScorePlayer from '../ScorePlayer/ScorePlayer';
import { parseMusicXML } from '../../lib/musicXmlParser';
import { renderScore } from '../../lib/vexflowRenderer';
import './ScoreViewer.css';

interface ScoreViewerProps {
  scoreId: string;
}

function ScoreViewer({ scoreId }: ScoreViewerProps) {
  const { score, loading, error } = useScore(scoreId);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!score || !containerRef.current) return;

    try {
      // MusicXML 파싱
      if (score.musicXml && score.musicXml.trim() !== '') {
        const measures = parseMusicXML(score.musicXml);

        if (measures.length > 0 && measures.some(m => m.notes.length > 0)) {
          // 실제 MusicXML 데이터가 있으면 렌더링
          renderScore(containerRef.current, measures, 800);
        } else {
          // 파싱된 데이터가 없으면 메시지 표시
          containerRef.current.innerHTML = '<p>악보 데이터를 파싱할 수 없습니다. 원본 이미지를 확인해주세요.</p>';
        }
      } else {
        // MusicXML이 없으면 메시지 표시
        containerRef.current.innerHTML = '<p>악보 데이터가 없습니다. OMR 처리가 필요합니다.</p>';
      }
    } catch (err) {
      console.error('악보 렌더링 오류:', err);
      if (containerRef.current) {
        containerRef.current.innerHTML = '<p>악보를 표시하는 중 오류가 발생했습니다.</p>';
      }
    }
  }, [score]);

  if (loading) {
    return <div className="score-viewer loading">악보를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="score-viewer error">{error}</div>;
  }

  if (!score) {
    return <div className="score-viewer">악보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="score-viewer">
      <h3>{score.title}</h3>
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

