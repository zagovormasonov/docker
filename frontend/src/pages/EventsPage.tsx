import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, List, Tag, Button, Space, Typography, Empty, Spin, Modal, Checkbox, Select, DatePicker, Divider
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, FilterOutlined, PlusOutlined, 
  GlobalOutlined, HomeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const EVENT_TYPES = [
  'Ретрит',
  'Мастер-класс',
  'Тренинг',
  'Семинар',
  'Сатсанг',
  'Йога и медитация',
  'Фестиваль',
  'Конференция',
  'Выставка',
  'Концерт',
  'Экскурсия',
  'Благотворительное мероприятие'
];

interface Event {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  event_type: string;
  is_online: boolean;
  city_id: number;
  city_name: string;
  event_date: string;
  location: string;
  price: string;
  registration_link: string;
  organizer_id: number;
  organizer_name: string;
  organizer_avatar: string;
  created_at: string;
}

interface City {
  id: number;
  name: string;
}

const EventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Фильтры
  const [selectedOnline, setSelectedOnline] = useState<boolean[]>([true, false]); // По умолчанию оба
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  useEffect(() => {
    fetchCities();
    fetchEvents();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await api.get('/cities');
      setCities(response.data);
    } catch (error) {
      console.error('Ошибка загрузки городов:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params: any = {};

      // Фильтр онлайн/офлайн
      if (selectedOnline.length === 1) {
        params.isOnline = selectedOnline[0];
      }

      // Фильтр по городу
      if (selectedCity) {
        params.cityId = selectedCity;
      }

      // Фильтр по типам
      if (selectedEventTypes.length > 0) {
        params.eventTypes = selectedEventTypes;
      }

      // Фильтр по датам
      if (dateRange[0]) {
        params.dateFrom = dateRange[0].toISOString();
      }
      if (dateRange[1]) {
        params.dateTo = dateRange[1].toISOString();
      }

      const response = await api.get('/events', { params });
      setEvents(response.data);
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setFilterModalVisible(false);
    fetchEvents();
  };

  const handleResetFilters = () => {
    setSelectedOnline([true, false]);
    setSelectedCity(null);
    setSelectedEventTypes([]);
    setDateRange([null, null]);
  };

  const handleOnlineChange = (checkedValues: boolean[]) => {
    setSelectedOnline(checkedValues);
    // Если выбран только онлайн, сбросить фильтр города
    if (checkedValues.length === 1 && checkedValues[0] === true) {
      setSelectedCity(null);
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Ретрит': 'purple',
      'Мастер-класс': 'blue',
      'Тренинг': 'cyan',
      'Семинар': 'green',
      'Сатсанг': 'gold',
      'Йога и медитация': 'magenta',
      'Фестиваль': 'volcano',
      'Конференция': 'orange',
      'Выставка': 'geekblue',
      'Концерт': 'red',
      'Экскурсия': 'lime',
      'Благотворительное мероприятие': 'pink'
    };
    return colors[type] || 'default';
  };

  const isEventToday = (eventDate: string) => {
    return dayjs(eventDate).isSame(dayjs(), 'day');
  };

  const isEventTomorrow = (eventDate: string) => {
    return dayjs(eventDate).isSame(dayjs().add(1, 'day'), 'day');
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
      }}>
        <Title level={2} style={{ margin: 0 }}>События</Title>
        <Space>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterModalVisible(true)}
          >
            Фильтры
          </Button>
          {user?.userType === 'expert' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/events/create')}
            >
              Создать событие
            </Button>
          )}
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : events.length === 0 ? (
        <Empty
          description="Событий не найдено"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 1,
            md: 2,
            lg: 2,
            xl: 3,
            xxl: 3
          }}
          dataSource={events}
          renderItem={(event) => (
            <List.Item>
              <Card
                hoverable
                cover={
                  event.cover_image ? (
                    <div style={{ height: 200, overflow: 'hidden' }}>
                      <img
                        src={event.cover_image}
                        alt={event.title}
                        style={{ width: '100%', height: 200, objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      height: 200,
                      background: 'linear-gradient(135deg, rgb(180 194 255) 0%, rgb(245 236 255) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 64
                    }}>
                      🎉
                    </div>
                  )
                }
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div>
                    <Tag color={getEventTypeColor(event.event_type)}>
                      {event.event_type}
                    </Tag>
                    {isEventToday(event.event_date) && (
                      <Tag color="red">Сегодня</Tag>
                    )}
                    {isEventTomorrow(event.event_date) && (
                      <Tag color="orange">Завтра</Tag>
                    )}
                  </div>

                  <Title level={4} style={{ margin: 0 }}>
                    {event.title}
                  </Title>

                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space size={4}>
                      <CalendarOutlined style={{ color: '#6366f1' }} />
                      <Text strong>
                        {dayjs(event.event_date).format('DD MMMM YYYY, HH:mm')}
                      </Text>
                    </Space>

                    <Space size={4}>
                      {event.is_online ? (
                        <>
                          <GlobalOutlined style={{ color: '#52c41a' }} />
                          <Text type="secondary">Онлайн</Text>
                        </>
                      ) : (
                        <>
                          <EnvironmentOutlined style={{ color: '#1890ff' }} />
                          <Text type="secondary">{event.city_name}</Text>
                        </>
                      )}
                    </Space>

                    {event.price && (
                      <Text strong style={{ color: '#6366f1' }}>
                        {event.price}
                      </Text>
                    )}
                  </Space>

                  <Divider style={{ margin: '8px 0' }} />

                  <Space size={8}>
                    {event.organizer_avatar ? (
                      <img
                        src={event.organizer_avatar}
                        alt={event.organizer_name}
                        style={{ width: 24, height: 24, borderRadius: '50%' }}
                      />
                    ) : (
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 12
                      }}>
                        {event.organizer_name[0]}
                      </div>
                    )}
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {event.organizer_name}
                    </Text>
                  </Space>
                </Space>
              </Card>
            </List.Item>
          )}
        />
      )}

      {/* Модальное окно фильтров */}
      <Modal
        title="Фильтры событий"
        open={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        footer={[
          <Button key="reset" onClick={handleResetFilters}>
            Сбросить
          </Button>,
          <Button key="apply" type="primary" onClick={handleApplyFilters}>
            Применить
          </Button>
        ]}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Text strong>Формат:</Text>
            <div style={{ marginTop: 8 }}>
              <Checkbox
                checked={selectedOnline.includes(true)}
                onChange={(e) => {
                  const newValue = e.target.checked
                    ? [...selectedOnline.filter(v => v === false), true]
                    : selectedOnline.filter(v => v !== true);
                  handleOnlineChange(newValue);
                }}
              >
                <GlobalOutlined /> Онлайн
              </Checkbox>
              <br />
              <Checkbox
                checked={selectedOnline.includes(false)}
                onChange={(e) => {
                  const newValue = e.target.checked
                    ? [...selectedOnline.filter(v => v === true), false]
                    : selectedOnline.filter(v => v !== false);
                  setSelectedOnline(newValue);
                }}
              >
                <HomeOutlined /> Офлайн
              </Checkbox>
            </div>
          </div>

          {/* Показываем фильтр города только если выбран офлайн */}
          {selectedOnline.includes(false) && (
            <div>
              <Text strong>Город:</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Выберите город"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                value={selectedCity}
                onChange={setSelectedCity}
                options={cities.map(city => ({
                  value: city.id,
                  label: city.name
                }))}
              />
            </div>
          )}

          <div>
            <Text strong>Тип мероприятия:</Text>
            <Select
              mode="multiple"
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Выберите типы"
              value={selectedEventTypes}
              onChange={setSelectedEventTypes}
              options={EVENT_TYPES.map(type => ({
                value: type,
                label: type
              }))}
            />
          </div>

          <div>
            <Text strong>Период:</Text>
            <RangePicker
              style={{ width: '100%', marginTop: 8 }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as any)}
              format="DD.MM.YYYY"
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default EventsPage;

