import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Row, Col, Tabs, Typography, Spin, Button, Modal } from 'antd';
import { EyeOutlined, UserOutlined, HeartOutlined, EditOutlined, SearchOutlined, CloseOutlined, LeftOutlined, RightOutlined, CalendarOutlined, EnvironmentOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Gem, ClockPlus } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import LazyImage from '../components/LazyImage';
import LazyAvatar from '../components/LazyAvatar';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import ArticlePage from './ArticlePage';

dayjs.locale('ru');

const { Title, Paragraph, Text } = Typography;

type SortType = 'new' | 'popular';
type ShowcaseTab = 'experts' | 'events';

interface Article {
  id: number;
  title: string;
  content: string;
  cover_image?: string;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  views: number;
  likes_count: number;
  created_at: string;
}

interface EventPreview {
  id: number;
  title: string;
  description: string;
  cover_image?: string;
  event_type: string;
  is_online: boolean;
  city_name?: string;
  event_date: string;
  location?: string;
}

interface ShowcaseHighlight {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  accent: string;
  color: string;
}

interface HighlightCardProps {
  item: ShowcaseHighlight;
  compact?: boolean;
  isMobile: boolean;
  badges?: string[];
}

interface EventSpotlightProps {
  event: EventPreview;
  isMobile: boolean;
  description: string;
  onOpen: () => void;
}

interface ArticleCardProps {
  article: Article;
  onOpen: (articleId: number) => void;
  onOpenAuthor: (authorId: number) => void;
}

interface ArticleModalNavigationProps {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

// Оптимизированная функция для удаления HTML тегов
const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const SHOWCASE_TABS: Array<{ key: ShowcaseTab; label: string }> = [
  { key: 'experts', label: 'Эксперты' },
  { key: 'events', label: 'События' }
];

const ShowcaseHighlightCard = ({ item, compact = false, isMobile, badges = [] }: HighlightCardProps) => (
  <div
    onClick={item.onClick}
    style={{
      minHeight: compact ? 160 : isMobile ? 260 : 340,
      borderRadius: compact ? 24 : 28,
      padding: compact ? 22 : isMobile ? 20 : 28,
      background: item.accent,
      color: item.color,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      cursor: 'pointer',
      border: compact ? '1px solid rgba(226, 232, 240, 0.8)' : 'none',
      boxShadow: compact ? 'none' : '0 20px 40px rgba(79, 70, 229, 0.16)'
    }}
  >
    <div>
      <Text style={{ color: 'inherit', opacity: compact ? 0.68 : 0.76, fontSize: compact ? 12 : 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {item.eyebrow}
      </Text>
      <h3
        style={{
          margin: compact ? '10px 0 8px' : '14px 0 12px',
          fontSize: compact ? 24 : isMobile ? 28 : 38,
          lineHeight: compact ? 1.15 : 1.02,
          fontWeight: 500,
          color: 'inherit'
        }}
      >
        {item.title}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: compact ? 14 : 16,
          lineHeight: compact ? 1.6 : 1.65,
          color: 'inherit',
          opacity: compact ? 0.9 : 0.92,
          maxWidth: compact ? undefined : 460
        }}
      >
        {item.description}
      </p>
    </div>

    {compact ? (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
        {item.action}
        <ArrowRightOutlined />
      </div>
    ) : (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {badges.map((badge) => (
            <span
              key={badge}
              style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', fontSize: 13 }}
            >
              {badge}
            </span>
          ))}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
          {item.action}
          <ArrowRightOutlined />
        </div>
      </div>
    )}
  </div>
);

const EventSpotlightSection = ({ event, isMobile, description, onOpen }: EventSpotlightProps) => (
  <div
    style={{
      marginTop: 18,
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
      gap: 18,
      alignItems: 'stretch',
      position: 'relative',
      zIndex: 1
    }}
  >
    <div
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        minHeight: isMobile ? 320 : 420,
        height: '100%',
        position: 'relative',
        background: '#0f172a'
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        <LazyImage
          src={event.cover_image || '/eve.jpg'}
          alt={event.title}
          height="100%"
          style={{ width: '100%', height: '100%' }}
          imgStyle={{ objectFit: 'contain', objectPosition: 'center center' }}
          placeholderColor="#0f172a"
        />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(15,23,42,0.04) 0%, rgba(15,23,42,0.72) 100%)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 20,
          color: '#fff'
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
            {event.event_type}
          </span>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
            {event.is_online ? 'Онлайн' : 'Оффлайн'}
          </span>
        </div>
        <h4 style={{ margin: 0, fontSize: isMobile ? 22 : 28, lineHeight: 1.15, color: '#fff' }}>
          {event.title}
        </h4>
      </div>
    </div>

