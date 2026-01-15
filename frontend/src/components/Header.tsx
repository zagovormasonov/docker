import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  BellOutlined,
  ScheduleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import Notifications from './Notifications';
import type { MenuProps } from 'antd';
import { useState, useEffect } from 'react';

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

  const [searchParams, setSearchParams] = useSearchParams();
  const [showSearch, setShowSearch] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname === '/') {
        // Show search when scrolled past hero section (approx 400px)
        setShowSearch(window.scrollY > 400);
      } else {
        setShowSearch(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const handleSearchChange = (value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set('q', value);
      } else {
        newParams.delete('q');
      }
      return newParams;
    }, { replace: true });
  };

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
    {
      key: 'my-bookings',
      icon: <ScheduleOutlined />,
      label: 'Мои записи',
      onClick: () => navigate('/my-bookings')
    },
    ...((user?.userType === 'expert' || user?.userType === 'admin') ? [
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
      ...(user.userType === 'expert' || user.userType === 'admin' ? [
        {
          key: 'expert-dashboard-mobile',
          icon: <CalendarOutlined />,
          label: 'Кабинет эксперта',
          onClick: () => {
            navigate('/expert-dashboard');
            setMobileMenuOpen(false);
          },
          style: {
            background: 'rgb(99, 102, 241)',
            color: '#fff',
            fontWeight: 500,
            borderRadius: 8,
            margin: '8px 16px'
          }
        }
      ] : []),
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
      {
        key: 'my-bookings',
        icon: <ScheduleOutlined />,
        label: 'Мои записи',
        onClick: () => {
          navigate('/my-bookings');
          setMobileMenuOpen(false);
        }
      },
      ...(user?.userType === 'expert' || user?.userType === 'admin' ? [
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
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '0 24px',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 72
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img
              src="/logo.png"
              alt="SoulSynergy Logo"
              style={{
                height: '48px',
                width: '48px',
                objectFit: 'contain'
              }}
            />
            <div style={{
              fontSize: '22px',
              fontWeight: 600,
              color: 'rgb(99, 102, 241)',
              letterSpacing: '-0.5px'
            }}>
              SoulSynergy
            </div>
          </Link>

          {/* Dynamic Search Bar */}
          <div style={{
            marginLeft: showSearch ? 32 : 0,
            opacity: showSearch ? 1 : 0,
            visibility: showSearch ? 'visible' : 'hidden',
            transform: showSearch ? 'translateX(0)' : 'translateX(-20px)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            width: showSearch ? 260 : 0,
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}
            className="header-search-anim"
          >
            <Input
              placeholder="Поиск статей..."
              prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
              value={searchParams.get('q') || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                borderRadius: 20,
                background: '#f3f4f6',
                border: '1px solid transparent',
                padding: '6px 12px',
                fontSize: 14
              }}
              onFocus={(e) => {
                e.target.style.background = '#fff';
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.borderColor = 'transparent';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Десктопное меню - скрыто на мобильных устройствах */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="desktop-menu">
            <Link
              to="/"
              style={{
                fontSize: '15px',
                color: location.pathname === '/' ? 'rgb(99, 102, 241)' : '#4b5563',
                textDecoration: 'none',
                fontWeight: location.pathname === '/' ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <HomeOutlined /> Главная
            </Link>
            <Link
              to="/experts"
              style={{
                fontSize: '15px',
                color: location.pathname === '/experts' || location.pathname.startsWith('/experts/') ? 'rgb(99, 102, 241)' : '#4b5563',
                textDecoration: 'none',
                fontWeight: location.pathname === '/experts' || location.pathname.startsWith('/experts/') ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <TeamOutlined /> Эксперты
            </Link>
            <Link
              to="/events"
              style={{
                fontSize: '15px',
                color: location.pathname === '/events' || location.pathname.startsWith('/events/') ? 'rgb(99, 102, 241)' : '#4b5563',
                textDecoration: 'none',
                fontWeight: location.pathname === '/events' || location.pathname.startsWith('/events/') ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
                {(user.userType === 'expert' || user.userType === 'admin') && (
                  <Button
                    type="primary"
                    icon={<CalendarOutlined />}
                    onClick={() => navigate('/expert-dashboard')}
                    style={{
                      background: 'rgb(99, 102, 241)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 500,
                      borderRadius: '12px',
                      height: '40px',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    Кабинет эксперта
                  </Button>
                )}
                <div style={{ display: 'flex', gap: 4 }}>
                  <Badge count={unreadCount} offset={[-5, 5]}>
                    <Button
                      type="text"
                      icon={<MessageOutlined />}
                      onClick={handleChatsClick}
                      style={{ fontSize: '18px', width: 40, height: 40, borderRadius: '10px' }}
                    />
                  </Badge>
                  <Badge count={notificationsUnreadCount} offset={[-5, 5]}>
                    <Button
                      type="text"
                      icon={<BellOutlined />}
                      onClick={() => setNotificationsOpen(true)}
                      style={{ fontSize: '18px', width: 40, height: 40, borderRadius: '10px' }}
                    />
                  </Badge>
                  <Button
                    type="text"
                    icon={<CustomerServiceOutlined />}
                    onClick={() => setSupportModalOpen(true)}
                    style={{ fontSize: '18px', width: 40, height: 40, borderRadius: '10px' }}
                    title="Поддержка"
                  />
                </div>

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
                    size={44}
                    src={user.avatarUrl || '/emp.jpg'}
                    icon={!user.avatarUrl && <UserOutlined />}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: '#6366f1',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                    }}
                  />
                </Dropdown>
              </>
            ) : (
              <Space size={12}>
                <Button
                  type="text"
                  icon={<LoginOutlined />}
                  onClick={() => navigate('/login')}
                  style={{ fontWeight: 500 }}
                >
                  Войти
                </Button>
                <Button
                  type="primary"
                  onClick={() => navigate('/register')}
                  style={{
                    background: '#6366f1',
                    height: 40,
                    borderRadius: 12,
                    fontWeight: 500,
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                  }}
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
                  height: '58px',
                  width: '58px',
                  objectFit: 'contain'
                }}
              />
              <span style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'rgb(99, 102, 241)'
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
        afterClose={() => {
          // Возвращаем фокус на страницу после закрытия модального окна
          document.body.style.overflow = 'auto';
        }}
        destroyOnClose={true}
        maskClosable={true}
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
