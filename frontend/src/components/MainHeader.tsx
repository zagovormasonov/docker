import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './MainHeader.css';

const MainHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isExpertOrAdmin = user?.userType === 'expert' || user?.userType === 'admin';
  const cabinetLabel = isExpertOrAdmin ? 'Кабинет мастера' : 'Личный кабинет';
  const cabinetHref = token ? (isExpertOrAdmin ? '/expert-dashboard' : '/profile') : '/login';
  const profileHref = token ? (isExpertOrAdmin && user?.id ? `/experts/${user.id}` : '/profile') : '/login';

  const close = () => setMobileOpen(false);

  return (
    <>
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
            События
          </Link>
          <Link className="ss-nl" to="/expert-landing">
            Цифровые продукты<span className="ss-ndot" />
          </Link>
          <button type="button" className="ss-nl" onClick={() => navigate('/')}>
            Дзен
          </button>
          {user?.userType === 'admin' && (
            <>
              <Link className={`ss-nl ${location.pathname.startsWith('/moderation') ? 'ss-active' : ''}`} to="/moderation">
                Модерация
              </Link>
              <Link className={`ss-nl ${location.pathname.startsWith('/admin-panel') ? 'ss-active' : ''}`} to="/admin-panel">
                Админ панель
              </Link>
            </>
          )}
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

          <Link className="ss-ibt ss-ibt--profile" to={profileHref} aria-label="Профиль">
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

          <Link className="ss-cab-btn" to={cabinetHref}>
            {cabinetLabel}
          </Link>

          <Link to={profileHref} className="ss-ava" aria-label="Профиль">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : null}
          </Link>

          {/* Гамбургер — только на маленьких экранах */}
          <button
            type="button"
            className="ss-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Открыть меню"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Мобильная шторка */}
      {mobileOpen && (
        <div className="ss-mobile-overlay" onClick={close}>
          <div className="ss-mobile-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ss-mobile-sheet-handle" />

            <div className="ss-mobile-sheet-header">
              <span className="ss-mobile-sheet-title">Навигация</span>
              <button type="button" className="ss-mobile-sheet-close" onClick={close} aria-label="Закрыть">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="ss-mobile-sheet-body">
              <nav className="ss-mobile-nav">
                <Link className={`ss-mobile-nav-link ${location.pathname === '/' ? 'ss-mobile-nav-link--active' : ''}`} to="/" onClick={close}>
                  Главная
                </Link>
                <Link className={`ss-mobile-nav-link ${location.pathname.startsWith('/experts') ? 'ss-mobile-nav-link--active' : ''}`} to="/experts" onClick={close}>
                  Мастера
                </Link>
                <Link className={`ss-mobile-nav-link ${location.pathname.startsWith('/events') ? 'ss-mobile-nav-link--active' : ''}`} to="/events" onClick={close}>
                  События
                </Link>
                <Link className="ss-mobile-nav-link" to="/expert-landing" onClick={close}>
                  Цифровые продукты
                </Link>
              </nav>

              <div className="ss-mobile-divider" />

              <nav className="ss-mobile-nav">
                {token && user?.userType === 'admin' && (
                  <>
                    <Link className={`ss-mobile-nav-link ${location.pathname.startsWith('/moderation') ? 'ss-mobile-nav-link--active' : ''}`} to="/moderation" onClick={close}>
                      Модерация
                    </Link>
                    <Link className={`ss-mobile-nav-link ${location.pathname.startsWith('/admin-panel') ? 'ss-mobile-nav-link--active' : ''}`} to="/admin-panel" onClick={close}>
                      Админ панель
                    </Link>
                  </>
                )}
                {token && isExpertOrAdmin && (
                  <Link className="ss-mobile-nav-link ss-mobile-nav-link--cabinet" to={cabinetHref} onClick={close}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                    Кабинет мастера
                  </Link>
                )}
                {token && (
                  <Link className="ss-mobile-nav-link" to={profileHref} onClick={close}>
                    Мой профиль
                  </Link>
                )}
                {token && (
                  <Link className="ss-mobile-nav-link" to="/chats" onClick={close}>
                    Чаты
                  </Link>
                )}
                {!token && (
                  <>
                    <Link className="ss-mobile-nav-link" to="/login" onClick={close}>
                      Войти
                    </Link>
                    <Link className="ss-mobile-nav-link ss-mobile-nav-link--cabinet" to="/register" onClick={close}>
                      Регистрация
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MainHeader;
