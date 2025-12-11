import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, List, Tag, Button, Space, Typography, Empty, Spin, Modal, Checkbox, Select, DatePicker, Divider
} from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, FilterOutlined, PlusOutlined, 
  GlobalOutlined, HomeOutlined, StarOutlined, StarFilled
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
  const [favoriteStatus, setFavoriteStatus] = useState<Record<number, boolean>>({});

  // Фильтры
  const [selectedOnline, setSelectedOnline] = useState<boolean[]>([true, false]); // По умолчанию оба
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  // Мемоизированная функция загрузки городов
  const fetchCities = useCallback(async () => {
    try {
      const response = await api.get('/cities');
      setCities(response.data);
    } catch (error) {
      console.error('Ошибка загрузки городов:', error);
    }
  }, []);

  // Мемоизированная функция загрузки событий
  const fetchEvents = useCallback(async () => {
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
      const eventsData = response.data;
      setEvents(eventsData);
      
      // Загружаем статус избранного для каждого события
      if (eventsData.length > 0) {
        const favoritePromises = eventsData.map((event: Event) => 
          api.get(`/event-interactions/${event.id}/status`).catch(() => ({ data: { favorited: false } }))
        );
        
        try {
          const favoriteResponses = await Promise.all(favoritePromises);
          const favoriteStatusMap: Record<number, boolean> = {};
          favoriteResponses.forEach((response, index) => {
            favoriteStatusMap[eventsData[index].id] = response.data.favorited;
          });
          setFavoriteStatus(favoriteStatusMap);
        } catch (error) {
          console.error('Ошибка загрузки статуса избранного:', error);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedOnline, selectedCity, selectedEventTypes, dateRange]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Мемоизированная функция переключения избранного
  const toggleFavorite = useCallback(async (eventId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.post(`/event-interactions/${eventId}/favorite`);
      setFavoriteStatus(prev => ({
        ...prev,
        [eventId]: response.data.favorited
      }));
    } catch (error) {
      console.error('Ошибка изменения избранного:', error);
    }
  }, []);

  // Мемоизированная функция применения фильтров
  const handleApplyFilters = useCallback(() => {
    setFilterModalVisible(false);
    fetchEvents();
  }, [fetchEvents]);

  // Мемоизированная функция сброса фильтров
  const handleResetFilters = useCallback(() => {
    setSelectedOnline([true, false]);
    setSelectedCity(null);
    setSelectedEventTypes([]);
    setDateRange([null, null]);
  }, []);

  // Мемоизированная функция изменения формата (онлайн/офлайн)
  const handleOnlineChange = useCallback((checkedValues: boolean[]) => {
    setSelectedOnline(checkedValues);
    // Если выбран только онлайн, сбросить фильтр города
    if (checkedValues.length === 1 && checkedValues[0] === true) {
      setSelectedCity(null);
    }
  }, []);

  // Мемоизированная функция получения цвета для типа события
  const getEventTypeColor = useCallback((type: string) => {
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
  }, []);

  // Мемоизированная функция проверки, является ли событие сегодня
  const isEventToday = useCallback((eventDate: string) => {
    return dayjs(eventDate).isSame(dayjs(), 'day');
  }, []);

  // Мемоизированная функция проверки, является ли событие завтра
  const isEventTomorrow = useCallback((eventDate: string) => {
    return dayjs(eventDate).isSame(dayjs().add(1, 'day'), 'day');
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginBottom: 24
      }}>
        <Title level={2} style={{ margin: 0 }}>События</Title>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterModalVisible(true)}
            style={{ width: '100%' }}
          >
            Фильтры
          </Button>
          {(user?.userType === 'expert' || user?.userType === 'admin') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/events/create')}
              style={{ width: '100%' }}
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
                  <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={event.cover_image || '/eve.jpg'}
                      alt={event.title}
                      style={{ width: '100%', height: 200, objectFit: 'cover' }}
                    />
                    <Button
                      type="text"
                      icon={favoriteStatus[event.id] ? <StarFilled /> : <StarOutlined />}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(event.id, e);
                      }}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        color: favoriteStatus[event.id] ? '#faad14' : '#8c8c8c',
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
                  </div>
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
        afterClose={() => {
          // Возвращаем фокус на страницу после закрытия модального окна
          document.body.style.overflow = 'auto';
        }}
        destroyOnClose={true}
        maskClosable={true}
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

