import { useAuth } from '../hooks/useAuth';
import { useScores } from '../hooks/useScore';
import { Link } from 'react-router-dom';
import ScoreUpload from '../components/ScoreUpload/ScoreUpload';
import Loading from '../components/Loading/Loading';
import './Scores.css';

function Scores() {
  const { user } = useAuth();
  const { scores, loading, error, refetch } = useScores(user?.uid);

  const handleUploadComplete = () => {
    refetch();
  };

  if (!user) {
    return (
      <div className="scores">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="scores">
      <h2>내 악보</h2>
      <ScoreUpload onUploadComplete={handleUploadComplete} />

      {loading && <Loading />}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <div className="scores-list">
          {scores.length === 0 ? (
            <p className="empty">아직 업로드한 악보가 없습니다.</p>
          ) : (
            scores.map((score) => (
              <Link
                key={score.id}
                to={`/scores/${score.id}`}
                className="score-card"
              >
                <h3>{score.title}</h3>
                <p className="score-date">
                  {new Date(score.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Scores;

