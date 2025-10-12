import { Outlet, Link } from 'react-router-dom';
import { Layout as AntLayout, Space, Typography } from 'antd';
import Header from './Header';

const { Content, Footer } = AntLayout;
const { Text } = Typography;

const Layout = () => {
  return (
    <AntLayout style={{ minHeight: '100vh', background: '#fafafa' }}>
      <Header />
      <Content style={{ padding: '24px 0' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0', padding: '24px 0' }}>
        <Space direction="vertical" size="small">
          <Text>SoulSynergy © 2025 — Синергия в единстве</Text>
          <Space size="large">
            <Link to="/oferta" style={{ color: '#666', textDecoration: 'none' }}>
              Публичная оферта
            </Link>
            <Link to="/privacy-policy" style={{ color: '#666', textDecoration: 'none' }}>
              Политика конфиденциальности
            </Link>
          </Space>
        </Space>
      </Footer>
    </AntLayout>
  );
};

export default Layout;
