import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Badge, Space, Drawer, Modal, Form, Input, message as antdMessage } from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
  EditOutlined,
  LoginOutlined,
  FileTextOutlined,
  StarOutlined,
  CalendarOutlined,
  MenuOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  CustomerServiceOutlined,
  SendOutlined,
  SettingOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import Notifications from './Notifications';
import type { MenuProps } from 'antd';
import { useState } from 'react';

const { Header: AntHeader } = Layout;

const Header = () => {
  const { user, logout } = useAuth();
  const { unreadCount, markAsRead, testNotification } = useNotifications();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportForm] = Form.useForm();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);

  const handleChatsClick = () => {
    // НЕ сбрасываем счетчики при переходе в чаты
    // markAsRead();
    navigate('/chats');
  };

  const handleSupportSubmit = async (values: { contact: string; message: string }) => {
    try {
      const response = await fetch('/api/support/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (data.success) {
        antdMessage.success(data.message);
        setSupportModalOpen(false);
        supportForm.resetFields();
      } else {
        antdMessage.error(data.message || 'Ошибка отправки сообщения');
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения в поддержку:', error);
      antdMessage.error('Ошибка отправки сообщения. Попробуйте позже.');
    }
  };


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
    ...(user?.userType === 'admin' ? [
      {
        key: 'moderation',
        icon: <CheckCircleOutlined />,
        label: 'Модерация',
        onClick: () => navigate('/moderation')
      },
      {
        key: 'admin-panel',
        icon: <SettingOutlined />,
        label: 'Админ панель',
        onClick: () => navigate('/admin-panel')
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

  const mobileMenuItems: MenuProps['items'] = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Главная',
      onClick: () => {
        navigate('/');
        setMobileMenuOpen(false);
      }
    },
    {
      key: 'experts',
      icon: <TeamOutlined />,
      label: 'Эксперты',
      onClick: () => {
        navigate('/experts');
        setMobileMenuOpen(false);
      }
    },
    {
      key: 'events',
      icon: <CalendarOutlined />,
      label: 'События',
      onClick: () => {
        navigate('/events');
        setMobileMenuOpen(false);
      }
    },
    ...(user ? [
      {
        key: 'chats',
        icon: <MessageOutlined />,
        label: `Чаты${unreadCount > 0 ? ` (${unreadCount})` : ''}`,
        onClick: () => {
          handleChatsClick();
          setMobileMenuOpen(false);
        }
      },
      {
        key: 'support',
        icon: <CustomerServiceOutlined />,
        label: 'Поддержка',
        onClick: () => {
          setSupportModalOpen(true);
          setMobileMenuOpen(false);
        }
      },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Мой профиль',
        onClick: () => {
          navigate('/profile');
          setMobileMenuOpen(false);
        }
      },
      {
        key: 'favorites',
        icon: <StarOutlined />,
        label: 'Избранное',
        onClick: () => {
          navigate('/favorites');
          setMobileMenuOpen(false);
        }
      },
      ...(user?.userType === 'expert' ? [
        {
          key: 'my-articles',
          icon: <FileTextOutlined />,
          label: 'Мои статьи',
          onClick: () => {
            navigate('/my-articles');
            setMobileMenuOpen(false);
          }
        },
        {
          key: 'create-article',
          icon: <EditOutlined />,
          label: 'Создать статью',
          onClick: () => {
            navigate('/create-article');
            setMobileMenuOpen(false);
          }
        }
      ] : []),
      ...(user?.userType === 'admin' ? [
        {
          key: 'moderation',
          icon: <CheckCircleOutlined />,
          label: 'Модерация',
          onClick: () => {
            navigate('/moderation');
            setMobileMenuOpen(false);
          }
        },
        {
          key: 'admin-panel',
          icon: <SettingOutlined />,
          label: 'Админ панель',
          onClick: () => {
            navigate('/admin-panel');
            setMobileMenuOpen(false);
          }
        }
      ] : []),
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Выйти',
        onClick: () => {
          logout();
          setMobileMenuOpen(false);
        },
        danger: true
      }
    ] : [
      {
        key: 'login',
        icon: <LoginOutlined />,
        label: 'Войти',
        onClick: () => {
          navigate('/login');
          setMobileMenuOpen(false);
        }
      },
      {
        key: 'register',
        icon: <UserOutlined />,
        label: 'Регистрация',
        onClick: () => {
          navigate('/register');
          setMobileMenuOpen(false);
        }
      }
    ])
  ];

  return (
    <>
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
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img 
              src="/logo.png" 
              alt="SoulSynergy Logo" 
              style={{ 
                height: '32px', 
                width: '32px',
                objectFit: 'contain'
              }} 
            />
            <div style={{
              fontSize: '24px',
              fontWeight: 500,
              background: 'linear-gradient(135deg, rgb(180 194 255) 0%, rgb(245 236 255) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}>
              SoulSynergy
            </div>
          </Link>

          {/* Десктопное меню - скрыто на мобильных устройствах */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }} className="desktop-menu">
            <Link 
              to="/" 
              style={{ 
                fontSize: '16px',
                color: 'rgb(170 180 251)',
                textDecoration: 'none',
                fontWeight: 400,
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
                color: 'rgb(170 180 251)',
                textDecoration: 'none',
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <TeamOutlined /> Эксперты
            </Link>
            <Link 
              to="/events" 
              style={{ 
                fontSize: '16px',
                color: 'rgb(170 180 251)',
                textDecoration: 'none',
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CalendarOutlined /> События
            </Link>
          </div>
        </div>

        {/* Десктопные кнопки пользователя - скрыты на мобильных устройствах */}
        <div className="desktop-user-actions">
          <Space size="middle">
            {user ? (
              <>
                <Badge count={unreadCount} offset={[-5, 5]}>
                  <Button
                    type="text"
                    icon={<MessageOutlined />}
                    onClick={handleChatsClick}
                    style={{ fontSize: '18px' }}
                  />
                </Badge>
                <Badge count={notificationsUnreadCount} offset={[-5, 5]}>
                  <Button
                    type="text"
                    icon={<BellOutlined />}
                    onClick={() => setNotificationsOpen(true)}
                    style={{ fontSize: '18px' }}
                  />
                </Badge>
                <Button
                  type="text"
                  icon={<CustomerServiceOutlined />}
                  onClick={() => setSupportModalOpen(true)}
                  style={{ fontSize: '18px' }}
                  title="Поддержка"
                />
                {/* Тестовая кнопка для проверки уведомлений - только в разработке */}
                {import.meta.env.DEV && (
                  <Button
                    type="text"
                    onClick={testNotification}
                    style={{ fontSize: '12px', color: '#ff4d4f' }}
                  >
                    🧪 Тест
                  </Button>
                )}
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                  <Avatar
                    size={48}
                    src={user.avatarUrl}
                    icon={!user.avatarUrl && <UserOutlined />}
                    style={{ 
                      cursor: 'pointer', 
                      backgroundColor: '#6366f1',
                      border: '3px solid #6366f1',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                    }}
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
        </div>

        {/* Мобильная кнопка меню с индикатором */}
        <div style={{ position: 'relative' }}>
          <Badge count={unreadCount} offset={[-5, 5]}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              style={{ 
                fontSize: '18px',
                display: 'none'
              }}
              className="mobile-menu-button"
            />
          </Badge>
        </div>
      </AntHeader>

      {/* Мобильное меню */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src="/logo.png" 
                alt="SoulSynergy Logo" 
                style={{ 
                  height: '28px', 
                  width: '28px',
                  objectFit: 'contain'
                }} 
              />
              <span style={{
                fontSize: '20px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, rgb(180 194 255) 0%, rgb(245 236 255) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                SoulSynergy
              </span>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setMobileMenuOpen(false)}
              style={{ border: 'none', boxShadow: 'none' }}
            />
          </div>
        }
        placement="top"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        height="100vh"
        bodyStyle={{ padding: 0 }}
        headerStyle={{ 
          background: '#fff', 
          borderBottom: '1px solid #f0f0f0',
          padding: '16px 24px'
        }}
        style={{ zIndex: 1000 }}
      >
        <Menu
          mode="vertical"
          items={mobileMenuItems}
          style={{ 
            border: 'none',
            background: '#fff',
            padding: '16px 0'
          }}
        />
      </Drawer>

      {/* Модальное окно поддержки */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CustomerServiceOutlined style={{ color: '#1890ff' }} />
            Поддержка
          </div>
        }
        open={supportModalOpen}
        onCancel={() => {
          setSupportModalOpen(false);
          supportForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={supportForm}
          layout="vertical"
          onFinish={handleSupportSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="contact"
            label="Контакт для связи"
            rules={[
              { required: true, message: 'Пожалуйста, укажите контакт для связи' },
              { min: 3, message: 'Контакт должен содержать минимум 3 символа' }
            ]}
          >
            <Input
              placeholder="Email или ник в Telegram"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="message"
            label="Сообщение"
            rules={[
              { required: true, message: 'Пожалуйста, опишите вашу проблему' },
              { min: 10, message: 'Сообщение должно содержать минимум 10 символов' }
            ]}
          >
            <Input.TextArea
              placeholder="Опишите вашу проблему или вопрос..."
              rows={4}
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setSupportModalOpen(false);
                supportForm.resetFields();
              }}>
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={false}
              >
                Отправить
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Компонент уведомлений */}
      <Notifications
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onUnreadCountChange={setNotificationsUnreadCount}
      />
    </>
  );
};

export default Header;
