import { Outlet } from 'react-router-dom';
import { Layout as AntLayout } from 'antd';
import Header from './Header';

const { Content, Footer } = AntLayout;

const Layout = () => {
  return (
    <AntLayout style={{ minHeight: '100vh', background: '#fafafa' }}>
      <Header />
      <Content style={{ padding: '24px 0' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
        Synergy © 2025 — Платформа для духовных мастеров
      </Footer>
    </AntLayout>
  );
};

export default Layout;
