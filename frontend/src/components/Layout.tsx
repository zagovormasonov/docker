import { Outlet, Link, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Space, Typography } from 'antd';
import MainHeader from './MainHeader';

const { Content, Footer } = AntLayout;

const Layout = () => {
  const location = useLocation();
  const isChatsRoute = location.pathname.startsWith('/chats');
  const isHomeRoute = location.pathname === '/' || location.pathname === '';
  const HEADER_HEIGHT = 64;

  return (
    <AntLayout style={{ minHeight: '100vh', background: '#fafafa' }}>
      <MainHeader />
      <Content
        style={{
          padding: isChatsRoute || isHomeRoute ? 0 : '24px 0',
          paddingTop: isChatsRoute ? HEADER_HEIGHT : isHomeRoute ? HEADER_HEIGHT : HEADER_HEIGHT + 24
        }}
      >
        <Outlet />
      </Content>
      {!isChatsRoute && (
        <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0', padding: '24px 0' }}>
          <Space direction="vertical" size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: 'rgb(99, 102, 241)', fontSize: '16px' }}>SoulSynergy</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'lowercase', marginTop: -2, letterSpacing: '1px' }}>
                синергия душ
              </div>
            </div>
            <Space size="large" wrap>
              <Link to="/offer" style={{ color: '#666', textDecoration: 'none' }}>
                Публичная оферта
              </Link>
              <Link to="/privacy" style={{ color: '#666', textDecoration: 'none' }}>
                Политика конфиденциальности
              </Link>
              <Link to="/user-agreement" style={{ color: '#666', textDecoration: 'none' }}>
                Пользовательское соглашение
              </Link>
            </Space>
          </Space>
        </Footer>
      )}
    </AntLayout>
  );
};

export default Layout;
