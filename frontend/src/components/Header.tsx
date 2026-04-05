import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Badge, Space, Drawer, Modal, Form, Input, message as antdMessage } from 'antd';
import {
  Home,
  Users,
  Calendar,
  MessageSquare,
  User,
  LogOut,
  FileText,
  Star,
  Settings,
  Headphones,
  Send,
  Bell,
  Search,
  Menu as MenuIcon,
  X,
  Sparkles,
  Command,
  Heart,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import Notifications from './Notifications';
import type { MenuProps } from 'antd';
import { useState, useEffect } from 'react';
import './Header.css';

const { Header: AntHeader } = Layout;

const Header = () => {
  const { user, logout } = useAuth();
  const { unreadCount, markAsRead, testNotification } = useNotifications();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        // Show search when scrolled past hero section
        setShowSearch(window.scrollY > 400);
      } else {
        setShowSearch(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
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
      icon: <User size={16} />,
      label: 'Мой профиль',
      onClick: () => navigate('/profile')
    },
    {
      key: 'favorites',
      icon: <Star size={16} />,
      label: 'Избранное',
      onClick: () => navigate('/favorites')
    },
    {
      key: 'my-bookings',
      icon: <Calendar size={16} />,
      label: 'Мои записи',
      onClick: () => navigate('/my-bookings')
    },
    ...((user?.userType === 'expert' || user?.userType === 'admin') ? [
      {
        key: 'my-articles',
        icon: <FileText size={16} />,
        label: 'Мои статьи',
        onClick: () => navigate('/my-articles')
      },
      {
        key: 'my-events',
        icon: <Calendar size={16} />,
        label: 'Мои события',
        onClick: () => navigate('/my-events')
      },
      {
        key: 'create-article',
        icon: <Sparkles size={16} />,
        label: 'Создать статью',
        onClick: () => navigate('/create-article')
      }
    ] : []),
    ...(user?.userType === 'admin' ? [
      {
        key: 'moderation',
        icon: <ShieldCheck size={16} />,
        label: 'Модерация',
        onClick: () => navigate('/moderation')
      },
      {
        key: 'admin-panel',
        icon: <Settings size={16} />,
        label: 'Админ панель',
        onClick: () => navigate('/admin-panel')
      }
    ] : []),
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: 'Выйти',
      onClick: logout,
      danger: true
    }
  ];

  const mobileMenuItems: MenuProps['items'] = [
    {
      key: 'home',
      icon: <Home size={18} />,
      label: 'Главная',
      onClick: () => {
        navigate('/');
        setMobileMenuOpen(false);
      }
    },
    {
      key: 'experts',
      icon: <Users size={18} />,
      label: 'Эксперты',
      onClick: () => {
        navigate('/experts');
        setMobileMenuOpen(false);
      }
    },
    {
      key: 'events',
      icon: <Calendar size={18} />,
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
          icon: <LayoutDashboard size={18} />,
          label: 'Кабинет эксперта',
          onClick: () => {
            navigate('/expert-dashboard');
            setMobileMenuOpen(false);
          },
          style: {
            background: 'var(--mu-accent, #000)',
            color: 'var(--mu-bg, #fff)',
            fontWeight: 500,
            borderRadius: 12,
            margin: '8px 16px'
          }
        }
      ] : []),
      {
        key: 'chats',
        icon: <MessageSquare size={18} />,
        label: `Чаты${unreadCount > 0 ? ` (${unreadCount})` : ''}`,
        onClick: () => {
          handleChatsClick();
          setMobileMenuOpen(false);
        }
      },
      {
        key: 'support',
        icon: <Headphones size={18} />,
        label: 'Поддержка',
        onClick: () => {
          setSupportModalOpen(true);
          setMobileMenuOpen(false);
        }
      },
      {
        key: 'profile',
        icon: <User size={18} />,
        label: 'Мой профиль',
        onClick: () => {
          navigate('/profile');
          setMobileMenuOpen(false);
        }
      },
      {
        key: 'favorites',
        icon: <Star size={18} />,
        label: 'Избранное',
        onClick: () => {
          navigate('/favorites');
          setMobileMenuOpen(false);
        }
      },
      {
        key: 'logout',
        icon: <LogOut size={18} />,
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
        icon: <User size={18} />,
        label: 'Войти',
        onClick: () => {
          navigate('/login');
          setMobileMenuOpen(false);
        }
      },
      {
        key: 'register',
        icon: <Sparkles size={18} />,
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
      <header className="header-minimal">
        <div className="header-minimal__left">
          <Link to="/" className="header-minimal__logo">
            <img src="/logo.png" alt="SoulSynergy" className="header-minimal__logo-icon" />
            <span className="header-minimal__logo-text">SoulSynergy</span>
          </Link>

          <nav className="header-minimal__nav">
            <Link to="/" className={`header-minimal__nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              Главная
            </Link>
            <Link to="/experts" className={`header-minimal__nav-link ${location.pathname.startsWith('/experts') ? 'active' : ''}`}>
              Эксперты
            </Link>
            <Link to="/events" className={`header-minimal__nav-link ${location.pathname.startsWith('/events') ? 'active' : ''}`}>
              События
            </Link>
          </nav>
        </div>

        <div className="header-minimal__right">
          {/* Dynamic Search */}
          {showSearch && (
            <div className="header-minimal__search">
              <Search size={16} />
              <input
                placeholder="Поиск..."
                value={searchParams.get('q') || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          )}

          <div className="header-minimal__actions desktop-user-actions">
            {user ? (
              <>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="header-minimal__btn" onClick={handleChatsClick}>
                    <Badge count={unreadCount} size="small" offset={[2, -2]}>
                      <MessageSquare size={19} />
                    </Badge>
                  </button>
                  <button className="header-minimal__btn" onClick={() => setNotificationsOpen(true)}>
                    <Badge count={notificationsUnreadCount} size="small" offset={[2, -2]}>
                      <Bell size={19} />
                    </Badge>
                  </button>
                  <button className="header-minimal__btn" onClick={() => setSupportModalOpen(true)}>
                    <Headphones size={19} />
                  </button>
                </div>

                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow={{ pointAtCenter: true }}>
                  <div className="header-minimal__avatar">
                    <Avatar
                      size={36}
                      src={user.avatarUrl || '/emp.jpg'}
                      icon={!user.avatarUrl && <User size={20} />}
                      style={{ cursor: 'pointer', backgroundColor: 'var(--mu-bg, #000)', color: 'var(--mu-text, #fff)' }}
                    />
                  </div>
                </Dropdown>
              </>
            ) : (
              <Space size={8}>
                <Button type="text" onClick={() => navigate('/login')} style={{ fontWeight: 500 }}>
                  Войти
                </Button>
                <Button 
                  type="primary" 
                  onClick={() => navigate('/register')}
                  style={{ borderRadius: '10px', height: '38px', fontWeight: 500 }}
                >
                  Регистрация
                </Button>
              </Space>
            )}
          </div>

          <button 
            className="header-minimal__btn mobile-menu-button" 
            onClick={() => setMobileMenuOpen(true)}
            style={{ display: 'none' }}
          >
            <Badge count={unreadCount} size="small">
              <MenuIcon size={22} />
            </Badge>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <Drawer
        placement="bottom"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        height="80vh"
        closable={false}
        styles={{
          body: { padding: 0 },
          content: { borderRadius: '24px 24px 0 0', overflow: 'hidden' },
          mask: { backdropFilter: 'blur(4px)' }
        }}
        className="mobile-bottom-sheet"
      >
        <div style={{
          width: '40px',
          height: '4px',
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '2px',
          margin: '12px auto'
        }} />
        <div style={{ 
          padding: '8px 24px 16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Навигация</span>
          <Button type="text" icon={<ChevronRight size={20} />} onClick={() => setMobileMenuOpen(false)} />
        </div>
        <Menu
          mode="vertical"
          items={mobileMenuItems}
          style={{ border: 'none', padding: '8px 12px' }}
          className="mobile-bottom-menu"
        />
      </Drawer>

      {/* Support Modal */}
      <Modal
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Headphones size={20} /> Поддержка</div>}
        open={supportModalOpen}
        onCancel={() => setSupportModalOpen(false)}
        footer={null}
        width={400}
        centered
        styles={{ content: { borderRadius: 20 } }}
      >
        <Form form={supportForm} layout="vertical" onFinish={handleSupportSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="contact" label="Контакт для связи" rules={[{ required: true }]}>
            <Input placeholder="Email или Telegram" />
          </Form.Item>
          <Form.Item name="message" label="Сообщение" rules={[{ required: true }]}>
            <Input.TextArea placeholder="Как мы можем помочь?" rows={4} />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" icon={<Send size={16} />} style={{ borderRadius: 10 }}>
              Отправить
            </Button>
          </div>
        </Form>
      </Modal>

      <Notifications
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onUnreadCountChange={setNotificationsUnreadCount}
      />
    </>
  );
};

export default Header;
