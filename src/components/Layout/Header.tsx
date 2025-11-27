import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

function Header() {
  const { user, signIn, signOut } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>마이클 지저스</h1>
        </Link>
        <nav className="nav">
          {user && (
            <>
              <Link to="/scores" className="nav-link">
                내 악보
              </Link>
              <Link to="/contis" className="nav-link">
                내 콘티
              </Link>
            </>
          )}
          {user ? (
            <>
              <span className="user-name">{user.displayName || user.email}</span>
              <button onClick={signOut} className="btn-signout">
                로그아웃
              </button>
            </>
          ) : (
            <button onClick={signIn} className="btn-signin">
              Google 로그인
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;

