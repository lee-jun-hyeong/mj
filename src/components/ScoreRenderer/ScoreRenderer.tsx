import { useEffect, useRef, useState } from 'react';
import { subscribeToScore } from '../../lib/firestore';
import { ScoreDocument, ScoreData } from '../../types/score';
import { renderScore } from '../../lib/vexflowRenderer';
import './ScoreRenderer.css';

interface ScoreRendererProps {
  score: ScoreDocument;
  onBack: () => void;
}

export default function ScoreRenderer({ score, onBack }: ScoreRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentScore, setCurrentScore] = useState<ScoreDocument>(score);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 실시간 업데이트 구독
    const unsubscribe = subscribeToScore(
      score.id,
      (updatedScore) => {
        if (updatedScore) {
          setCurrentScore(updatedScore);
        }
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        setError(error.message);
      }
    );

    return () => unsubscribe();
  }, [score.id]);

  useEffect(() => {
    if (currentScore.status === 'completed' && currentScore.scoreData && canvasRef.current) {
      try {
        renderScore(canvasRef.current, currentScore.scoreData);
      } catch (err) {
        console.error('Rendering error:', err);
        setError(err instanceof Error ? err.message : '렌더링 중 오류가 발생했습니다.');
      }
    }
  }, [currentScore]);

  if (currentScore.status === 'error') {
    return (
      <div className="score-renderer">
        <button className="back-button" onClick={onBack}>
          ← 돌아가기
        </button>
        <div className="error-container">
          <h2>❌ 분석 실패</h2>
          <p>{currentScore.errorMessage || '알 수 없는 오류가 발생했습니다.'}</p>
        </div>
      </div>
    );
  }

  if (currentScore.status === 'processing') {
    return (
      <div className="score-renderer">
        <button className="back-button" onClick={onBack}>
          ← 돌아가기
        </button>
        <div className="loading-container">
          <div className="spinner"></div>
          <h2>AI가 악보를 분석 중입니다...</h2>
          <p>잠시만 기다려주세요. 복잡한 악보는 시간이 더 걸릴 수 있습니다.</p>
        </div>
      </div>
    );
  }

  if (currentScore.status === 'completed' && currentScore.scoreData) {
    return (
      <div className="score-renderer">
        <div className="score-header">
          <button className="back-button" onClick={onBack}>
            ← 돌아가기
          </button>
          <div className="score-info">
            <h2>{currentScore.scoreData.title}</h2>
            {currentScore.scoreData.composer && (
              <p className="composer">작곡: {currentScore.scoreData.composer}</p>
            )}
            <p className="metadata">
              조: {currentScore.scoreData.keySignature} |
              박자: {currentScore.scoreData.timeSignature}
            </p>
          </div>
        </div>
        <div className="canvas-container">
          <canvas ref={canvasRef} />
        </div>
        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="score-renderer">
      <button className="back-button" onClick={onBack}>
        ← 돌아가기
      </button>
      <div className="loading-container">
        <div className="spinner"></div>
        <h2>대기 중...</h2>
      </div>
    </div>
  );
}

