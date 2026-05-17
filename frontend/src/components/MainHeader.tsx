import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './MainHeader.css';

const MainHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();

  const cabinetLabel = user?.userType === 'expert' || user?.userType === 'admin' ? 'Кабинет мастера' : 'Личный кабинет';
  const cabinetHref = user?.slug ? `/${user.userType}/${user.slug}` : '/login';

  return (
    <nav className="ss-nav">
      <Link className="ss-nav-logo" to="/">
        <div className="ss-logo-mark">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M7 1.5C7 1.5 4.5 4.2 4.5 7C4.5 8.38 5.62 9.5 7 9.5C8.38 9.5 9.5 8.38 9.5 7C9.5 4.2 7 1.5 7 1.5Z"
              fill="white"
              opacity=".9"
            />
            <path
              d="M7 9.5C7 9.5 9.8 8.7 11.5 7C10.2 10.8 7 12.5 7 12.5C7 12.5 3.8 10.8 2.5 7C4.2 8.7 7 9.5 7 9.5Z"
              fill="white"
              opacity=".55"
            />
          </svg>
        </div>
        SoulSynergy
      </Link>

      <div className="ss-nav-links">
        <Link className={`ss-nl ${location.pathname === '/' ? 'ss-active' : ''}`} to="/">
          Главная
        </Link>
        <Link className={`ss-nl ${location.pathname.startsWith('/experts') ? 'ss-active' : ''}`} to="/experts">
          Мастера
        </Link>
        <Link className={`ss-nl ${location.pathname.startsWith('/events') ? 'ss-active' : ''}`} to="/events">
          Практики
        </Link>
        <Link className="ss-nl" to="/expert-landing">
          Цифровые продукты<span className="ss-ndot" />
        </Link>
        <button type="button" className="ss-nl" onClick={() => navigate('/')}>
          Дзен
        </button>
      </div>

      <div className="ss-nav-right">
        {token ? (
          <Link className="ss-ibt" to="/chats" aria-label="Чаты">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
              <path
                d="M2 2.5h11v7.5H8L5.5 12.5V10H2V2.5z"
                stroke="currentColor"
                strokeWidth=".9"
                fill="none"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        ) : null}

        <Link className="ss-ibt" to={token ? '/profile' : '/login'} aria-label="Профиль">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
            <path
              d="M7.5 1.5C5.3 1.5 3.5 3.3 3.5 5.5V9L2 10.5h11L11.5 9V5.5C11.5 3.3 9.7 1.5 7.5 1.5Z"
              stroke="currentColor"
              strokeWidth=".9"
              fill="none"
            />
            <path d="M6.2 12a1.3 1.3 0 002.6 0" stroke="currentColor" strokeWidth=".9" />
          </svg>
        </Link>

        <Link className="ss-cab-btn" to={token ? cabinetHref : '/login'}>
          {cabinetLabel}
        </Link>

        <Link to={token ? cabinetHref : '/login'} className="ss-ava" aria-label="Профиль">
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : null}
        </Link>
      </div>
    </nav>
  );
};

export default MainHeader;
