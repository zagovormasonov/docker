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

  return (
    <AntLayout style={{ minHeight: '100vh', background: '#fafafa' }}>
      <Header />
      <Content style={{ padding: '24px 0', paddingBottom: isMobile && isChatsRoute ? 110 : 0 }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0', padding: '24px 0', position: isMobile && isChatsRoute ? 'fixed' : 'static', bottom: isMobile && isChatsRoute ? 0 : undefined, left: isMobile && isChatsRoute ? 0 : undefined, right: isMobile && isChatsRoute ? 0 : undefined, width: isMobile && isChatsRoute ? '100%' : undefined, zIndex: isMobile && isChatsRoute ? 998 : undefined }}>
        <Space direction="vertical" size="small">
          <Text>SoulSynergy © 2025 — Синергия в единстве</Text>
          <Space size="large">
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
    </AntLayout>
  );
};

export default Layout;
