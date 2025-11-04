import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Input, Select, Typography, Avatar, Tag, Space, Spin, Empty, Button } from 'antd';
import { UserOutlined, EnvironmentOutlined, SearchOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [newExperts, setNewExperts] = useState<Expert[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [newExpertsLoading, setNewExpertsLoading] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [favoriteStatus, setFavoriteStatus] = useState<Record<number, boolean>>({});
  const [newExpertsFavoriteStatus, setNewExpertsFavoriteStatus] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopics();
    fetchCities();
    fetchExperts();
    fetchNewExperts();
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

  const fetchNewExperts = async () => {
    setNewExpertsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '6');
      params.append('order', 'newest');

      const response = await api.get(`/experts/search?${params.toString()}`);
      const newExpertsData = response.data;
      setNewExperts(newExpertsData);
      
      // Загружаем статус избранного для каждого эксперта
      const favoritePromises = newExpertsData.map((expert: Expert) => 
        api.get(`/expert-interactions/${expert.id}/status`)
      );
      
      try {
        const favoriteResponses = await Promise.all(favoritePromises);
        const favoriteStatusMap: Record<number, boolean> = {};
        favoriteResponses.forEach((response, index) => {
          favoriteStatusMap[newExpertsData[index].id] = response.data.favorited;
        });
        setNewExpertsFavoriteStatus(favoriteStatusMap);
      } catch (error) {
        console.error('Ошибка загрузки статуса избранного для новых экспертов:', error);
      }
    } catch (error) {
      console.error('Ошибка загрузки новых экспертов:', error);
    } finally {
      setNewExpertsLoading(false);
    }
  };

  const fetchExperts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const hasFilters = selectedTopics.length > 0 || selectedCity || searchText;
      
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
      
      // Обновляем статус в обоих списках
      setFavoriteStatus(prev => ({
        ...prev,
        [expertId]: response.data.favorited
      }));
      
      setNewExpertsFavoriteStatus(prev => ({
        ...prev,
        [expertId]: response.data.favorited
      }));
    } catch (error) {
      console.error('Ошибка изменения избранного:', error);
    }
  };

  const renderExpertCard = (expert: Expert, isFavorited: boolean) => (
    <Card
      hoverable
      onClick={() => {
        if (user && user.id === expert.id) {
          navigate('/profile');
        } else {
          navigate(`/experts/${expert.id}`);
        }
      }}
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
        icon={isFavorited ? <StarFilled /> : <StarOutlined />}
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
          color: isFavorited ? '#faad14' : '#8c8c8c',
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
              src={expert.avatar_url || '/emp.jpg'}
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
  );

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
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={topics.map(t => ({ label: t.name, value: t.name }))}
            maxTagCount="responsive"
          />
        </Space>
      </Card>

      {loading || newExpertsLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Блок новых экспертов */}
          {newExperts.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <Title level={3} style={{ marginBottom: 24 }}>Новые эксперты</Title>
              <Row gutter={[24, 24]}>
                {newExperts.map((expert) => (
                  <Col xs={24} sm={12} lg={8} key={expert.id}>
                    {renderExpertCard(expert, newExpertsFavoriteStatus[expert.id])}
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* Фильтрованный список экспертов - показываем только если есть фильтры */}
          {(selectedTopics.length > 0 || selectedCity || searchText) && (
            <>
              {experts.length === 0 ? (
                <Empty description="Эксперты не найдены" style={{ padding: 60 }} />
              ) : (
                <Row gutter={[24, 24]}>
                  {experts.map((expert) => (
                    <Col xs={24} sm={12} lg={8} key={expert.id}>
                      {renderExpertCard(expert, favoriteStatus[expert.id])}
                    </Col>
                  ))}
                </Row>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ExpertsPage;
