import { Outlet, Link, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import Header from './Header';
import { useTheme } from '../hooks/useTheme';

const { Content, Footer } = AntLayout;
const { Text } = Typography;

const Layout = () => {
  const location = useLocation();
  const { isDark } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isChatsRoute = location.pathname.startsWith('/chats');
  const HEADER_HEIGHT = 64;

  return (
    <AntLayout style={{ 
      minHeight: '100vh', 
      background: isDark ? '#0f172a' : '#fafafa',
      transition: 'background 0.3s ease'
    }}>
      <Header />
      <Content
        style={{
          padding: isChatsRoute ? 0 : '24px 0',
          paddingTop: isChatsRoute ? HEADER_HEIGHT : HEADER_HEIGHT + 24
        }}
      >
        <Outlet />
      </Content>
      {!isChatsRoute && (
        <Footer style={{ 
          textAlign: 'center', 
          background: isDark ? '#0b1220' : '#fff', 
          borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0f0f0', 
          padding: '24px 0',
          color: isDark ? '#cbd5f5' : '#666'
        }}>
          <Space direction="vertical" size="small">
            <Text>SoulSynergy © 2025 — Синергия в единстве</Text>
            <Space size="large">
              <Link to="/offer" style={{ color: isDark ? '#cbd5f5' : '#666', textDecoration: 'none' }}>
                Публичная оферта
              </Link>
              <Link to="/privacy" style={{ color: isDark ? '#cbd5f5' : '#666', textDecoration: 'none' }}>
                Политика конфиденциальности
              </Link>
              <Link to="/user-agreement" style={{ color: isDark ? '#cbd5f5' : '#666', textDecoration: 'none' }}>
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
