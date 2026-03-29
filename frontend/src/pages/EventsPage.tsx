import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  'Благотворительное мероприятие',
  'Ярмарка'
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [favoriteStatus, setFavoriteStatus] = useState<Record<number, boolean>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        params.eventTypes = selectedEventTypes.join(',');
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

  // Read filters from search params on mount and when searchParams change
  useEffect(() => {
    const online = searchParams.get('online');
    const offline = searchParams.get('offline');
    const city = searchParams.get('cityId');
    const types = searchParams.get('types');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (online || offline) {
      const newOnline: boolean[] = [];
      if (online === 'true') newOnline.push(true);
      if (offline === 'true') newOnline.push(false);
      setSelectedOnline(newOnline);
    } else {
      // If no params, default to both online and offline
      setSelectedOnline([true, false]);
    }

    if (city) {
      setSelectedCity(Number(city));
    } else {
      setSelectedCity(null);
    }

    if (types) {
      setSelectedEventTypes(types.split(','));
    } else {
      setSelectedEventTypes([]);
    }

    if (from || to) {
      setDateRange([
        from ? dayjs(from) : null,
        to ? dayjs(to) : null
      ]);
    } else {
      setDateRange([null, null]);
    }
  }, [searchParams]);

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


  // Мемоизированная функция проверки, является ли событие сегодня
  const isEventToday = useCallback((eventDate: string) => {
    return dayjs(eventDate).isSame(dayjs(), 'day');
  }, []);

  // Мемоизированная функция проверки, является ли событие завтра
  const isEventTomorrow = useCallback((eventDate: string) => {
    return dayjs(eventDate).isSame(dayjs().add(1, 'day'), 'day');
  }, []);

  return (
    <>
    <div className="container">
      <div className="page-header" style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'flex-end',
        gap: 16
      }}>
        <div>
          <Title level={2} className="page-title">События</Title>
          <Text className="page-subtitle">Найдите интересные мероприятия</Text>
        </div>
        
        <Space direction={isMobile ? 'vertical' : 'horizontal'} size="middle" style={{ width: isMobile ? '100%' : 'auto' }}>
          <Button
            size="large"
            icon={<FilterOutlined />}
            onClick={() => {
              if (isMobile) {
                navigate(`/events/filters${location.search}`);
              } else {
                setFilterModalVisible(true);
              }
            }}
            style={{ width: isMobile ? '100%' : 'auto', borderRadius: 20 }}
          >
            Фильтры
          </Button>
          {(user?.userType === 'expert' || user?.userType === 'admin') && (
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => navigate('/events/create')}
              style={{ width: isMobile ? '100%' : 'auto', borderRadius: 20 }}
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
            <List.Item style={{ height: '100%', display: 'flex' }}>
              <Card
                hoverable
                style={{ 
                  height: '100%', 
                  width: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRadius: 32, 
                  border: 'none',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                  overflow: 'hidden',
                  background: '#ffffff'
                }}
                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 28px' }}
                cover={
                  <div style={{ paddingBottom: '100%', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={event.cover_image || '/eve.jpg'}
                      alt={event.title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                      <Button
                        type="text"
                        icon={favoriteStatus[event.id] ? <StarFilled /> : <StarOutlined />}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(event.id, e);
                        }}
                        style={{
                          color: favoriteStatus[event.id] ? '#faad14' : '#8c8c8c',
                          border: 'none',
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '50%',
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                        }}
                      />
                    </div>
                  </div>
                }
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <Space direction="vertical" size={14} style={{ width: '100%', flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <Tag style={{ 
                      borderRadius: 16, 
                      border: 'none', 
                      background: '#f4f5f9', 
                      color: '#6366f1', 
                      fontSize: 12,
                      fontWeight: 500,
                      padding: '4px 12px',
                      margin: 0
                    }}>
                      {event.event_type}
                    </Tag>
                    {isEventToday(event.event_date) && (
                      <Tag style={{ 
                        borderRadius: 16, 
                        border: 'none', 
                        background: '#fff1f0', 
                        color: '#ff4d4f', 
                        fontSize: 12,
                        fontWeight: 500,
                        padding: '4px 12px',
                        margin: 0
                      }}>Сегодня</Tag>
                    )}
                    {isEventTomorrow(event.event_date) && (
                      <Tag style={{ 
                        borderRadius: 16, 
                        border: 'none', 
                        background: '#fff7e6', 
                        color: '#fa8c16', 
                        fontSize: 12,
                        fontWeight: 500,
                        padding: '4px 12px',
                        margin: 0
                      }}>Завтра</Tag>
                    )}
                  </div>

                  <Title level={4} style={{ margin: '0', fontSize: 20, fontWeight: 700, color: '#1d1d1f', lineHeight: 1.3 }} ellipsis={{ rows: 2 }}>
                    {event.title}
                  </Title>

                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space size={8}>
                      <CalendarOutlined style={{ color: '#a1a1aa' }} />
                      <Text style={{ color: '#52525b', fontSize: 14 }}>
                        {dayjs(event.event_date).format('DD MMM YYYY, HH:mm')}
                      </Text>
                    </Space>

                    <Space size={8}>
                      {event.is_online ? (
                        <>
                          <GlobalOutlined style={{ color: '#10b981' }} />
                          <Text style={{ color: '#52525b', fontSize: 14 }}>Открытый онлайн</Text>
                        </>
                      ) : (
                        <>
                          <EnvironmentOutlined style={{ color: '#3b82f6' }} />
                          <Text style={{ color: '#52525b', fontSize: 14 }}>{event.city_name}</Text>
                        </>
                      )}
                    </Space>

                    {event.price && (
                      <Text strong style={{ color: '#1d1d1f', fontSize: 16, marginTop: 4, display: 'block' }}>
                        {event.price}
                      </Text>
                    )}
                  </Space>

                  <div style={{ marginTop: 'auto', paddingTop: 20 }}>
                    <Space size={12} align="center">
                      <div style={{ flexShrink: 0 }}>
                        {event.organizer_avatar ? (
                          <img
                            src={event.organizer_avatar}
                            alt={event.organizer_name}
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#f4f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6366f1',
                            fontSize: 13,
                            fontWeight: 600
                          }}>
                            {event.organizer_name[0]}
                          </div>
                        )}
                      </div>
                      <Text style={{ fontSize: 14, color: '#71717a', fontWeight: 500 }} ellipsis>
                        {event.organizer_name}
                      </Text>
                    </Space>
                  </div>
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
    </>
  );
};

export default EventsPage;

