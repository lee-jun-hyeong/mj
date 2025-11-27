import { useParams } from 'react-router-dom';
import { useConti } from '../hooks/useConti';
import { useContiActions } from '../hooks/useConti';
import ScoreViewer from '../components/ScoreViewer/ScoreViewer';
import ShareButton from '../components/Share/ShareButton';
import Loading from '../components/Loading/Loading';
import './ContiDetail.css';

function ContiDetail() {
  const { contiId } = useParams<{ contiId: string }>();
  const { conti, loading, error } = useConti(contiId);
  const { update } = useContiActions();

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className="conti-detail error">{error}</div>;
  }

  if (!conti) {
    return <div className="conti-detail">콘티를 찾을 수 없습니다.</div>;
  }

  const handlePublicChange = async (isPublic: boolean) => {
    if (!contiId) return;
    try {
      await update(contiId, { isPublic });
    } catch (error) {
      console.error('공개 설정 변경 오류:', error);
    }
  };

  return (
    <div className="conti-detail">
      <div className="conti-header">
        <h2>{conti.title}</h2>
        {conti.description && <p className="conti-description">{conti.description}</p>}
        <ShareButton
          contiId={conti.id}
          isPublic={conti.isPublic}
          onPublicChange={handlePublicChange}
        />
      </div>

      <div className="conti-scores">
        {conti.order.length === 0 ? (
          <p className="empty">이 콘티에는 악보가 없습니다.</p>
        ) : (
          conti.order.map((scoreId, index) => (
            <div key={scoreId} className="conti-score-item">
              <div className="score-header">
                <h3>악보 {index + 1}</h3>
              </div>
              <ScoreViewer scoreId={String(scoreId)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ContiDetail;

