import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useConti, useContiActions } from '../hooks/useConti';
import { useScores } from '../hooks/useScore';
import { Conti } from '../types/conti';
import './ContiEdit.css';

function ContiEdit() {
  const { contiId } = useParams<{ contiId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conti, loading: contiLoading } = useConti(contiId);
  const { scores } = useScores(user?.uid);
  const { create, update, loading: actionLoading } = useContiActions();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedScoreIds, setSelectedScoreIds] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (conti) {
      setTitle(conti.title);
      setDescription(conti.description || '');
      setSelectedScoreIds([...conti.scoreIds]);
      setIsPublic(conti.isPublic);
    }
  }, [conti]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const contiData: Omit<Conti, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        title,
        description,
        scoreIds: selectedScoreIds,
        order: selectedScoreIds,
        isPublic,
      };

      if (contiId) {
        await update(contiId, contiData);
      } else {
        const id = await create(contiData);
        navigate(`/contis/${id}`);
      }
    } catch (err) {
      console.error('콘티 저장 오류:', err);
    }
  };

  const toggleScore = (scoreId: string) => {
    setSelectedScoreIds((prev) =>
      prev.includes(scoreId)
        ? prev.filter((id) => id !== scoreId)
        : [...prev, scoreId]
    );
  };

  const moveScore = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...selectedScoreIds];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newOrder.length) return;

    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setSelectedScoreIds(newOrder);
  };

  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  if (contiLoading) {
    return <div>콘티를 불러오는 중...</div>;
  }

  return (
    <div className="conti-edit">
      <h2>{contiId ? '콘티 편집' : '새 콘티 만들기'}</h2>
      <form onSubmit={handleSubmit} className="conti-form">
        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">설명 (선택사항)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-textarea"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>악보 선택</label>
          <div className="scores-selection">
            {scores.length === 0 ? (
              <p className="no-scores">업로드한 악보가 없습니다.</p>
            ) : (
              scores.map((score) => (
                <div
                  key={score.id}
                  className={`score-item ${selectedScoreIds.includes(score.id) ? 'selected' : ''}`}
                  onClick={() => toggleScore(score.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedScoreIds.includes(score.id)}
                    onChange={() => toggleScore(score.id)}
                  />
                  <span>{score.title}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedScoreIds.length > 0 && (
          <div className="form-group">
            <label>악보 순서</label>
            <div className="score-order">
              {selectedScoreIds.map((scoreId, index) => {
                const score = scores.find((s) => s.id === scoreId);
                return (
                  <div key={scoreId} className="order-item">
                    <span className="order-number">{index + 1}</span>
                    <span className="order-title">{score?.title || scoreId}</span>
                    <div className="order-buttons">
                      <button
                        type="button"
                        onClick={() => moveScore(index, 'up')}
                        disabled={index === 0}
                        className="btn-move"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveScore(index, 'down')}
                        disabled={index === selectedScoreIds.length - 1}
                        className="btn-move"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            공개 콘티로 설정
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-cancel"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="btn-submit"
          >
            {actionLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ContiEdit;

