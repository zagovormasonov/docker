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
  Avatar,
  Row,
  Col
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  UserOutlined
} from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import ThemeSwitch from '../components/ThemeSwitch';
import '../styles/dark-theme.css';
import './ModerationPage.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Article {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_email: string;
  created_at: string;
  updated_at: string;
  cover_image?: string;
}

const ModerationPage = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Article | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingItem, setRejectingItem] = useState<Article | null>(null);

  useEffect(() => {
    if (user?.userType === 'admin') {
      fetchPendingItems();
    }
  }, [user]);

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const articlesRes = await api.get('/moderation/articles');
      setArticles(articlesRes.data || []);
    } catch (error) {
      console.error('Ошибка загрузки элементов на модерацию:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: Article) => {
    try {
      await api.post(`/moderation/articles/${item.id}/approve`);
      message.success('Статья одобрена');
      fetchPendingItems();
    } catch (error) {
      console.error('Ошибка одобрения статьи:', error);
      message.error('Ошибка одобрения');
    }
  };

  const handleReject = async () => {
    if (!rejectingItem || !rejectReason.trim()) {
      message.error('Укажите причину отклонения');
      return;
    }

    try {
      await api.post(`/moderation/articles/${rejectingItem.id}/reject`, {
        reason: rejectReason
      });

      message.success('Статья отклонена');
      setRejectModalVisible(false);
      setRejectReason('');
      setRejectingItem(null);
      fetchPendingItems();
    } catch (error) {
      console.error('Ошибка отклонения:', error);
      message.error('Ошибка отклонения');
    }
  };

  const openRejectModal = (item: Article) => {
    setRejectingItem(item);
    setRejectModalVisible(true);
  };

  const renderItem = (item: Article) => (
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
          onClick={() => handleApprove(item)}
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
          </Space>
        }
      />
    </Card>
  );

  const renderContent = (item: Article) => (
    <div>
      <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Text strong>Автор:</Text> {item.author_name} ({item.author_email})
          </Col>
          <Col span={12}>
            <Text strong>ID:</Text> {item.id}
          </Col>
          <Col span={12}>
            <Text strong>Создано:</Text> {new Date(item.created_at).toLocaleString('ru-RU')}
          </Col>
          <Col span={12}>
            <Text strong>Обновлено:</Text> {new Date(item.updated_at).toLocaleString('ru-RU')}
          </Col>
        </Row>
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

  if (user?.userType !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={2}>Доступ запрещен</Title>
        <Text>У вас нет прав для доступа к этой странице.</Text>
      </div>
    );
  }

  const { isDark, toggleTheme } = useTheme();

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>Модерация статей</Title>
        <ThemeSwitch isDark={isDark} onChange={toggleTheme} />
      </div>

      {articles.length === 0 ? (
        <Card>
          <Text>Нет статей на модерацию</Text>
          <br />
          <Text type="secondary">Система модерации будет активна после настройки полей в базе данных</Text>
        </Card>
      ) : (
        <List
          loading={loading}
          dataSource={articles}
          renderItem={(item) => renderItem(item)}
        />
      )}

      <Modal
        title="Просмотр контента"
        open={!!selectedItem}
        onCancel={() => setSelectedItem(null)}
        afterClose={() => {
          document.body.style.overflow = 'auto';
        }}
        destroyOnClose={true}
        maskClosable={true}
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
        afterClose={() => {
          document.body.style.overflow = 'auto';
        }}
        destroyOnClose={true}
        maskClosable={true}
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
