import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  List, 
  Badge, 
  Button, 
  Typography, 
  Space, 
  Tag, 
  Empty,
  Spin,
  message
} from 'antd';
import { 
  BellOutlined, 
  DeleteOutlined, 
  CheckOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from '../api/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsProps {
  visible: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ 
  visible, 
  onClose, 
  onUnreadCountChange 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/notifications');
      setNotifications(response.data.notifications);
      
      // Подсчитываем непрочитанные
      const unread = response.data.notifications.filter((n: Notification) => !n.is_read).length;
      setUnreadCount(unread);
      onUnreadCountChange(unread);
    } catch (error) {
      message.error('Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      onUnreadCountChange(Math.max(0, unreadCount - 1));
    } catch (error) {
      message.error('Ошибка обновления уведомления');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/notifications/mark-all-read');
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      onUnreadCountChange(0);
      message.success('Все уведомления отмечены как прочитанные');
    } catch (error) {
      message.error('Ошибка обновления уведомлений');
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await axios.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      onUnreadCountChange(Math.max(0, unreadCount - 1));
      message.success('Уведомление удалено');
    } catch (error) {
      message.error('Ошибка удаления уведомления');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'article_edited':
      case 'article_deleted':
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'event_edited':
      case 'event_deleted':
        return <CalendarOutlined style={{ color: '#52c41a' }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'article_edited':
      case 'event_edited':
        return 'blue';
      case 'article_deleted':
      case 'event_deleted':
        return 'red';
      default:
        return 'default';
    }
  };

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible]);

  return (
    <Drawer
      title={
        <Space>
          <BellOutlined />
          <span>Уведомления</span>
          {unreadCount > 0 && (
            <Badge count={unreadCount} size="small" />
          )}
        </Space>
      }
      placement="right"
      width={400}
      open={visible}
      onClose={onClose}
      extra={
        unreadCount > 0 && (
          <Button 
            type="link" 
            size="small" 
            onClick={markAllAsRead}
            icon={<CheckOutlined />}
          >
            Отметить все как прочитанные
          </Button>
        )
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : notifications.length === 0 ? (
        <Empty 
          description="Уведомлений пока нет"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(notification) => (
            <List.Item
              style={{
                backgroundColor: notification.is_read ? '#fff' : '#f6ffed',
                borderLeft: notification.is_read ? 'none' : '3px solid #52c41a',
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '6px'
              }}
              actions={[
                !notification.is_read && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => markAsRead(notification.id)}
                    icon={<CheckOutlined />}
                  >
                    Прочитано
                  </Button>
                ),
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => deleteNotification(notification.id)}
                  icon={<DeleteOutlined />}
                >
                  Удалить
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={getNotificationIcon(notification.type)}
                title={
                  <Space>
                    <Text strong={!notification.is_read}>
                      {notification.title}
                    </Text>
                    <Tag color={getNotificationColor(notification.type)}>
                      {notification.type.replace('_', ' ')}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(notification.created_at).format('DD.MM.YYYY HH:mm')}
                    </Text>
                    <div style={{ marginTop: '8px' }}>
                      <Text>{notification.message}</Text>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};

export default Notifications;
