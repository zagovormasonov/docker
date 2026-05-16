import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Empty, Input, Select, Spin } from 'antd';
import { Check, ChevronDown, Filter, MapPin, MessageSquare, Search, Sparkles, Star, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LazyAvatar from '../components/LazyAvatar';
import { useAuth } from '../contexts/AuthContext';
import './ExpertsPage.css';

type TabKey = 'all' | 'new' | 'city' | 'retreats';
type TagKind = 'tp' | 'tt' | 'ta';
type MobileSelectType = 'city' | 'topics' | 'sort';

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

interface ExpertDetails {
  id: number;
  name: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  slug?: string;
  topics: Topic[];
  services: Array<{ id: number; title: string; price?: number | string }>;
  products: Array<{ id: number; title: string; price?: number | string }>;
}

const SPEC_FILTERS = [
  { spec: '', label: 'Все специализации' },
  { spec: 'healing', label: 'Целительство' },
  { spec: 'taro', label: 'Таро и предсказания' },
  { spec: 'psychology', label: 'Психология' },
  { spec: 'coaching', label: 'Коучинг' },
  { spec: 'meditation', label: 'Медитации' },
  { spec: 'retreats', label: 'Ретриты' },
  { spec: 'channeling', label: 'Ченнелинг' },
  { spec: 'body', label: 'Тело и массаж' }
] as const;

const formatPrice = (value?: number | string) => {
  if (value === undefined || value === null || value === '') return 'По запросу';
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return `${new Intl.NumberFormat('ru-RU').format(numeric)} ₽`;
  }
  return String(value);
};

const normalize = (value?: string) => (value || '').trim().toLowerCase();
const includesAny = (value: string, needles: string[]) => needles.some((needle) => value.includes(needle));

const classifyTopic = (topic: string): TagKind => {
  const normalized = normalize(topic);
  if (includesAny(normalized, ['ретрит', 'тур', 'путеше', 'поездк'])) return 'ta';
  if (includesAny(normalized, ['медита', 'тел', 'массаж', 'дых', 'энерг', 'психосомат'])) return 'tt';
  return 'tp';
};

const matchesSpec = (expert: Expert, activeSpec: string) => {
  if (!activeSpec) return true;

  const source = `${expert.bio || ''} ${expert.topics.join(' ')}`.toLowerCase();
  const keywords: Record<string, string[]> = {
    healing: ['целитель', 'исцел', 'энерг', 'рейки'],
    taro: ['таро', 'оракул', 'нумер', 'астрол', 'предсказ'],
    psychology: ['психолог', 'психотерап', 'психосомат', 'терап'],
    coaching: ['коуч', 'ментор', 'сопровожд'],
    meditation: ['медита', 'осознан', 'дых', 'практик'],
    retreats: ['ретрит', 'тур', 'путеше', 'выезд'],
    channeling: ['ченнел', 'медиум', 'проводник'],
    body: ['массаж', 'телес', 'тело', 'остео']
  };

  return includesAny(source, keywords[activeSpec] || []);
};

const matchesTab = (expert: Expert, activeTab: TabKey) => {
  if (activeTab === 'all' || activeTab === 'new') return true;
  if (activeTab === 'city') return Boolean(expert.city);
  if (activeTab === 'retreats') return matchesSpec(expert, 'retreats');
  return true;
};

const createPreviewStats = (details?: ExpertDetails | null, expert?: Expert | null) => {
  const topicsCount = details?.topics.length ?? expert?.topics.length ?? 0;
  const servicesCount = details?.services.length ?? 0;
  const productsCount = details?.products.length ?? 0;

  return [
    { value: topicsCount, label: 'тем' },
    { value: servicesCount, label: 'услуг' },
    { value: productsCount, label: 'продуктов' }
  ];
};

const ExpertsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [experts, setExperts] = useState<Expert[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [activeSpec, setActiveSpec] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'name'>('newest');
  const [displayLimit, setDisplayLimit] = useState(8);
  const [loading, setLoading] = useState(true);
  const [favoriteStatus, setFavoriteStatus] = useState<Record<number, boolean>>({});
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [previewDetails, setPreviewDetails] = useState<ExpertDetails | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [countData, setCountData] = useState<{ count: number } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [mobileSelectType, setMobileSelectType] = useState<MobileSelectType | null>(null);
  const [mobileSelectSearch, setMobileSelectSearch] = useState('');
  const [mobileSelectClosing, setMobileSelectClosing] = useState(false);
  const originalBodyOverflow = useRef<string | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchPageData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCity) params.append('city', selectedCity);
      if (searchText.trim()) params.append('search', searchText.trim());
      if (selectedTopics.length > 0) params.append('topics', selectedTopics.join(','));

      const [expertsResponse, topicsResponse, citiesResponse, countResponse] = await Promise.all([
        api.get(`/experts/search?${params.toString()}`),
        api.get('/topics'),
        api.get('/cities'),
        api.get('/experts/count').catch(() => ({ data: null }))
      ]);

      const expertsData: Expert[] = expertsResponse.data || [];
      setExperts(expertsData);
      setTopics(topicsResponse.data || []);
      setCities(citiesResponse.data || []);
      setCountData(countResponse.data);

      if (user && expertsData.length > 0) {
        const responses = await Promise.all(
          expertsData.slice(0, 24).map((expert) =>
            api.get(`/expert-interactions/${expert.id}/status`).catch(() => ({ data: { favorited: false } }))
          )
        );

        const nextFavoriteStatus: Record<number, boolean> = {};
        responses.forEach((response, index) => {
          nextFavoriteStatus[expertsData[index].id] = response.data.favorited;
        });
        setFavoriteStatus(nextFavoriteStatus);
      } else {
        setFavoriteStatus({});
      }
    } catch (error) {
      console.error('Ошибка загрузки экспертов:', error);
      setExperts([]);
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedCity, selectedTopics, user]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const isMobileSelectOpen = isMobile && mobileSelectType !== null;

  useEffect(() => {
    if (!isMobile) return;

    if (isMobileSelectOpen) {
      if (originalBodyOverflow.current === null) {
        originalBodyOverflow.current = document.body.style.overflow;
      }
      document.body.style.overflow = 'hidden';
    } else if (originalBodyOverflow.current !== null) {
      document.body.style.overflow = originalBodyOverflow.current;
      originalBodyOverflow.current = null;
    }
  }, [isMobile, isMobileSelectOpen]);

  const filteredExperts = useMemo(() => {
    const normalizedSearch = normalize(searchText);

    let result = experts.filter((expert) => {
      const searchable = `${expert.name} ${expert.bio || ''} ${expert.topics.join(' ')}`.toLowerCase();
      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesTopics = selectedTopics.length === 0 || selectedTopics.every((topic) => expert.topics.includes(topic));
      return matchesSearch && matchesTopics && matchesTab(expert, activeTab) && matchesSpec(expert, activeSpec);
    });

    if (activeTab === 'new') {
      result = result.slice(0, 12);
    }

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    }

    return result;
  }, [activeSpec, activeTab, experts, searchText, selectedTopics, sortBy]);

  const previewExpert = useMemo(
    () => filteredExperts.find((expert) => expert.id === previewId) ?? filteredExperts[0] ?? null,
    [filteredExperts, previewId]
  );

  useEffect(() => {
    if (!filteredExperts.length) {
      setPreviewId(null);
      setPreviewDetails(null);
      return;
    }

    if (!previewId || !filteredExperts.some((expert) => expert.id === previewId)) {
      setPreviewId(filteredExperts[0].id);
    }
  }, [filteredExperts, previewId]);

  useEffect(() => {
    if (!previewExpert) {
      setPreviewDetails(null);
      return;
    }

    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const response = await api.get(`/experts/${previewExpert.slug || previewExpert.id}`);
        setPreviewDetails(response.data);
      } catch (error) {
        console.error('Ошибка загрузки превью эксперта:', error);
        setPreviewDetails(null);
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchPreview();
  }, [previewExpert]);

  const toggleFavorite = useCallback(
    async (expertId: number, event: React.MouseEvent) => {
      event.stopPropagation();
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const response = await api.post(`/expert-interactions/${expertId}/favorite`);
        setFavoriteStatus((prev) => ({ ...prev, [expertId]: response.data.favorited }));
      } catch (error) {
        console.error('Ошибка избранного:', error);
      }
    },
    [navigate, user]
  );

  const openChat = useCallback(
    async (expertId: number, event?: React.MouseEvent) => {
      event?.stopPropagation();
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const response = await api.post('/chats/create', { otherUserId: expertId });
        navigate(`/chats/${response.data.id}`);
      } catch (error) {
        console.error('Ошибка открытия чата:', error);
      }
    },
    [navigate, user]
  );

  const visibleExperts = filteredExperts.slice(0, displayLimit);
  const onlineStrip = filteredExperts.filter((expert) => !expert.city || expert.city.trim() === '').slice(0, 3);
  const stats = {
    total: countData?.count ?? experts.length,
    cities: new Set(experts.map((expert) => expert.city).filter(Boolean)).size,
    topics: topics.length,
    visible: filteredExperts.length
  };

  const selectedCityLabel = selectedCity || 'Все города';
  const selectedTopicsLabel = selectedTopics.length ? `Темы (${selectedTopics.length})` : 'Все тематики';
  const sortLabel = sortBy === 'name' ? 'По имени' : 'По новизне';

  const openMobileSelect = (type: MobileSelectType) => {
    setMobileSelectClosing(false);
    setMobileSelectSearch('');
    setMobileSelectType(type);
  };

  const closeMobileSelect = () => {
    setMobileSelectClosing(true);
    window.setTimeout(() => {
      setMobileSelectType(null);
      setMobileSelectClosing(false);
      setMobileSelectSearch('');
    }, 250);
  };

  const mobileSelectConfig = useMemo(() => {
    if (!mobileSelectType) return null;

    if (mobileSelectType === 'city') {
      return {
        title: 'Город',
        multiple: false,
        options: [{ label: 'Все города', value: '' }, ...cities.map((city) => ({ label: city.name, value: city.name }))],
        selected: selectedCity ? [selectedCity] : ['']
      };
    }

    if (mobileSelectType === 'sort') {
      return {
        title: 'Сортировка',
        multiple: false,
        options: [
          { label: 'По новизне', value: 'newest' },
          { label: 'По имени', value: 'name' }
        ],
        selected: [sortBy]
      };
    }

    return {
      title: 'Тематики',
      multiple: true,
      options: topics.map((topic) => ({ label: topic.name, value: topic.name })),
      selected: selectedTopics
    };
  }, [cities, mobileSelectType, selectedCity, selectedTopics, sortBy, topics]);

  const handleMobileOptionClick = (value: string) => {
    if (mobileSelectType === 'city') {
      setSelectedCity(value);
      closeMobileSelect();
      return;
    }

    if (mobileSelectType === 'sort') {
      setSortBy(value as 'newest' | 'name');
      closeMobileSelect();
      return;
    }

    const exists = selectedTopics.includes(value);
    setSelectedTopics((prev) => (exists ? prev.filter((topic) => topic !== value) : [...prev, value]));
  };

  const renderMobileSelectOverlay = () => {
    if (!isMobile || !mobileSelectConfig) return null;

    const filteredOptions = mobileSelectConfig.options.filter((option) =>
      option.label.toLowerCase().includes(mobileSelectSearch.toLowerCase())
    );

    return createPortal(
      <div className={`mobile-select-overlay ${mobileSelectClosing ? 'closing' : ''}`} onClick={closeMobileSelect}>
        <div className={`mobile-select-panel ${mobileSelectClosing ? 'closing' : ''}`} onClick={(event) => event.stopPropagation()}>
          <div className="mobile-select-header">
            <button className="mobile-select-close" onClick={closeMobileSelect}>
              <X size={20} />
            </button>
            <span className="mobile-select-title">{mobileSelectConfig.title}</span>
            <button className="mobile-select-ready" onClick={closeMobileSelect}>
              Готово
            </button>
          </div>

          <Input
            prefix={<Search size={16} />}
            placeholder="Поиск..."
            value={mobileSelectSearch}
            onChange={(event) => setMobileSelectSearch(event.target.value)}
            className="mobile-select-search"
          />

          <div className="mobile-select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = mobileSelectConfig.selected.includes(option.value);

                return (
                  <button
                    key={option.value}
                    className={`mobile-select-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleMobileOptionClick(option.value)}
                  >
                    {mobileSelectConfig.multiple ? (
                      <span className={`mobile-select-checkbox ${isSelected ? 'checked' : ''}`}>
                        <Check size={14} />
                      </span>
                    ) : (
                      <span className={`mobile-select-radio ${isSelected ? 'checked' : ''}`}>
                        <Check size={14} />
                      </span>
                    )}
                    <span className="mobile-select-label">{option.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="mobile-select-empty">Ничего не найдено</div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="ss-mstr">
      <div className="page-header">
        <div className="ph-top">
          <div>
            <div className="ph-eyebrow">
              <Sparkles size={14} />
              Каталог экспертов
            </div>
            <div className="ph-title">Эксперты</div>
            <div className="ph-sub">Выбирайте специалистов по темам, городам и формату профиля на основном сайте SoulSynergy.</div>
          </div>
          <button type="button" className="add-btn" onClick={() => navigate('/become-expert')}>
            Стать экспертом
          </button>
        </div>

        <div className="search-row">
          <div className="srch-wrap">
            <span className="srch-ico">
              <Search size={15} />
            </span>
            <input
              className="srch-inp"
              type="search"
              placeholder="Поиск по имени, био и темам"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          {isMobile ? (
            <div className="mobile-filter-row">
              <button type="button" className="mobile-filter-trigger" onClick={() => openMobileSelect('city')}>
                <MapPin size={16} />
                <span>{selectedCityLabel}</span>
                <ChevronDown size={16} />
              </button>

              <button type="button" className="mobile-filter-trigger" onClick={() => openMobileSelect('topics')}>
                <Filter size={16} />
                <span>{selectedTopicsLabel}</span>
                <ChevronDown size={16} />
              </button>
            </div>
          ) : (
            <>
              <Select
                className="ss-select"
                value={selectedCity || undefined}
                placeholder="Все города"
                onChange={(value) => setSelectedCity(value || '')}
                allowClear
                options={cities.map((city) => ({ label: city.name, value: city.name }))}
              />

              <Select
                mode="multiple"
                className="ss-select ss-select-topics"
                value={selectedTopics}
                placeholder="Тематики"
                onChange={setSelectedTopics}
                maxTagCount="responsive"
                options={topics.map((topic) => ({ label: topic.name, value: topic.name }))}
              />
            </>
          )}
        </div>

        <div className="filter-tabs">
          {[
            ['all', 'Все эксперты'],
            ['new', 'Новые'],
            ['city', 'С городом'],
            ['retreats', 'Ретриты']
          ].map(([key, label]) => (
            <span
              key={key}
              role="button"
              tabIndex={0}
              className={`ftab${activeTab === key ? ' on' : ''}`}
              onClick={() => setActiveTab(key as TabKey)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setActiveTab(key as TabKey);
                }
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="spec-pills">
        {SPEC_FILTERS.map((item) => (
          <span
            key={item.spec || 'all'}
            role="button"
            tabIndex={0}
            className={`sp${activeSpec === item.spec ? ' on' : ''}`}
            onClick={() => setActiveSpec(item.spec)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setActiveSpec(item.spec);
              }
            }}
          >
            {item.label}
          </span>
        ))}
      </div>

      <div className="layout">
        <div className="catalog">
          <div className="sort-row">
            <span className="sort-label">Найдено {filteredExperts.length} экспертов</span>
            {isMobile ? (
              <button type="button" className="mobile-sort-trigger" onClick={() => openMobileSelect('sort')}>
                <span>{sortLabel}</span>
                <ChevronDown size={16} />
              </button>
            ) : (
              <Select
                className="ss-sort-select"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { label: 'По новизне', value: 'newest' },
                  { label: 'По имени', value: 'name' }
                ]}
              />
            )}
          </div>

          {loading ? (
            <div className="loading-box">
              <Spin size="large" />
            </div>
          ) : filteredExperts.length === 0 ? (
            <div className="empty-box">
              <Empty description="По этим фильтрам экспертов пока не найдено" />
            </div>
          ) : (
            <>
              <div className="grid">
                {visibleExperts.map((expert) => {
                  const isSelected = previewExpert?.id === expert.id;

                  return (
                    <div
                      key={expert.id}
                      className={`mc${isSelected ? ' featured' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setPreviewId(expert.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setPreviewId(expert.id);
                        }
                      }}
                    >
                      <div className={`mc-banner ${isSelected ? 'b-purple' : classifyTopic(expert.topics[0] || '') === 'tt' ? 'b-teal' : 'b-amber'}`}>
                        {isSelected ? <span className="feat-badge">Выбрано</span> : null}
                        {!expert.city ? (
                          <div className="online-badge">
                            <span className="online-dot" />
                            онлайн
                          </div>
                        ) : null}
                      </div>

                      <div className="mc-body">
                        <div className="mc-ava-wrap">
                          <div className="mc-ava mc-ava-image">
                            <LazyAvatar
                              size={48}
                              src={expert.avatar_url}
                              defaultSrc="/emp.jpg"
                              icon={<User size={18} />}
                              style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                            />
                          </div>
                        </div>

                        <div className="mc-name">{expert.name}</div>
                        <div className="mc-role">{expert.topics.slice(0, 2).join(' · ') || 'Эксперт SoulSynergy'}</div>
                        <div className={`mc-city${expert.city ? '' : ' mc-city-online'}`}>
                          <MapPin size={11} />
                          {expert.city || 'Онлайн'}
                        </div>
                        <div className="mc-desc">{expert.bio || 'Профиль эксперта доступен на основном сайте SoulSynergy.'}</div>

                        <div className="mc-tags">
                          {expert.topics.slice(0, 3).map((topic) => (
                            <span key={topic} className={`tag ${classifyTopic(topic)}`}>
                              {topic}
                            </span>
                          ))}
                        </div>

                        <div className="mc-foot">
                          <div className="mc-stats">
                            <span className="mcs">
                              <span>{expert.topics.length}</span> тем
                            </span>
                            <span className="mcs">
                              <span>{expert.slug ? 'slug' : 'id'}</span> профиль
                            </span>
                          </div>

                          <div className="card-actions">
                            <button type="button" className="icon-action" onClick={(event) => openChat(expert.id, event)} aria-label="Написать">
                              <MessageSquare size={14} />
                            </button>
                            <button
                              type="button"
                              className={`icon-action${favoriteStatus[expert.id] ? ' active' : ''}`}
                              onClick={(event) => toggleFavorite(expert.id, event)}
                              aria-label="В избранное"
                            >
                              <Star size={14} />
                            </button>
                            <button
                              type="button"
                              className={`mc-btn${isSelected ? ' primary' : ''}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/experts/${expert.slug || expert.id}`);
                              }}
                            >
                              Профиль
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredExperts.length > visibleExperts.length ? (
                <button type="button" className="load-more" onClick={() => setDisplayLimit((prev) => prev + 8)}>
                  Показать ещё экспертов
                </button>
              ) : null}
            </>
          )}
        </div>

        <aside className="sidebar">
          <div className="side-section">
            <div className="side-h">Превью эксперта</div>
            {previewExpert ? (
              <div className="preview-card">
                <div className={`pc-banner ${classifyTopic(previewExpert.topics[0] || '') === 'tt' ? 'pc-banner-teal' : classifyTopic(previewExpert.topics[0] || '') === 'ta' ? 'pc-banner-amber' : 'pc-banner-purple'}`} />
                <div className="pc-body">
                  <div className="pc-ava">
                    <LazyAvatar
                      size={52}
                      src={previewExpert.avatar_url}
                      defaultSrc="/emp.jpg"
                      icon={<User size={20} />}
                      style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                    />
                  </div>
                  <div className="pc-name">{previewExpert.name}</div>
                  <div className="pc-role">
                    {previewExpert.topics.slice(0, 2).join(' · ') || 'Эксперт'} {previewExpert.city ? `· ${previewExpert.city}` : '· Онлайн'}
                  </div>

                  <div className="pc-tags">
                    {previewExpert.topics.slice(0, 4).map((topic) => (
                      <span key={topic} className={`tag ${classifyTopic(topic)}`}>
                        {topic}
                      </span>
                    ))}
                  </div>

                  <div className="pc-services">
                    <div className="pcs-title">О профиле</div>
                    <div className="pcs-text">{previewExpert.bio || 'Описание в профиле пока не заполнено.'}</div>
                  </div>

                  {previewLoading ? (
                    <div className="preview-loader">
                      <Spin size="small" />
                    </div>
                  ) : (
                    <>
                      {previewDetails?.services?.length ? (
                        <div className="pc-services">
                          <div className="pcs-title">Услуги</div>
                          {previewDetails.services.slice(0, 3).map((service) => (
                            <div key={service.id} className="pcs-item">
                              <span className="pcs-name">{service.title}</span>
                              <span className="pcs-price">{formatPrice(service.price)}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {previewDetails?.products?.length ? (
                        <div className="pc-services">
                          <div className="pcs-title">Цифровые продукты</div>
                          {previewDetails.products.slice(0, 3).map((product) => (
                            <div key={product.id} className="pcs-item">
                              <span className="pcs-name">{product.title}</span>
                              <span className="pcs-price">{formatPrice(product.price)}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}

                  <button type="button" className="book-btn" onClick={() => navigate(`/experts/${previewExpert.slug || previewExpert.id}`)}>
                    Открыть профиль
                  </button>
                  <button type="button" className="msg-btn" onClick={() => openChat(previewExpert.id)}>
                    Написать сообщение
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-box empty-box--sidebar">
                <Empty description="Выберите эксперта слева" />
              </div>
            )}
          </div>

          <div className="side-section">
            <div className="side-h">Недавно добавлены</div>
            <div className="online-strip">
              {(onlineStrip.length ? onlineStrip : filteredExperts.slice(0, 3)).map((expert) => (
                <div key={expert.id} className="os-item" onClick={() => setPreviewId(expert.id)}>
                  <div className="os-ava">
                    <LazyAvatar
                      size={32}
                      src={expert.avatar_url}
                      defaultSrc="/emp.jpg"
                      icon={<User size={14} />}
                      style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                    />
                  </div>
                  <div>
                    <div className="os-name">{expert.name}</div>
                    <div className="os-role">{expert.topics[0] || 'Эксперт'}</div>
                  </div>
                  <span className="os-pip" />
                </div>
              ))}
            </div>
          </div>

          <div className="side-section">
            <div className="side-h">Статистика</div>
            <div className="stats-row">
              <div className="stat-chip">
                <div className="sc-n">{stats.total}</div>
                <div className="sc-l">экспертов</div>
              </div>
              <div className="stat-chip">
                <div className="sc-n">{stats.cities}</div>
                <div className="sc-l">городов</div>
              </div>
              <div className="stat-chip">
                <div className="sc-n">{stats.topics}</div>
                <div className="sc-l">тем</div>
              </div>
              <div className="stat-chip">
                <div className="sc-n">{stats.visible}</div>
                <div className="sc-l">в подборке</div>
              </div>
            </div>
          </div>

          {previewExpert ? (
            <div className="side-section">
              <div className="side-h">По выбранному профилю</div>
              <div className="stats-row">
                {createPreviewStats(previewDetails, previewExpert).map((item) => (
                  <div key={item.label} className="stat-chip">
                    <div className="sc-n">{item.value}</div>
                    <div className="sc-l">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {renderMobileSelectOverlay()}
    </div>
  );
};

export default ExpertsPage;
