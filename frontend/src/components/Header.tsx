import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Badge, Space } from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
  EditOutlined,
  LoginOutlined,
  FileTextOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Мой профиль',
      onClick: () => navigate('/profile')
    },
    {
      key: 'favorites',
      icon: <StarOutlined />,
      label: 'Избранное',
      onClick: () => navigate('/favorites')
    },
    ...(user?.userType === 'expert' ? [
      {
        key: 'my-articles',
        icon: <FileTextOutlined />,
        label: 'Мои статьи',
        onClick: () => navigate('/my-articles')
      },
      {
        key: 'create-article',
        icon: <EditOutlined />,
        label: 'Создать статью',
        onClick: () => navigate('/create-article')
      }
    ] : []),
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      onClick: logout,
      danger: true
    }
  ];

  return (
    <AntHeader 
      style={{ 
        background: '#fff', 
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, rgb(105 105 105) 0%, rgb(0 0 0) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px'
          }}>
            SoulSynergy
          </div>
        </Link>

        <Space size="large">
          <Link 
            to="/" 
            style={{ 
              fontSize: '16px',
              color: '#000',
              textDecoration: 'none',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <HomeOutlined /> Главная
          </Link>
          <Link 
            to="/experts" 
            style={{ 
              fontSize: '16px',
              color: '#000',
              textDecoration: 'none',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <TeamOutlined /> Эксперты
          </Link>
        </Space>
      </div>

      <Space size="middle">
        {user ? (
          <>
            <Button
              type="text"
              icon={<MessageOutlined />}
              onClick={() => navigate('/chats')}
              style={{ fontSize: '18px' }}
            />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                src={user.avatarUrl}
                icon={!user.avatarUrl && <UserOutlined />}
                style={{ cursor: 'pointer', backgroundColor: '#000000' }}
              />
            </Dropdown>
          </>
        ) : (
          <Space>
            <Button
              type="text"
              icon={<LoginOutlined />}
              onClick={() => navigate('/login')}
            >
              Войти
            </Button>
            <Button
              type="primary"
              onClick={() => navigate('/register')}
            >
              Регистрация
            </Button>
          </Space>
        )}
      </Space>
    </AntHeader>
  );
};

export default Header;