    <div
      style={{
        borderRadius: 24,
        padding: isMobile ? 20 : 24,
        background: '#ffffff',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 14px 32px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: isMobile ? undefined : 420,
        height: '100%'
      }}
    >
      <div>
        <Text style={{ color: '#4f46e5', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          В фокусе недели
        </Text>
        <h4 style={{ margin: '10px 0 16px', fontSize: 26, lineHeight: 1.15, color: '#0f172a', fontWeight: 500 }}>
          {event.title}
        </h4>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#475569', fontSize: 15 }}>
            <CalendarOutlined style={{ color: '#6366f1' }} />
            {dayjs(event.event_date).format('DD MMMM YYYY')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#475569', fontSize: 15 }}>
            <EnvironmentOutlined style={{ color: '#6366f1' }} />
            {event.is_online ? 'Онлайн-подключение' : (event.location || event.city_name || 'Локация уточняется')}
          </div>
        </div>
        <p style={{ margin: '16px 0 0', color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>
          {description}
        </p>
      </div>

      <Button
        type="primary"
        onClick={onOpen}
        style={{
          marginTop: 20,
          height: 46,
          borderRadius: 14,
          alignSelf: 'flex-start',
          paddingInline: 18
        }}
      >
        Открыть событие
      </Button>
    </div>
  </div>
);

const ArticleCard = memo(({ article, onOpen, onOpenAuthor }: ArticleCardProps) => (
  <div
    style={{
      height: '100%',
      background: 'white',
      borderRadius: 24,
      overflow: 'hidden',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -2px rgba(0, 0, 0, 0.01)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -2px rgba(0, 0, 0, 0.01)';
    }}
    onClick={() => onOpen(article.id)}
  >
    <div style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transition: 'transform 0.5s ease'
        }}
        className="card-image-wrapper"
      >
        <LazyImage
          src={article.cover_image || '/art.jpg'}
          alt={article.title}
          height="100%"
          style={{ width: '100%', objectFit: 'cover' }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          color: '#4b5563',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {dayjs(article.created_at).format('DD MMM')}
      </div>
    </div>

    <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 500,
          marginBottom: 12,
          lineHeight: 1.4,
          color: '#1f2937',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {article.title}
      </h3>

      <p
        style={{
          color: '#6b7280',
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 20,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {stripHtml(article.content)}
      </p>

      <div
        style={{
          paddingTop: 16,
          marginTop: 'auto',
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenAuthor(article.author_id);
          }}
        >
          <LazyAvatar
            size={32}
            src={article.author_avatar}
            defaultSrc="/emp.jpg"
            icon={<UserOutlined />}
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#4b5563' }}>
            {article.author_name}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, color: '#9ca3af', fontSize: 13 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <HeartOutlined /> {article.likes_count || 0}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <EyeOutlined /> {article.views}
          </span>
        </div>
      </div>
    </div>
  </div>
));

const ArticleModalNavigation = ({ currentIndex, total, onPrev, onNext }: ArticleModalNavigationProps) => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      background: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 2000
    }}
  >
    <Button
      type="text"
      icon={<LeftOutlined />}
      disabled={currentIndex <= 0}
      onClick={onPrev}
      style={{ flex: 1, height: '100%', fontSize: 15 }}
    >
      Назад
    </Button>
    <div style={{ width: 1, height: 24, background: '#eee' }} />
    <Button
      type="text"
      icon={<RightOutlined />}
      disabled={currentIndex >= total - 1}
      onClick={onNext}
      style={{ flex: 1, height: '100%', flexDirection: 'row-reverse', fontSize: 15 }}
    >
      Вперед
    </Button>
  </div>
);

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<SortType>('new');
  const [expertsCount, setExpertsCount] = useState<number>(0);
  const [eventsPreview, setEventsPreview] = useState<EventPreview[]>([]);
  const [showcaseTab, setShowcaseTab] = useState<ShowcaseTab>('experts');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(searchQuery);
  const searchTimeoutRef = useRef<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Мемоизированная функция загрузки статей
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/articles?sort=${sortType}`);
      const articlesData = response.data || [];
      setArticles(articlesData);
    } catch (error) {
      console.error('Ошибка загрузки статей:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [sortType]);

  // Мемоизированная функция загрузки количества экспертов
  const fetchExpertsCount = useCallback(async () => {
    try {
      const response = await api.get('/experts/count');
      setExpertsCount(response.data.count || 0);
    } catch (error) {
      console.error('Ошибка загрузки количества экспертов:', error);
      setExpertsCount(0);
    }
  }, []);

  const fetchEventsPreview = useCallback(async () => {
    try {
      const response = await api.get('/events');
      const now = dayjs();
      const eventsData = Array.isArray(response.data) ? response.data : [];
      const upcomingEvents = eventsData
        .filter((event: EventPreview) => dayjs(event.event_date).isAfter(now.subtract(1, 'day')))
        .sort((a: EventPreview, b: EventPreview) => dayjs(a.event_date).valueOf() - dayjs(b.event_date).valueOf())
        .slice(0, 3);

      setEventsPreview(upcomingEvents);
    } catch (error) {
      console.error('Ошибка загрузки событий для витрины:', error);
      setEventsPreview([]);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
    fetchExpertsCount();
    fetchEventsPreview();
  }, [fetchArticles, fetchExpertsCount, fetchEventsPreview]);

  // Debounce для поискового запроса (500ms)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Мемоизированная фильтрация статей
  const filteredArticles = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return articles;
    }

    const searchLower = debouncedSearchQuery.toLowerCase();
    return articles.filter(article => {
      return article.title.toLowerCase().includes(searchLower) ||
        (article.content && article.content.toLowerCase().includes(searchLower));
    });
  }, [debouncedSearchQuery, articles]);

  const nextEvent = useMemo(() => eventsPreview[0] || null, [eventsPreview]);

  const expertHighlights = useMemo<ShowcaseHighlight[]>(() => ([
    {
      eyebrow: 'Каталог',
      title: `${expertsCount}+ экспертов`,
      description: 'Психологи, проводники, наставники и практики, к которым можно перейти уже сейчас.',
      action: 'Перейти к экспертам',
      onClick: () => navigate('/experts'),
      accent: 'linear-gradient(135deg, rgba(99,102,241,0.95) 0%, rgba(129,140,248,0.88) 100%)',
      color: '#ffffff'
    },
    {
      eyebrow: 'Форматы',
      title: 'Личные и онлайн-сессии',
      description: 'Подберите удобный формат взаимодействия под свой ритм и запрос.',
      action: 'Найти формат',
      onClick: () => navigate('/experts'),
      accent: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(238,242,255,0.98) 100%)',
      color: '#312e81'
    },
    {
      eyebrow: 'Навигация',
      title: 'Поиск по подходу и энергии',
      description: 'Ищите не только по профессии, но и по ощущению совпадения с человеком.',
      action: 'Смотреть профили',
      onClick: () => navigate('/experts'),
      accent: 'linear-gradient(145deg, rgba(224,231,255,0.92) 0%, rgba(255,255,255,0.98) 100%)',
      color: '#312e81'
    }
  ]), [expertsCount, navigate]);

  const eventHighlights = useMemo<ShowcaseHighlight[]>(() => ([
    {
      eyebrow: nextEvent ? 'Ближайшее событие' : 'Афиша',
      title: nextEvent ? nextEvent.title : 'Собирайте свой календарь встреч',
      description: nextEvent
        ? `${dayjs(nextEvent.event_date).format('DD MMMM')} • ${nextEvent.is_online ? 'Онлайн' : (nextEvent.city_name || 'Оффлайн')}`
        : 'Ретриты, мастер-классы, практики и встречи, которые помогают быть в живом потоке.',
      action: 'Перейти к событиям',
      onClick: () => navigate('/events'),
      accent: 'linear-gradient(135deg, rgba(79,70,229,0.95) 0%, rgba(14,165,233,0.82) 100%)',
      color: '#ffffff'
    },
    {
      eyebrow: 'Форматы',
      title: 'Онлайн и офлайн',
      description: 'От камерных встреч в городе до дистанционных эфиров и групповых практик.',
      action: 'Открыть афишу',
      onClick: () => navigate('/events'),
      accent: 'linear-gradient(145deg, rgba(236,254,255,0.98) 0%, rgba(224,231,255,0.92) 100%)',
      color: '#164e63'
    },
    {
      eyebrow: 'Подборка',
      title: `${eventsPreview.length || 0} ближайших событий`,
      description: nextEvent?.event_type
        ? `Сейчас в фокусе: ${nextEvent.event_type.toLowerCase()}.`
        : 'Соберите маршрут по темам, датам и ощущениям.',
      action: 'Смотреть события',
      onClick: () => navigate('/events'),
      accent: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(224,242,254,0.98) 100%)',
      color: '#0f172a'
    }
  ]), [eventsPreview, nextEvent, navigate]);

  const activeHighlights = showcaseTab === 'experts' ? expertHighlights : eventHighlights;
  const hasSearchValue = searchQuery.trim().length > 0;
  const showcaseBadges = showcaseTab === 'experts'
    ? ['Личный подбор', 'Проверенные профили']
    : ['Ближайшие даты', 'Онлайн и офлайн'];
  const nextEventDescription = useMemo(() => {
    if (!nextEvent) return '';
    const plainDescription = stripHtml(nextEvent.description);
    return plainDescription.length > 160 ? `${plainDescription.slice(0, 160)}...` : plainDescription;
  }, [nextEvent]);

  // Мемоизированный обработчик изменения поиска
  const handleSearchChange = useCallback((value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set('q', value);
      } else {
        newParams.delete('q');
      }
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // State for article modal
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);

  const handleArticleClick = (articleId: number) => {
    setSelectedArticleId(articleId);
    setIsModalOpen(true);
    setModalClosing(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedArticleId(null);
      setModalClosing(false);
    }, 300);
  };

  const currentArticleIndex = useMemo(() => {
    return filteredArticles.findIndex(a => a.id === selectedArticleId);
  }, [filteredArticles, selectedArticleId]);

  const handlePrevArticle = () => {
    if (currentArticleIndex > 0) {
      setSelectedArticleId(filteredArticles[currentArticleIndex - 1].id);
    }
  };

  const handleNextArticle = () => {
    if (currentArticleIndex < filteredArticles.length - 1) {
      setSelectedArticleId(filteredArticles[currentArticleIndex + 1].id);
    }
  };

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      if (e.key === 'ArrowLeft') {
        handlePrevArticle();
      } else if (e.key === 'ArrowRight') {
        handleNextArticle();
      } else if (e.key === 'Escape') {
        handleCloseModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, currentArticleIndex, filteredArticles]);

  // Scroll to top when article changes
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedArticleId]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', margin: '-24px 0 0', paddingBottom: 24, overflowX: 'hidden' }}>
      {/* Hero Section */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(-45deg, #e0e7ff, #f3e8ff, #eef2ff, #f5f3ff)',
        backgroundSize: '400% 400%',
        animation: 'gradient-flow 15s ease infinite',
        padding: isMobile ? '40px 16px 60px' : '60px 24px 80px',
        borderRadius: '0 0 48px 48px',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        {/* Decorative background elements */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <Title level={1} style={{ fontSize: isMobile ? 32 : 48, color: '#1e1b4b', marginBottom: 16 }}>
            Soul Synergy
          </Title>
          <Paragraph style={{ fontSize: 18, color: '#4338ca', maxWidth: 600, margin: '0 auto' }}>
            Пространство для поиска смыслов, экспертов и живых событий.
          </Paragraph>
        </div>
      </div>

      <div className="container" style={{ marginTop: -40, position: 'relative', zIndex: 2, paddingBottom: 60 }}>
        <div
          style={{
            marginBottom: 32,
            transition: 'all 0.35s ease'
          }}
        >
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.98) 100%)',
            borderRadius: 32,
            padding: isMobile ? 20 : 28,
            border: '1px solid rgba(224, 231, 255, 0.95)',
            boxShadow: '0 24px 60px rgba(99, 102, 241, 0.08)'
          }}>
            <div style={{
            position: 'absolute',
            top: -80,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(129,140,248,0.18) 0%, rgba(129,140,248,0) 72%)'
            }} />

            <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 16,
            flexDirection: isMobile ? 'column' : 'row',
            marginBottom: 24,
            position: 'relative',
            zIndex: 1
            }}>
              <div style={{ maxWidth: 620 }}>
                <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 999,
                background: 'rgba(99, 102, 241, 0.08)',
                color: '#4f46e5',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 14
                }}>
                  Soul synergy
                </div>
                <Title level={2} style={{ margin: 0, fontSize: isMobile ? 28 : 36, lineHeight: 1.08, color: '#0f172a' }}>
                  Переключайтесь между людьми и живыми событиями в одном ритме
                </Title>
                <Paragraph style={{ margin: '12px 0 0', fontSize: 16, color: '#64748b', maxWidth: 560 }}>
                  Бенто-витрина помогает быстро выбрать, куда идти дальше: к экспертам за личной работой или в события за общим опытом и новыми знакомствами.
                </Paragraph>
              </div>

              <div style={{
              display: 'inline-flex',
              gap: 8,
              padding: 6,
              borderRadius: 999,
              background: 'rgba(15, 23, 42, 0.04)',
              border: '1px solid rgba(148, 163, 184, 0.14)'
              }}>
                {SHOWCASE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setShowcaseTab(tab.key)}
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: 999,
                      padding: isMobile ? '10px 14px' : '10px 18px',
                      fontSize: 14,
                      fontWeight: 600,
                      background: showcaseTab === tab.key ? '#ffffff' : 'transparent',
                      color: showcaseTab === tab.key ? '#312e81' : '#64748b',
                      boxShadow: showcaseTab === tab.key ? '0 10px 24px rgba(99, 102, 241, 0.12)' : 'none',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.35fr 0.85fr',
            gap: 18,
            position: 'relative',
            zIndex: 1
            }}>
              <ShowcaseHighlightCard
                item={activeHighlights[0]}
                isMobile={isMobile}
                badges={showcaseBadges}
              />

              <div style={{ display: 'grid', gap: 18 }}>
                {activeHighlights.slice(1).map((item) => (
                  <ShowcaseHighlightCard
                    key={item.title}
                    item={item}
                    compact
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>

            {showcaseTab === 'events' && nextEvent && (
              <EventSpotlightSection
                event={nextEvent}
                isMobile={isMobile}
                description={nextEventDescription}
                onOpen={() => navigate(`/events/${nextEvent.id}`)}
              />
            )}
          </div>
        </div>

        {/* Moved Search Bar */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto 32px' }}>
          <div style={{
            position: 'relative',
            background: 'white',
            borderRadius: 24,
            padding: '4px 8px 4px 24px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            maxWidth: 600,
            margin: '0 auto',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 15px 30px -10px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.05)';
            }}
          >
            <SearchOutlined style={{ fontSize: 20, color: '#818cf8' }} />
            <input
              placeholder="Найти статьи, авторов, вдохновение..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                width: '100%',
                padding: '10px 16px',
                fontSize: 16,
                outline: 'none',
                color: '#1f2937'
              }}
            />
          </div>
        </div>

        {/* Unified Toolbar */}
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: '8px 12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32
        }}>
          <Tabs
            activeKey={sortType}
            onChange={(key) => setSortType(key as 'new' | 'popular')}
            items={[
              {
                key: 'new',
                label: (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: 15,
                    fontWeight: 400,
                    color: sortType === 'new' ? 'rgb(99, 102, 241)' : 'rgb(188, 189, 251)',
                    transition: 'color 0.3s'
                  }}>
                    <ClockPlus size={18} />
                    <span>Новое</span>
                  </span>
                )
              },
              {
                key: 'popular',
                label: (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: 15,
                    fontWeight: 400,
                    color: sortType === 'popular' ? 'rgb(99, 102, 241)' : 'rgb(188, 189, 251)',
                    transition: 'color 0.3s'
                  }}>
                    <Gem size={18} />
                    <span>Популярное</span>
                  </span>
                )
              }
            ]}
            style={{
              marginBottom: 0,
              flex: 1
            }}
            tabBarStyle={{ marginBottom: 0, borderBottom: 'none' }}
          />

          {(user?.userType === 'expert' || user?.userType === 'admin') && (
            <Button
              type="primary"
              icon={<EditOutlined className="writing-icon" />}
              onClick={() => navigate('/create-article')}
              size={isMobile ? "middle" : "large"}
              style={{
                borderRadius: 16,
                background: '#6366f1',
                border: 'none',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                height: isMobile ? 36 : 40,
                padding: isMobile ? '0 12px' : '0 20px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                flex: isMobile ? 1 : 'none'
              }}
            >
              Создать статью
            </Button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'white',
            borderRadius: 24,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <Title level={4} style={{ marginBottom: 8 }}>Ничего не найдено</Title>
            <Text type="secondary">
              {searchQuery.trim()
                ? 'Попробуйте изменить поисковый запрос'
                : 'Статей пока нет. Будьте первыми!'}
            </Text>
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredArticles.map((article) => (
              <Col xs={24} sm={12} lg={8} key={article.id}>
                <ArticleCard
                  article={article}
                  onOpen={handleArticleClick}
                  onOpenAuthor={(authorId) => navigate(`/experts/${authorId}`)}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Article Modal */}
      <Modal
        title={null}
        footer={null}
        closable={false}
        onCancel={handleCloseModal}
        open={isModalOpen}
        width="100%"
        centered
        destroyOnClose
        maskStyle={{
          backgroundColor: isMobile ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: isMobile ? 'none' : 'blur(8px)',
          opacity: 1
        }}
        bodyStyle={{
          padding: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'transparent',
          boxShadow: 'none'
        }}
        style={{ padding: 0, maxWidth: '100%', top: 0 }}
      >
        <style>
          {`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .hide-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .ant-modal-content {
              box-shadow: none !important;
              background: transparent !important;
              border: none !important;
            }
          `}
        </style>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
          {/* Top Right Close Button */}
          <Button
            type="text"
            icon={<CloseOutlined style={{ fontSize: 24, color: '#000' }} />}
            onClick={handleCloseModal}
            style={{
              position: 'fixed',
              top: isMobile ? 12 : 40,
              right: isMobile ? 12 : 40,
              zIndex: 2000,
              width: 44,
              height: 44,
              display: isModalOpen ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isMobile ? 'rgba(255,255,255,0.8)' : 'transparent',
              borderRadius: '50%',
              boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.3s'
            }}
          />

          {/* Bottom Navigation Bar - Universal for all devices */}
          <ArticleModalNavigation
            currentIndex={currentArticleIndex}
            total={filteredArticles.length}
            onPrev={handlePrevArticle}
            onNext={handleNextArticle}
          />

          <div
            ref={scrollContainerRef}
            className="hide-scrollbar article-content-container"
            onClick={handleCloseModal}
            style={{
              overflowY: 'auto',
              flex: 1,
              paddingTop: 0,
              paddingBottom: 80, // Always leave space for the bottom nav
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              cursor: 'pointer'
            }}
          >
            <div style={{ width: '100%', maxWidth: 900, cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
              {selectedArticleId && (
                <ArticleContentWrapper articleId={selectedArticleId} />
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
const ArticleContentWrapper = ({ articleId }: { articleId: number }) => {
  return <ArticlePage embeddedArticleId={articleId} />;
};

export default HomePage;
