import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Avatar,
  Typography,
  Space,
  Tag,
  Button,
  List,
  Divider,
  Spin,
  message
} from 'antd';
import {
  UserOutlined,
  EnvironmentOutlined,
  MessageOutlined,
  DollarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

interface Service {
  id: number;
  title: string;
  description: string;
  price?: number;
  duration?: number;
  service_type: string;
}

interface ExpertProfile {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  topics: Array<{ id: number; name: string }>;
  services: Service[];
  created_at: string;
}

const ExpertProfilePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpert();
  }, [id]);

  const fetchExpert = async () => {
    try {
      const response = await api.get(`/experts/${id}`);
      setExpert(response.data);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      message.error('Ошибка загрузки профиля эксперта');
    } finally {
      setLoading(false);
    }
  };

  const handleContactExpert = async () => {
    if (!user) {
      message.warning('Необходимо войти в систему');
      navigate('/login');
      return;
    }

    try {
      const response = await api.post('/chats/create', { otherUserId: expert?.id });
      navigate(`/chats/${response.data.id}`);
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      message.error('Ошибка создания чата');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!expert) {
    return <div className="container">Эксперт не найден</div>;
  }

  return (
    <div className="container">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space align="start" size="large">
            <Avatar
              size={120}
              src={expert.avatar_url}
              icon={!expert.avatar_url && <UserOutlined />}
              style={{ backgroundColor: '#6366f1' }}
            />

            <div style={{ flex: 1 }}>
              <Title level={2} style={{ marginBottom: 8 }}>{expert.name}</Title>
              
              {expert.city && (
                <Space style={{ marginBottom: 16 }}>
                  <EnvironmentOutlined />
                  <Text type="secondary">{expert.city}</Text>
                </Space>
              )}

              {expert.bio && (
                <Paragraph style={{ fontSize: 16, color: '#86868b' }}>
                  {expert.bio}
                </Paragraph>
              )}

              <Button
                type="primary"
                size="large"
                icon={<MessageOutlined />}
                onClick={handleContactExpert}
              >
                Связаться с экспертом
              </Button>
            </div>
          </Space>

          {expert.topics && expert.topics.length > 0 && (
            <>
              <Divider />
              <div>
                <Title level={4}>Тематики</Title>
                <Space wrap>
                  {expert.topics.map((topic) => (
                    <Tag key={topic.id} color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>
                      {topic.name}
                    </Tag>
                  ))}
                </Space>
              </div>
            </>
          )}

          {expert.services && expert.services.length > 0 && (
            <>
              <Divider />
              <div>
                <Title level={4}>Услуги</Title>
                <List
                  dataSource={expert.services}
                  renderItem={(service) => (
                    <List.Item>
                      <Card style={{ width: '100%' }} size="small">
                        <Title level={5}>{service.title}</Title>
                        <Paragraph type="secondary">{service.description}</Paragraph>
                        
                        <Space split="•">
                          {service.price && (
                            <Space>
                              <DollarOutlined />
                              <Text>{service.price} ₽</Text>
                            </Space>
                          )}
                          {service.duration && (
                            <Space>
                              <ClockCircleOutlined />
                              <Text>{service.duration} мин</Text>
                            </Space>
                          )}
                          <Tag color={
                            service.service_type === 'online' ? 'blue' :
                            service.service_type === 'offline' ? 'green' : 'purple'
                          }>
                            {service.service_type === 'online' ? 'Онлайн' :
                             service.service_type === 'offline' ? 'Офлайн' : 'Онлайн/Офлайн'}
                          </Tag>
                        </Space>
                      </Card>
                    </List.Item>
                  )}
                />
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default ExpertProfilePage;
