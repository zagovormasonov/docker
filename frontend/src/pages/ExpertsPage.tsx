import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Input, Select, Typography, Spin, Empty, Button, Badge } from 'antd';
import { 
  Search, 
  MapPin, 
  MessageSquare, 
  Star, 
  X, 
  Check, 
  ChevronDown, 
  Sparkles,
  User,
  Filter,
  ArrowRight
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import LazyAvatar from '../components/LazyAvatar';
import './ExpertsPage.css';

const { Title, Text } = Typography;

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
  const [displayLimit, setDisplayLimit] = useState(12);
  const searchTimeoutRef = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileSelectType, setMobileSelectType] = useState<MobileSelectType | null>(null);
  const [mobileSelectSearch, setMobileSelectSearch] = useState('');
  const [mobileSelectClosing, setMobileSelectClosing] = useState(false);
  const originalBodyOverflow = useRef<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = window.setTimeout(() => setDebouncedSearchText(searchText), 500);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchText]);

  const fetchTopics = useCallback(async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data);
    } catch (error) {
      console.error('Ошибка загрузки тематик:', error);
    }
  }, []);

  const fetchCities = useCallback(async () => {
    try {
      const response = await api.get('/cities');
      setCities(response.data);
    } catch (error) {
      console.error('Ошибка загрузки городов:', error);
    }
  }, []);

  const fetchNewExperts = useCallback(async () => {
    setNewExpertsLoading(true);
    try {
      const response = await api.get('/experts/search?limit=6&order=newest');
      const newExpertsData = response.data;
      setNewExperts(newExpertsData);
      setHasMoreExperts(newExpertsData.length === 6);
      
      if (newExpertsData.length > 0 && user) {
        const visibleExperts = newExpertsData.slice(0, 6);
        const favoritePromises = visibleExperts.map((exp: Expert) => 
          api.get(`/expert-interactions/${exp.id}/status`).catch(() => ({ data: { favorited: false } }))
        );
        const responses = await Promise.all(favoritePromises);
        const map: Record<number, boolean> = {};
        responses.forEach((res, i) => map[visibleExperts[i].id] = res.data.favorited);
        setNewExpertsFavoriteStatus(map);
      }
    } catch (error) {
      console.error('Ошибка загрузки новых экспертов:', error);
    } finally {
      setNewExpertsLoading(false);
    }
  }, [user]);

  const loadMoreExperts = useCallback(async () => {
    setLoadingMore(true);
    try {
      const response = await api.get(`/experts/search?limit=6&offset=${newExpertsOffset}&order=newest`);
      const moreData = response.data;
      setNewExperts(prev => {
        const ids = new Set(prev.map(e => e.id));
        return [...prev, ...moreData.filter((e: Expert) => !ids.has(e.id))];
      });
      setNewExpertsOffset(prev => prev + 6);
      setHasMoreExperts(moreData.length === 6);
      
      if (moreData.length > 0 && user) {
        const promises = moreData.map((exp: Expert) => 
          api.get(`/expert-interactions/${exp.id}/status`).catch(() => ({ data: { favorited: false } }))
        );
        const responses = await Promise.all(promises);
        const map: Record<number, boolean> = {};
        responses.forEach((res, i) => map[moreData[i].id] = res.data.favorited);
        setNewExpertsFavoriteStatus(prev => ({ ...prev, ...map }));
      }
    } catch (error) {
      console.error('Ошибка загрузки доп. экспертов:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [newExpertsOffset, user]);

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTopics.length > 0) params.append('topics', selectedTopics.join(','));
      if (selectedCity) params.append('city', selectedCity);
      if (debouncedSearchText) params.append('search', debouncedSearchText);

      const response = await api.get(`/experts/search?${params.toString()}`);
      const data = response.data;
      setExperts(data);
      
      if (data.length > 0 && user) {
        const visible = data.slice(0, 12);
        const promises = visible.map((exp: Expert) => 
          api.get(`/expert-interactions/${exp.id}/status`).catch(() => ({ data: { favorited: false } }))
        );
        const responses = await Promise.all(promises);
        const map: Record<number, boolean> = {};
        responses.forEach((res, i) => map[visible[i].id] = res.data.favorited);
        setFavoriteStatus(map);
      }
    } catch (error) {
      console.error('Ошибка загрузки экспертов:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTopics, selectedCity, debouncedSearchText, user]);

  const toggleFavorite = useCallback(async (expertId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.post(`/expert-interactions/${expertId}/favorite`);
      const status = response.data.favorited;
      setFavoriteStatus(prev => ({ ...prev, [expertId]: status }));
      setNewExpertsFavoriteStatus(prev => ({ ...prev, [expertId]: status }));
    } catch (error) {
      console.error('Ошибка избранного:', error);
    }
  }, []);

  const loadMoreFilteredExperts = useCallback(() => setDisplayLimit(prev => prev + 12), []);

  useEffect(() => {
    fetchTopics();
    fetchCities();
    fetchNewExperts();
  }, [fetchTopics, fetchCities, fetchNewExperts]);

  useEffect(() => {
    fetchExperts();
    setDisplayLimit(12);
  }, [fetchExperts]);

  const renderExpertCard = useCallback((expert: Expert, isFavorited: boolean) => (
    <div 
      className="expert-card-v2" 
      onClick={() => {
        if (user && user.id === expert.id) navigate('/profile');
        else navigate(`/experts/${expert.slug || expert.id}`);
      }}
    >
      <div className="expert-card-v2__inner">
        <div className="expert-card-v2__actions">
          <button 
            className="expert-card-v2__action-btn"
            onClick={async (e) => {
              e.stopPropagation();
              if (!user) { navigate('/login'); return; }
              try {
                const response = await api.post('/chats/create', { otherUserId: expert.id });
                navigate(`/chats/${response.data.id}`);
              } catch (err) { console.error(err); }
            }}
          >
            <MessageSquare size={16} />
          </button>
          <button 
            className={`expert-card-v2__action-btn expert-card-v2__action-btn--fav ${isFavorited ? 'active' : ''}`}
            onClick={(e) => toggleFavorite(expert.id, e)}
          >
            <Star size={16} />
          </button>
        </div>

        <div className="expert-card-v2__header">
          <div className="expert-card-v2__avatar-ring">
            <LazyAvatar 
              size={58} 
              src={expert.avatar_url} 
              defaultSrc="/emp.jpg" 
              icon={<User size={24} />} 
              style={{ width: '100%', height: '100%', borderRadius: '50%' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="expert-card-v2__name">{expert.name}</h3>
            {expert.city && (
              <span className="expert-card-v2__location">
                <MapPin size={12} /> {expert.city}
              </span>
            )}
          </div>
        </div>

        <p className="expert-card-v2__bio">{expert.bio || 'Нет описания'}</p>

        {expert.topics && expert.topics.length > 0 && (
          <div className="expert-card-v2__topics">
            {expert.topics.slice(0, 3).map((t, i) => (
              <span key={i} className="expert-card-v2__topic">{t}</span>
            ))}
            {expert.topics.length > 3 && (
              <span className="expert-card-v2__topic">+{expert.topics.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  ), [user, navigate, toggleFavorite]);

  const selectedCityLabel = selectedCity || 'Все города';
  const selectedTopicsLabel = selectedTopics.length ? selectedTopics.join(', ') : '';
  const isMobileSelectOpen = isMobile && mobileSelectType !== null;

  useEffect(() => {
    if (!isMobile) return;
    if (isMobileSelectOpen) {
      if (originalBodyOverflow.current === null) originalBodyOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else if (originalBodyOverflow.current !== null) {
      document.body.style.overflow = originalBodyOverflow.current;
      originalBodyOverflow.current = null;
    }
  }, [isMobile, isMobileSelectOpen]);

  const openMobileSelect = (type: MobileSelectType) => {
    setMobileSelectClosing(false);
    setMobileSelectType(type);
    setMobileSelectSearch('');
  };

  const closeMobileSelect = () => {
    setMobileSelectClosing(true);
    setTimeout(() => {
      setMobileSelectType(null);
      setMobileSelectClosing(false);
    }, 250);
  };

  const handleMobileOptionClick = (value: string) => {
    if (mobileSelectType === 'city') {
      setSelectedCity(value);
      closeMobileSelect();
    } else {
      const exists = selectedTopics.includes(value);
      setSelectedTopics(prev => exists ? prev.filter(t => t !== value) : [...prev, value]);
    }
  };

  const mobileSelectConfig = useMemo(() => {
    if (!mobileSelectType) return null;
    if (mobileSelectType === 'city') return {
      title: 'Город',
      multiple: false,
      options: [{ label: 'Все города', value: '' }, ...cities.map(c => ({ label: c.name, value: c.name }))],
      selected: selectedCity ? [selectedCity] : ['']
    };
    return {
      title: 'Тематики',
      multiple: true,
      options: topics.map(t => ({ label: t.name, value: t.name })),
      selected: selectedTopics
    };
  }, [mobileSelectType, cities, topics, selectedCity, selectedTopics]);

  const renderMobileSelectOverlay = () => {
    if (!isMobile || !mobileSelectConfig) return null;
    const filtered = mobileSelectConfig.options.filter(o => o.label.toLowerCase().includes(mobileSelectSearch.toLowerCase()));

    return createPortal(
      <div className={`mobile-select-overlay ${mobileSelectClosing ? 'closing' : ''}`} onClick={closeMobileSelect}>
        <div className={`mobile-select-panel ${mobileSelectClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="mobile-select-header">
            <button className="mobile-select-close" onClick={closeMobileSelect}><X size={20} /></button>
            <span className="mobile-select-title">{mobileSelectConfig.title}</span>
            <button className="mobile-select-ready" onClick={closeMobileSelect}>Готово</button>
          </div>
          <Input 
            prefix={<Search size={16} />} 
            placeholder="Поиск..." 
            value={mobileSelectSearch} 
            onChange={e => setMobileSelectSearch(e.target.value)} 
            className="mobile-select-search"
          />
          <div className="mobile-select-options">
            {filtered.map(o => (
              <button 
                key={o.value} 
                className={`mobile-select-option ${mobileSelectConfig.selected.includes(o.value) ? 'selected' : ''}`}
                onClick={() => handleMobileOptionClick(o.value)}
              >
                {mobileSelectConfig.multiple && (
                  <span className={`mobile-select-checkbox ${mobileSelectConfig.selected.includes(o.value) ? 'checked' : ''}`}>
                    <Check size={14} />
                  </span>
                )}
                <span className="mobile-select-label">{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>, document.body
    );
  };

  return (
    <div className="experts-v2">
      <div className="container">
        <header className="experts-v2__header">
          <Badge count={<Sparkles size={16} color="#f59e0b" fill="#f59e0b" />} offset={[10, 0]}>
            <h1 className="experts-v2__title">Наши эксперты</h1>
          </Badge>
          <p className="experts-v2__subtitle">
            Сообщество профессионалов, готовых делиться знаниями и помогать в духовном росте
          </p>
        </header>

        <div className="experts-v2__toolbar">
          <div className="experts-v2__search">
            <Search size={18} color="#71717a" />
            <input 
              placeholder="Поиск по имени или теме..." 
              value={searchText} 
              onChange={e => setSearchText(e.target.value)} 
            />
          </div>

          <div className="experts-v2__filters">
            {isMobile ? (
              <>
                <button className="experts-v2__filter-trigger" onClick={() => openMobileSelect('city')}>
                  <MapPin size={16} /> {selectedCityLabel}
                </button>
                <button className="experts-v2__filter-trigger" onClick={() => openMobileSelect('topics')}>
                  <Filter size={16} /> {selectedTopics.length > 0 ? `Темы (${selectedTopics.length})` : 'Все темы'}
                </button>
              </>
            ) : (
              <>
                <Select 
                  style={{ width: 180 }} 
                  placeholder="Город" 
                  value={selectedCity || undefined} 
                  onChange={setSelectedCity} 
                  showSearch 
                  options={[{ label: 'Все города', value: '' }, ...cities.map(c => ({ label: c.name, value: c.name }))]} 
                  allowClear
                />
                <Select 
                  mode="multiple" 
                  style={{ minWidth: 200, maxWidth: 300 }} 
                  placeholder="Тематики" 
                  value={selectedTopics} 
                  onChange={setSelectedTopics} 
                  maxTagCount="responsive"
                  options={topics.map(t => ({ label: t.name, value: t.name }))} 
                />
              </>
            )}
          </div>
        </div>

        {loading || newExpertsLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
        ) : (
          <>
            {/* New Experts Grid - only show if no filters */}
            {newExperts.length > 0 && !selectedTopics.length && !selectedCity && !searchText && (
              <div style={{ marginBottom: 60 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Новые лица</h2>
                </div>
                <Row gutter={[24, 24]}>
                  {newExperts.map(exp => (
                    <Col xs={24} sm={12} lg={8} key={exp.id}>{renderExpertCard(exp, newExpertsFavoriteStatus[exp.id])}</Col>
                  ))}
                </Row>
                {hasMoreExperts && (
                  <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <Button 
                      onClick={loadMoreExperts} 
                      loading={loadingMore} 
                      size="large" 
                      style={{ borderRadius: 12, height: 48, padding: '0 32px' }}
                    >
                      Показать еще
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Filtered Results */}
            {(selectedTopics.length > 0 || selectedCity || searchText) && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Результаты поиска</h2>
                {experts.length === 0 ? (
                  <Empty description="Никого не нашли :(" />
                ) : (
                  <>
                    <Row gutter={[24, 24]}>
                      {experts.slice(0, displayLimit).map(exp => (
                        <Col xs={24} sm={12} lg={8} key={exp.id}>{renderExpertCard(exp, favoriteStatus[exp.id])}</Col>
                      ))}
                    </Row>
                    {experts.length > displayLimit && (
                      <div style={{ textAlign: 'center', marginTop: 32 }}>
                        <Button onClick={loadMoreFilteredExperts} size="large" type="text" icon={<ChevronDown size={18} />}>
                          Загрузить еще
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {renderMobileSelectOverlay()}
    </div>
  );
};

export default ExpertsPage;
