import { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Typography,
  Space,
  Tag,
  Modal,
  Input,
  message,
  Tabs,
  Avatar,
  Row,
  Col,
  Divider
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  UserOutlined
} from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import './ModerationPage.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Article {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_email: string;
  created_at: string;
  cover_image?: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  author_name: string;
  author_email: string;
  created_at: string;
  cover_image?: string;
  event_date: string;
  event_type: string;
  is_online: boolean;
}

const ModerationPage = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Article | Event | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingItem, setRejectingItem] = useState<Article | Event | null>(null);

  useEffect(() => {
    if (user?.userType === 'admin') {
      fetchPendingItems();
    }
  }, [user]);

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const [articlesRes, eventsRes] = await Promise.all([
        api.get('/moderation/articles'),
        api.get('/moderation/events')
      ]);
      
      setArticles(articlesRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (error) {
      console.error('Ошибка загрузки элементов на модерацию:', error);
      // Не показываем ошибку, если поля модерации не настроены
      setArticles([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: Article | Event, type: 'article' | 'event') => {
    try {
      await api.post(`/moderation/${type}s/${item.id}/approve`);
      message.success(`${type === 'article' ? 'Статья' : 'Событие'} одобрено`);
      fetchPendingItems();
    } catch (error) {
      console.error(`Ошибка одобрения ${type}:`, error);
      message.error('Ошибка одобрения');
    }
  };

  const handleReject = async () => {
    if (!rejectingItem || !rejectReason.trim()) {
      message.error('Укажите причину отклонения');
      return;
    }

    try {
      const type = 'content' in rejectingItem ? 'article' : 'event';
      await api.post(`/moderation/${type}s/${rejectingItem.id}/reject`, {
        reason: rejectReason
      });
      
      message.success(`${type === 'article' ? 'Статья' : 'Событие'} отклонено`);
      setRejectModalVisible(false);
      setRejectReason('');
      setRejectingItem(null);
      fetchPendingItems();
    } catch (error) {
      console.error('Ошибка отклонения:', error);
      message.error('Ошибка отклонения');
    }
  };

  const openRejectModal = (item: Article | Event) => {
    setRejectingItem(item);
    setRejectModalVisible(true);
  };

  const renderItem = (item: Article | Event, type: 'article' | 'event') => (
    <Card
      key={item.id}
      style={{ marginBottom: 16 }}
      actions={[
        <Button
          key="view"
          icon={<EyeOutlined />}
          onClick={() => setSelectedItem(item)}
        >
          Просмотр
        </Button>,
        <Button
          key="approve"
          type="primary"
          icon={<CheckOutlined />}
          onClick={() => handleApprove(item, type)}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          Одобрить
        </Button>,
        <Button
          key="reject"
          danger
          icon={<CloseOutlined />}
          onClick={() => openRejectModal(item)}
        >
          Отклонить
        </Button>
      ]}
    >
      <Card.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={item.title}
        description={
          <Space direction="vertical" size="small">
            <Text>Автор: {item.author_name}</Text>
            <Text type="secondary">Email: {item.author_email}</Text>
            <Text type="secondary">
              Создано: {new Date(item.created_at).toLocaleDateString('ru-RU')}
            </Text>
            {type === 'event' && (
              <Text type="secondary">
                Дата события: {new Date((item as Event).event_date).toLocaleDateString('ru-RU')}
              </Text>
            )}
          </Space>
        }
      />
    </Card>
  );

  const renderContent = (item: Article | Event) => {
    if ('content' in item) {
      // Article
      return (
        <div>
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <Text strong>Автор:</Text> {item.author_name} ({item.author_email})
          </div>
          <Title level={3}>{item.title}</Title>
          {item.cover_image && (
            <div style={{ marginBottom: 16 }}>
              <img 
                src={item.cover_image} 
                alt={item.title}
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }} 
              />
            </div>
          )}
          <div 
            dangerouslySetInnerHTML={{ __html: item.content }}
            style={{
              lineHeight: '1.6',
              fontSize: '16px'
            }}
            className="article-content"
          />
        </div>
      );
    } else {
      // Event
      return (
        <div>
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <Text strong>Автор:</Text> {item.author_name} ({item.author_email})
          </div>
          <Title level={3}>{item.title}</Title>
          {item.cover_image && (
            <div style={{ marginBottom: 16 }}>
              <img 
                src={item.cover_image} 
                alt={item.title}
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }} 
              />
            </div>
          )}
          <div 
            dangerouslySetInnerHTML={{ __html: item.description }}
            style={{
              lineHeight: '1.6',
              fontSize: '16px',
              marginBottom: 16
            }}
            className="article-content"
          />
          <Divider />
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Тип события:</Text> <Tag>{item.event_type}</Tag>
            </Col>
            <Col span={12}>
              <Text strong>Формат:</Text> <Tag color={item.is_online ? 'blue' : 'green'}>
                {item.is_online ? 'Онлайн' : 'Офлайн'}
              </Tag>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={12}>
              <Text strong>Дата события:</Text> {new Date(item.event_date).toLocaleDateString('ru-RU')}
            </Col>
          </Row>
        </div>
      );
    }
  };

  if (user?.userType !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={2}>Доступ запрещен</Title>
        <Text>У вас нет прав для доступа к этой странице.</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Модерация контента</Title>
      
      <Tabs defaultActiveKey="articles">
        <Tabs.TabPane tab={`Статьи (${articles.length})`} key="articles">
          {articles.length === 0 ? (
            <Card>
              <Text>Нет статей на модерацию</Text>
              <br />
              <Text type="secondary">Система модерации будет активна после настройки полей в базе данных</Text>
            </Card>
          ) : (
            <List
              dataSource={articles}
              renderItem={(item) => renderItem(item, 'article')}
            />
          )}
        </Tabs.TabPane>
        
        <Tabs.TabPane tab={`События (${events.length})`} key="events">
          {events.length === 0 ? (
            <Card>
              <Text>Нет событий на модерацию</Text>
              <br />
              <Text type="secondary">Система модерации будет активна после настройки полей в базе данных</Text>
            </Card>
          ) : (
            <List
              dataSource={events}
              renderItem={(item) => renderItem(item, 'event')}
            />
          )}
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="Просмотр контента"
        open={!!selectedItem}
        onCancel={() => setSelectedItem(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedItem(null)}>
            Закрыть
          </Button>
        ]}
        width={1000}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {selectedItem && renderContent(selectedItem)}
      </Modal>

      <Modal
        title="Отклонение контента"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
          setRejectingItem(null);
        }}
        onOk={handleReject}
        okText="Отклонить"
        cancelText="Отмена"
      >
        <Text>Укажите причину отклонения:</Text>
        <TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Опишите причину отклонения..."
          rows={4}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  );
};

export default ModerationPage;
