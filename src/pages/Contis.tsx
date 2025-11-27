import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useContis } from '../hooks/useConti';
import Loading from '../components/Loading/Loading';
import './Contis.css';

function Contis() {
  const { user } = useAuth();
  const { contis, loading, error } = useContis(user?.uid);

  if (!user) {
    return (
      <div className="contis">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="contis">
      <div className="contis-header">
        <h2>내 콘티</h2>
        <Link to="/contis/new" className="btn-create">
          새 콘티 만들기
        </Link>
      </div>

      {loading && <Loading />}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <div className="contis-list">
          {contis.length === 0 ? (
            <p className="empty">아직 생성한 콘티가 없습니다.</p>
          ) : (
            contis.map((conti) => (
              <Link
                key={conti.id}
                to={`/contis/${conti.id}`}
                className="conti-card"
              >
                <h3>{conti.title}</h3>
                {conti.description && <p className="conti-description">{conti.description}</p>}
                <p className="conti-info">
                  {conti.scoreIds.length}개의 악보 ·{' '}
                  {new Date(conti.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Contis;

