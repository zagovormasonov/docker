import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Input, Select, Typography, Avatar, Tag, Space, Spin, Empty } from 'antd';
import { UserOutlined, EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
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
      setExperts(response.data);
    } catch (error) {
      console.error('Ошибка загрузки экспертов:', error);
    } finally {
      setLoading(false);
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
              >
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
                    <Space direction="vertical" size={12} style={{ width: '100%', marginTop: 12 }}>
                      {expert.bio && (
                        <Text type="secondary" ellipsis={{ tooltip: expert.bio }}>
                          {expert.bio}
                        </Text>
                      )}
                      
                      {expert.topics && expert.topics.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {expert.topics.slice(0, 3).map((topic, index) => (
                            <Tag key={index} color="purple">{topic}</Tag>
                          ))}
                          {expert.topics.length > 3 && (
                            <Tag>+{expert.topics.length - 3}</Tag>
                          )}
                        </div>
                      )}
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default ExpertsPage;
