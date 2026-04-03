import { Outlet, Link, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import Header from './Header';

const { Content, Footer } = AntLayout;
const { Text } = Typography;

const Layout = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isChatsRoute = location.pathname.startsWith('/chats');
  const isHomeRoute = location.pathname === '/';
  const HEADER_HEIGHT = 64;

  return (
    <AntLayout style={{ minHeight: '100vh', background: isHomeRoute ? '#030304' : '#fafafa' }}>
      <Header />
      <Content
        style={{
          padding: isChatsRoute ? 0 : '24px 0',
          paddingTop: isChatsRoute ? HEADER_HEIGHT : HEADER_HEIGHT + 24,
          background: isHomeRoute ? '#030304' : undefined
        }}
      >
        <Outlet />
      </Content>
      {!isChatsRoute && (
        <Footer
          style={{
            textAlign: 'center',
            background: isHomeRoute ? '#050508' : '#fff',
            borderTop: isHomeRoute ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0f0f0',
            padding: '24px 0'
          }}
        >
          <Space direction="vertical" size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: isHomeRoute ? '#e4e4e7' : 'rgb(99, 102, 241)', fontSize: '16px' }}>SoulSynergy</div>
              <div
                style={{
                  fontSize: '10px',
                  color: isHomeRoute ? '#71717a' : '#94a3b8',
                  textTransform: 'lowercase',
                  marginTop: -2,
                  letterSpacing: '1px'
                }}
              >
                синергия душ
              </div>
            </div>
            <Space size="large" wrap>
              <Link to="/offer" style={{ color: isHomeRoute ? '#a1a1aa' : '#666', textDecoration: 'none' }}>
                Публичная оферта
              </Link>
              <Link to="/privacy" style={{ color: isHomeRoute ? '#a1a1aa' : '#666', textDecoration: 'none' }}>
                Политика конфиденциальности
              </Link>
              <Link to="/user-agreement" style={{ color: isHomeRoute ? '#a1a1aa' : '#666', textDecoration: 'none' }}>
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
