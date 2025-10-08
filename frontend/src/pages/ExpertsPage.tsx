import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Input, Select, Typography, Avatar, Tag, Space, Spin, Empty, Button } from 'antd';
import { UserOutlined, EnvironmentOutlined, SearchOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import api from '../api/axios';

const { Title, Text } = Typography;
const { Meta } = Card;

interface Topic {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface Expert {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  topics: string[];
}

const ExpertsPage = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [favoriteStatus, setFavoriteStatus] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopics();
    fetchCities();
    fetchExperts();
  }, []);

  useEffect(() => {
    fetchExperts();
  }, [selectedTopics, selectedCity, searchText]);

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data);
    } catch (error) {
      console.error('Ошибка загрузки тематик:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await api.get('/cities');
      setCities(response.data);
    } catch (error) {
      console.error('Ошибка загрузки городов:', error);
    }
  };

  const fetchExperts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTopics.length > 0) {
        params.append('topics', selectedTopics.join(','));
      }
      if (selectedCity) {
        params.append('city', selectedCity);
      }
      if (searchText) {
        params.append('search', searchText);
      }

      const response = await api.get(`/experts/search?${params.toString()}`);
      const expertsData = response.data;
      setExperts(expertsData);
      
      // Загружаем статус избранного для каждого эксперта
      const favoritePromises = expertsData.map((expert: Expert) => 
        api.get(`/expert-interactions/${expert.id}/status`)
      );
      
      try {
        const favoriteResponses = await Promise.all(favoritePromises);
        const favoriteStatusMap: Record<number, boolean> = {};
        favoriteResponses.forEach((response, index) => {
          favoriteStatusMap[expertsData[index].id] = response.data.favorited;
        });
        setFavoriteStatus(favoriteStatusMap);
      } catch (error) {
        console.error('Ошибка загрузки статуса избранного:', error);
      }
    } catch (error) {
      console.error('Ошибка загрузки экспертов:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (expertId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.post(`/expert-interactions/${expertId}/favorite`);
      setFavoriteStatus(prev => ({
        ...prev,
        [expertId]: response.data.favorited
      }));
    } catch (error) {
      console.error('Ошибка изменения избранного:', error);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <Title level={2} className="page-title">Эксперты</Title>
        <Text className="page-subtitle">Найдите своего духовного наставника</Text>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            size="large"
            placeholder="Поиск по имени или описанию"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />

          <Select
            size="large"
            placeholder="Выберите город"
            prefix={<EnvironmentOutlined />}
            style={{ width: '100%' }}
            value={selectedCity || undefined}
            onChange={setSelectedCity}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={[
              { label: 'Все города', value: '' },
              ...cities.map(c => ({ label: c.name, value: c.name }))
            ]}
            allowClear
          />

          <Select
            mode="multiple"
            size="large"
            placeholder="Выберите тематики"
            style={{ width: '100%' }}
            value={selectedTopics}
            onChange={setSelectedTopics}
            options={topics.map(t => ({ label: t.name, value: t.name }))}
            maxTagCount="responsive"
          />
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : experts.length === 0 ? (
        <Empty description="Эксперты не найдены" style={{ padding: 60 }} />
      ) : (
        <Row gutter={[24, 24]}>
          {experts.map((expert) => (
            <Col xs={24} sm={12} lg={8} key={expert.id}>
              <Card
                hoverable
                onClick={() => navigate(`/experts/${expert.id}`)}
                style={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
                bodyStyle={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Button
                  type="text"
                  icon={favoriteStatus[expert.id] ? <StarFilled /> : <StarOutlined />}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(expert.id, e);
                  }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 10,
                    color: favoriteStatus[expert.id] ? '#faad14' : '#8c8c8c',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Meta
                    avatar={
                      <Avatar
                        size={64}
                        src={expert.avatar_url}
                        icon={!expert.avatar_url && <UserOutlined />}
                        style={{ backgroundColor: '#6366f1' }}
                      />
                    }
                    title={
                      <Space direction="vertical" size={4}>
                        <Title level={4} style={{ margin: 0 }}>{expert.name}</Title>
                        {expert.city && (
                          <Text type="secondary">
                            <EnvironmentOutlined /> {expert.city}
                          </Text>
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={12} style={{ width: '100%', marginTop: 12, flex: 1 }}>
                        {expert.bio && (
                          <Text 
                            type="secondary" 
                            style={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: '1.4',
                              height: '2.8em'
                            }}
                            title={expert.bio}
                          >
                            {expert.bio}
                          </Text>
                        )}
                        
                        {expert.topics && expert.topics.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto' }}>
                            {expert.topics.slice(0, 2).map((topic, index) => (
                              <Tag key={index} color="purple">{topic}</Tag>
                            ))}
                            {expert.topics.length > 2 && (
                              <Tag>+{expert.topics.length - 2}</Tag>
                            )}
                          </div>
                        )}
                      </Space>
                    }
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default ExpertsPage;
