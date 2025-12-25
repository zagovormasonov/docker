import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Input, Select, Typography, Tag, Space, Spin, Empty, Button } from 'antd';
import { UserOutlined, EnvironmentOutlined, SearchOutlined, StarOutlined, StarFilled, CloseOutlined, CheckOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import LazyAvatar from '../components/LazyAvatar';

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
  slug?: string;
  topics: string[];
}

type MobileSelectType = 'city' | 'topics';

interface MobileSelectOption {
  label: string;
  value: string;
}

const ExpertsPage = () => {
  const { user } = useAuth();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [newExperts, setNewExperts] = useState<Expert[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [newExpertsLoading, setNewExpertsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [favoriteStatus, setFavoriteStatus] = useState<Record<number, boolean>>({});
  const [newExpertsFavoriteStatus, setNewExpertsFavoriteStatus] = useState<Record<number, boolean>>({});
  const [newExpertsOffset, setNewExpertsOffset] = useState(6);
  const [hasMoreExperts, setHasMoreExperts] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(12); // Ограничение отображения
  const searchTimeoutRef = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileSelectType, setMobileSelectType] = useState<MobileSelectType | null>(null);
  const [mobileSelectSearch, setMobileSelectSearch] = useState('');
  const [mobileSelectClosing, setMobileSelectClosing] = useState(false);
  const originalBodyOverflow = useRef<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Debounce для поискового запроса (500ms)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText]);

  // Мемоизированная функция загрузки тематик
  const fetchTopics = useCallback(async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data);
    } catch (error) {
      console.error('Ошибка загрузки тематик:', error);
    }
  }, []);

  // Мемоизированная функция загрузки городов
  const fetchCities = useCallback(async () => {
    try {
      const response = await api.get('/cities');
      setCities(response.data);
    } catch (error) {
      console.error('Ошибка загрузки городов:', error);
    }
  }, []);

  // Мемоизированная функция загрузки новых экспертов
  const fetchNewExperts = useCallback(async () => {
    setNewExpertsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '6');
      params.append('order', 'newest');

      const response = await api.get(`/experts/search?${params.toString()}`);
      const newExpertsData = response.data;
      setNewExperts(newExpertsData);
      
      // Проверяем, есть ли еще эксперты
      setHasMoreExperts(newExpertsData.length === 6);
      
      // Ленивая загрузка статуса избранного - загружаем только первые 6
      if (newExpertsData.length > 0 && user) {
        // Загружаем статус только для первых 6 видимых экспертов
        const visibleExperts = newExpertsData.slice(0, 6);
        const favoritePromises = visibleExperts.map((expert: Expert) => 
          api.get(`/expert-interactions/${expert.id}/status`)
            .catch(() => ({ data: { favorited: false } }))
        );
        
        try {
          const favoriteResponses = await Promise.all(favoritePromises);
          const favoriteStatusMap: Record<number, boolean> = {};
          favoriteResponses.forEach((response, index) => {
            favoriteStatusMap[visibleExperts[index].id] = response.data.favorited;
          });
          setNewExpertsFavoriteStatus(favoriteStatusMap);
        } catch (error) {
          console.error('Ошибка загрузки статуса избранного для новых экспертов:', error);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки новых экспертов:', error);
    } finally {
      setNewExpertsLoading(false);
    }
  }, [user]);

  // Мемоизированная функция загрузки дополнительных экспертов
  const loadMoreExperts = useCallback(async () => {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '6');
      params.append('offset', newExpertsOffset.toString());
      params.append('order', 'newest');

      const response = await api.get(`/experts/search?${params.toString()}`);
      const moreExpertsData = response.data;
      
      // Добавляем новых экспертов к существующим, исключая дубликаты
      setNewExperts(prev => {
        const existingIds = new Set(prev.map(expert => expert.id));
        const uniqueNewExperts = moreExpertsData.filter((expert: Expert) => !existingIds.has(expert.id));
        return [...prev, ...uniqueNewExperts];
      });
      
      // Обновляем offset
      setNewExpertsOffset(prev => prev + 6);
      
      // Проверяем, есть ли еще эксперты
      setHasMoreExperts(moreExpertsData.length === 6);
      
      // Ленивая загрузка статуса избранного
      if (moreExpertsData.length > 0 && user) {
        const favoritePromises = moreExpertsData.map((expert: Expert) => 
          api.get(`/expert-interactions/${expert.id}/status`)
            .catch(() => ({ data: { favorited: false } }))
        );
        
        try {
          const favoriteResponses = await Promise.all(favoritePromises);
          const favoriteStatusMap: Record<number, boolean> = {};
          favoriteResponses.forEach((response, index) => {
            favoriteStatusMap[moreExpertsData[index].id] = response.data.favorited;
          });
          setNewExpertsFavoriteStatus(prev => ({
            ...prev,
            ...favoriteStatusMap
          }));
        } catch (error) {
          console.error('Ошибка загрузки статуса избранного:', error);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки дополнительных экспертов:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [newExpertsOffset, user]);

  // Мемоизированная функция загрузки экспертов с фильтрацией
  const fetchExperts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (selectedTopics.length > 0) {
        params.append('topics', selectedTopics.join(','));
      }
      if (selectedCity) {
        params.append('city', selectedCity);
      }
      if (debouncedSearchText) {
        params.append('search', debouncedSearchText);
      }

      const response = await api.get(`/experts/search?${params.toString()}`);
      const expertsData = response.data;
      setExperts(expertsData);
      
      // Ленивая загрузка статуса избранного - загружаем только для первых 12 видимых
      if (expertsData.length > 0 && user) {
        const visibleExperts = expertsData.slice(0, 12);
        const favoritePromises = visibleExperts.map((expert: Expert) => 
          api.get(`/expert-interactions/${expert.id}/status`)
            .catch(() => ({ data: { favorited: false } }))
        );
        
        try {
          const favoriteResponses = await Promise.all(favoritePromises);
          const favoriteStatusMap: Record<number, boolean> = {};
          favoriteResponses.forEach((response, index) => {
            favoriteStatusMap[visibleExperts[index].id] = response.data.favorited;
          });
          setFavoriteStatus(favoriteStatusMap);
        } catch (error) {
          console.error('Ошибка загрузки статуса избранного:', error);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки экспертов:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTopics, selectedCity, debouncedSearchText, user]);

  // Мемоизированная функция переключения избранного
  const toggleFavorite = useCallback(async (expertId: number, e: React.MouseEvent) => {
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
  }, []);

  // Функция для показа большего количества экспертов
  const loadMoreFilteredExperts = useCallback(() => {
    setDisplayLimit(prev => prev + 12);
  }, []);

  // useEffect для начальной загрузки данных
  useEffect(() => {
    fetchTopics();
    fetchCities();
    fetchNewExperts();
  }, [fetchTopics, fetchCities, fetchNewExperts]);

  // useEffect для загрузки экспертов при изменении фильтров
  useEffect(() => {
    fetchExperts();
    setDisplayLimit(12); // Сбрасываем лимит при новом поиске
  }, [fetchExperts]);

  // Мемоизированная функция рендера карточки эксперта
  const renderExpertCard = useCallback((expert: Expert, isFavorited: boolean) => (
    <Card
      hoverable
      onClick={() => {
        if (user && user.id === expert.id) {
          navigate('/profile');
        } else {
          // Используем slug, если доступен, иначе ID
          const identifier = expert.slug || expert.id;
          navigate(`/experts/${identifier}`);
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
            <LazyAvatar
              size={64}
              src={expert.avatar_url}
              defaultSrc="/emp.jpg"
              icon={<UserOutlined />}
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
  ), [user, navigate, toggleFavorite]);

  const selectedCityLabel = selectedCity || 'Все города';
  const selectedTopicsLabel = selectedTopics.length ? selectedTopics.join(', ') : '';
  const isMobileSelectOpen = isMobile && mobileSelectType !== null;

  useEffect(() => {
    if (!isMobile) {
      if (originalBodyOverflow.current !== null) {
        document.body.style.overflow = originalBodyOverflow.current;
        originalBodyOverflow.current = null;
      }
      return;
    }

    if (isMobileSelectOpen) {
      if (originalBodyOverflow.current === null) {
        originalBodyOverflow.current = document.body.style.overflow;
      }
      document.body.style.overflow = 'hidden';
    } else if (originalBodyOverflow.current !== null) {
      document.body.style.overflow = originalBodyOverflow.current;
      originalBodyOverflow.current = null;
    }

    return () => {
      if (originalBodyOverflow.current !== null) {
        document.body.style.overflow = originalBodyOverflow.current;
        originalBodyOverflow.current = null;
      }
    };
  }, [isMobile, isMobileSelectOpen]);

  const openMobileSelect = (type: MobileSelectType) => {
    setMobileSelectClosing(false);
    setMobileSelectType(type);
    setMobileSelectSearch('');
  };

  const closeMobileSelect = () => {
    if (!mobileSelectType || mobileSelectClosing) {
      return;
    }
    setMobileSelectClosing(true);
    setTimeout(() => {
      setMobileSelectType(null);
      setMobileSelectClosing(false);
      setMobileSelectSearch('');
    }, 250);
  };

  const handleMobileOptionClick = (value: string) => {
    if (!mobileSelectType) return;

    if (mobileSelectType === 'city') {
      setSelectedCity(value);
      closeMobileSelect();
      return;
    }

    const exists = selectedTopics.includes(value);
    setSelectedTopics((prev) =>
      exists ? prev.filter((topic) => topic !== value) : [...prev, value]
    );
  };

  const mobileSelectConfig = useMemo<{
    title: string;
    multiple: boolean;
    searchPlaceholder: string;
    options: MobileSelectOption[];
    selectedValues: string[];
  } | null>(() => {
    if (!mobileSelectType) {
      return null;
    }

    if (mobileSelectType === 'city') {
      return {
        title: 'Выберите город',
        multiple: false,
        searchPlaceholder: 'Поиск города',
        options: [
          { label: 'Все города', value: '' },
          ...cities.map((city) => ({ label: city.name, value: city.name }))
        ],
        selectedValues: selectedCity ? [selectedCity] : ['']
      };
    }

    return {
      title: 'Выберите тематики',
      multiple: true,
      searchPlaceholder: 'Поиск тематики',
      options: topics.map((topic) => ({ label: topic.name, value: topic.name })),
      selectedValues: selectedTopics
    };
  }, [mobileSelectType, cities, topics, selectedCity, selectedTopics]);

  const renderMobileSelectOverlay = () => {
    if (!isMobile || !mobileSelectConfig || typeof document === 'undefined') {
      return null;
    }

    const searchValue = mobileSelectSearch.trim().toLowerCase();
    const filteredOptions = mobileSelectConfig.options.filter((option) =>
      option.label.toLowerCase().includes(searchValue)
    );

    return createPortal(
      <div className={`mobile-select-overlay ${mobileSelectClosing ? 'closing' : ''}`} onClick={closeMobileSelect}>
        <div className={`mobile-select-panel ${mobileSelectClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="mobile-select-header">
            <button type="button" className="mobile-select-close" onClick={closeMobileSelect}>
              <CloseOutlined />
            </button>
            <span className="mobile-select-title">{mobileSelectConfig.title}</span>
            <button type="button" className="mobile-select-ready" onClick={closeMobileSelect}>
              Готово
            </button>
          </div>
          <Input
            size="large"
            prefix={<SearchOutlined />}
            placeholder={mobileSelectConfig.searchPlaceholder}
            value={mobileSelectSearch}
            onChange={(e) => setMobileSelectSearch(e.target.value)}
            allowClear
            className="mobile-select-search"
          />
          <div className="mobile-select-options">
            {filteredOptions.map((option) => {
              const selected = mobileSelectConfig.selectedValues.some(
                (value) => String(value) === String(option.value)
              );
              return (
                <button
                  type="button"
                  key={option.value}
                  className={`mobile-select-option ${selected ? 'selected' : ''} ${mobileSelectConfig.multiple ? 'multi' : ''}`}
                  onClick={() => handleMobileOptionClick(option.value)}
                >
                  {mobileSelectConfig.multiple && (
                    <span className={`mobile-select-checkbox ${selected ? 'checked' : ''}`}>
                      {selected && <CheckOutlined />}
                    </span>
                  )}
                  <span className="mobile-select-label">{option.label}</span>
                </button>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="mobile-select-empty">Ничего не найдено</div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
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

          {isMobile ? (
            <Input
              size="large"
              placeholder="Выберите город"
              prefix={<EnvironmentOutlined />}
              value={selectedCityLabel}
              readOnly
              onClick={() => openMobileSelect('city')}
            />
          ) : (
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
          )}

          {isMobile ? (
            <Input
              size="large"
              placeholder="Выберите тематики"
              value={selectedTopicsLabel}
              readOnly
              onClick={() => openMobileSelect('topics')}
            />
          ) : (
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
          )}
        </Space>
      </Card>

      {loading || newExpertsLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Блок новых экспертов - показываем только если нет активных фильтров */}
          {newExperts.length > 0 && !(selectedTopics.length > 0 || selectedCity || searchText) && (
            <div style={{ marginBottom: 40 }}>
              <Title level={3} style={{ marginBottom: 24 }}>Новые эксперты</Title>
              <Row gutter={[24, 24]}>
                {newExperts.map((expert) => (
                  <Col xs={24} sm={12} lg={8} key={expert.id}>
                    {renderExpertCard(expert, newExpertsFavoriteStatus[expert.id])}
                  </Col>
                ))}
              </Row>
              
              {/* Кнопка "Показать больше" */}
              {hasMoreExperts && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <Button
                    type="primary"
                    size="large"
                    loading={loadingMore}
                    onClick={loadMoreExperts}
                    style={{
                      minWidth: 200,
                      height: 48,
                      fontSize: 16,
                      fontWeight: 600,
                      borderRadius: 24
                    }}
                  >
                    Показать больше экспертов
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Фильтрованный список экспертов - показываем только если есть фильтры */}
          {(selectedTopics.length > 0 || selectedCity || searchText) && (
            <>
              {experts.length === 0 ? (
                <Empty description="Эксперты не найдены" style={{ padding: 60 }} />
              ) : (
                <>
                  <Row gutter={[24, 24]}>
                    {experts.slice(0, displayLimit).map((expert) => (
                      <Col xs={24} sm={12} lg={8} key={expert.id}>
                        {renderExpertCard(expert, favoriteStatus[expert.id])}
                      </Col>
                    ))}
                  </Row>
                  
                  {/* Кнопка "Показать еще" для фильтрованных экспертов */}
                  {experts.length > displayLimit && (
                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                      <Button
                        type="default"
                        size="large"
                        onClick={loadMoreFilteredExperts}
                        style={{
                          minWidth: 200,
                          height: 48,
                          fontSize: 16,
                          fontWeight: 600,
                          borderRadius: 24
                        }}
                      >
                        Показать еще ({experts.length - displayLimit} осталось)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
    {renderMobileSelectOverlay()}
    </>
  );
};

export default ExpertsPage;
