import { useEffect, useState } from 'react';
import { subscribeToScores, getScore } from '../../lib/firestore';
import { ScoreDocument } from '../../types/score';
import './ScoreList.css';

interface ScoreListProps {
  onSelectScore: (score: ScoreDocument) => void;
  onUploadNew: () => void;
}

export default function ScoreList({ onSelectScore, onUploadNew }: ScoreListProps) {
  const [scores, setScores] = useState<ScoreDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToScores(
      (updatedScores) => {
        setScores(updatedScores);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error loading scores:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSelectScore = async (scoreId: string) => {
    try {
      const score = await getScore(scoreId);
      if (score) {
        onSelectScore(score);
      } else {
        setError('악보를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('Error loading score:', err);
      setError(err instanceof Error ? err.message : '악보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const getStatusLabel = (status: ScoreDocument['status']) => {
    switch (status) {
      case 'uploaded':
        return '⏳ 업로드됨';
      case 'processing':
        return '🔄 분석 중';
      case 'completed':
        return '✅ 완료';
      case 'error':
        return '❌ 오류';
      default:
        return status;
    }
  };

  const getStatusColor = (status: ScoreDocument['status']) => {
    switch (status) {
      case 'uploaded':
        return '#ffa500';
      case 'processing':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'error':
        return '#f44336';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <div className="score-list">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>악보 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="score-list">
        <div className="error-container">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="score-list">
      <div className="score-list-header">
        <h2>업로드된 악보</h2>
        <button onClick={onUploadNew} className="upload-new-button">
          + 새 악보 업로드
        </button>
      </div>

      {scores.length === 0 ? (
        <div className="empty-state">
          <p>업로드된 악보가 없습니다.</p>
          <button onClick={onUploadNew} className="upload-new-button">
            첫 악보 업로드하기
          </button>
        </div>
      ) : (
        <div className="score-list-grid">
          {scores.map((score) => (
            <div
              key={score.id}
              className="score-item"
              onClick={() => handleSelectScore(score.id)}
            >
              <div className="score-item-image">
                <img src={score.imageUrl} alt={score.scoreData?.title || '악보'} />
                <div
                  className="score-status-badge"
                  style={{ backgroundColor: getStatusColor(score.status) }}
                >
                  {getStatusLabel(score.status)}
                </div>
              </div>
              <div className="score-item-info">
                <h3>{score.scoreData?.title || '제목 없음'}</h3>
                {score.scoreData?.composer && (
                  <p className="composer">작곡: {score.scoreData.composer}</p>
                )}
                {score.scoreData && (
                  <p className="metadata">
                    조: {score.scoreData.keySignature} | 박자: {score.scoreData.timeSignature}
                  </p>
                )}
                <p className="date">
                  {new Date(score.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

