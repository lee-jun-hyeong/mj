import { useParams } from 'react-router-dom';
import ScoreViewer from '../components/ScoreViewer/ScoreViewer';

function ScoreDetail() {
  const { scoreId } = useParams<{ scoreId: string }>();

  if (!scoreId) {
    return <div>악보 ID가 없습니다.</div>;
  }

  return <ScoreViewer scoreId={scoreId} />;
}

export default ScoreDetail;

