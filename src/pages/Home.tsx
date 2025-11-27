import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Home.css';

function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      <h2>악보 콘티 앱에 오신 것을 환영합니다</h2>
      {user ? (
        <div className="welcome">
          <p>안녕하세요, {user.displayName || user.email}님!</p>
          <p>악보를 업로드하고 콘티를 만들어보세요.</p>
          <Link to="/scores" className="btn-primary">
            내 악보 보기
          </Link>
        </div>
      ) : (
        <div className="welcome">
          <p>로그인하여 악보 콘티 앱을 사용하세요.</p>
          <Link to="/login" className="btn-primary">
            로그인하기
          </Link>
        </div>
      )}
    </div>
  );
}

export default Home;

