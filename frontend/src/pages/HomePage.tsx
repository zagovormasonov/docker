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
import './HomePage.css';

dayjs.locale('ru');

/** Запасной фон hero, если нет незакреплённых статей (public/wall.jpg) */
const HERO_WALL_SRC = `${import.meta.env.BASE_URL}wall.jpg`;
const HERO_PRELOAD_LINK_ID = 'home-hero-spotlight-preload';

const { Title, Text } = Typography;

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
  is_pinned?: boolean;
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
}

interface HighlightCardProps {
  item: ShowcaseHighlight;
  compact?: boolean;
  badges?: string[];
}

interface EventSpotlightProps {
  event: EventPreview;
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

const HERO_POPULAR_LINKS: Array<{ label: string; action: 'experts' | 'events' | 'showcase' | 'articles' | 'expert' }> = [
  { label: 'Эксперты', action: 'experts' },
  { label: 'События', action: 'events' },
  { label: 'Витрина', action: 'showcase' },
  { label: 'Статьи', action: 'articles' },
  { label: 'Стать экспертом', action: 'expert' }
];

const ShowcaseHighlightCard = ({ item, compact = false, badges = [] }: HighlightCardProps) => (
  <div
    role="button"
    tabIndex={0}
    onClick={item.onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.onClick();
      }
    }}
    className={`vast-highlight ${compact ? 'vast-highlight--compact' : 'vast-highlight--hero'}`}
  >
    <div>
      <span className="vast-highlight__eyebrow">{item.eyebrow}</span>
      <h3 className="vast-highlight__title">{item.title}</h3>
      <p className="vast-highlight__desc">{item.description}</p>
    </div>

    {compact ? (
      <div className="vast-highlight__footer">
        <span className="vast-highlight__action">
          {item.action}
          <ArrowRightOutlined />
        </span>
      </div>
    ) : (
      <div className="vast-highlight__footer">
        <div className="vast-highlight__badges">
          {badges.map((badge) => (
            <span key={badge} className="vast-highlight__badge">
              {badge}
            </span>
          ))}
        </div>
        <span className="vast-highlight__action">
          {item.action}
          <ArrowRightOutlined />
        </span>
      </div>
    )}
  </div>
);

const EventSpotlightSection = ({ event, description, onOpen }: EventSpotlightProps) => (
  <div className="home-vast-event">
    <div className="home-vast-event__visual">
      <div className="home-vast-event__img-wrap">
        <LazyImage
          src={event.cover_image || '/eve.jpg'}
          alt={event.title}
          height="100%"
          style={{ width: '100%', height: '100%' }}
          imgStyle={{ objectFit: 'cover', objectPosition: 'center center' }}
          placeholderColor="#0a0a0c"
        />
      </div>
      <div className="home-vast-event__gradient" />
      <div className="home-vast-event__caption">
        <div className="home-vast-event__tags">
          <span className="home-vast-event__tag">{event.event_type}</span>
          <span className="home-vast-event__tag">{event.is_online ? 'Онлайн' : 'Оффлайн'}</span>
        </div>
        <h4 className="home-vast-event__title">{event.title}</h4>
      </div>
    </div>

    <div className="home-vast-event__panel">
      <div>
        <span className="home-vast-event__kicker">В фокусе недели</span>
        <h4 className="home-vast-event__panel-title">{event.title}</h4>
        <div className="home-vast-event__meta">
          <div className="home-vast-event__meta-row">
            <CalendarOutlined />
            {dayjs(event.event_date).format('DD MMMM YYYY')}
          </div>
          <div className="home-vast-event__meta-row">
            <EnvironmentOutlined />
            {event.is_online ? 'Онлайн-подключение' : (event.location || event.city_name || 'Локация уточняется')}
          </div>
        </div>
        <p className="home-vast-event__desc">{description}</p>
      </div>

      <Button type="primary" onClick={onOpen} style={{ marginTop: 20, alignSelf: 'flex-start', height: 44, paddingInline: 22 }}>
        Открыть событие
      </Button>
    </div>
  </div>
);

const ArticleCard = memo(({ article, onOpen, onOpenAuthor }: ArticleCardProps) => (
  <div className="home-vast-article" onClick={() => onOpen(article.id)}>
    <div className="home-vast-article__media">
      <div style={{ position: 'absolute', inset: 0 }} className="card-image-wrapper">
        <LazyImage
          src={article.cover_image || '/art.jpg'}
          alt={article.title}
          height="100%"
          style={{ width: '100%', objectFit: 'cover' }}
        />
      </div>
      <span className="home-vast-article__date">{dayjs(article.created_at).format('DD MMM')}</span>
    </div>

    <div className="home-vast-article__body">
      <h3 className="home-vast-article__title">{article.title}</h3>
      <p className="home-vast-article__excerpt">{stripHtml(article.content)}</p>
      <div className="home-vast-article__footer">
        <div
          className="home-vast-article__author"
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
          <span>{article.author_name}</span>
        </div>
        <div className="home-vast-article__meta">
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
  /** Самая популярная незакреплённая статья для блока hero (отдельно от сортировки ленты) */
  const [heroSpotlightArticle, setHeroSpotlightArticle] = useState<Article | null>(null);
  const [heroSpotlightReady, setHeroSpotlightReady] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await api.get('/articles?sort=popular');
        const rows: Article[] = Array.isArray(response.data) ? response.data : [];
        const unpinned = rows
          .filter((a) => !a.is_pinned)
          .sort((a, b) => (b.views ?? 0) - (a.views ?? 0) || dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf());
        if (!cancelled) {
          setHeroSpotlightArticle(unpinned[0] ?? null);
        }
      } catch {
        if (!cancelled) setHeroSpotlightArticle(null);
      } finally {
        if (!cancelled) setHeroSpotlightReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      onClick: () => navigate('/experts')
    },
    {
      eyebrow: 'Форматы',
      title: 'Личные и онлайн-сессии',
      description: 'Подберите удобный формат взаимодействия под свой ритм и запрос.',
      action: 'Найти формат',
      onClick: () => navigate('/experts')
    },
    {
      eyebrow: 'Навигация',
      title: 'Поиск по подходу и энергии',
      description: 'Ищите не только по профессии, но и по ощущению совпадения с человеком.',
      action: 'Смотреть профили',
      onClick: () => navigate('/experts')
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
      onClick: () => navigate('/events')
    },
    {
      eyebrow: 'Форматы',
      title: 'Онлайн и офлайн',
      description: 'От камерных встреч в городе до дистанционных эфиров и групповых практик.',
      action: 'Открыть афишу',
      onClick: () => navigate('/events')
    },
    {
      eyebrow: 'Подборка',
      title: `${eventsPreview.length || 0} ближайших событий`,
      description: nextEvent?.event_type
        ? `Сейчас в фокусе: ${nextEvent.event_type.toLowerCase()}.`
        : 'Соберите маршрут по темам, датам и ощущениям.',
      action: 'Смотреть события',
      onClick: () => navigate('/events')
    }
  ]), [eventsPreview, nextEvent, navigate]);

  const activeHighlights = showcaseTab === 'experts' ? expertHighlights : eventHighlights;
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
  const showcaseSectionRef = useRef<HTMLDivElement>(null);
  const articlesFeedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedArticleId]);

  const scrollToShowcase = useCallback(() => {
    showcaseSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToArticlesFeed = useCallback(() => {
    articlesFeedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleHeroPopularClick = useCallback(
    (action: (typeof HERO_POPULAR_LINKS)[number]['action']) => {
      switch (action) {
        case 'experts':
          navigate('/experts');
          break;
        case 'events':
          navigate('/events');
          break;
        case 'showcase':
          scrollToShowcase();
          break;
        case 'articles':
          scrollToArticlesFeed();
          break;
        case 'expert':
          navigate('/become-expert');
          break;
      }
    },
    [navigate, scrollToShowcase, scrollToArticlesFeed]
  );

  const heroSpotlightImageSrc = heroSpotlightArticle
    ? (heroSpotlightArticle.cover_image || '/art.jpg')
    : HERO_WALL_SRC;

  // Preload обложки популярной статьи или запасного wall после определения spotlight
  useEffect(() => {
    if (!heroSpotlightReady) return;
    const existing = document.getElementById(HERO_PRELOAD_LINK_ID);
    existing?.remove();
    const link = document.createElement('link');
    link.id = HERO_PRELOAD_LINK_ID;
    link.rel = 'preload';
    link.as = 'image';
    link.href = heroSpotlightImageSrc;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [heroSpotlightReady, heroSpotlightImageSrc]);

  return (
    <div className="home-vast home-vast--dribbble" style={{ paddingBottom: 24 }}>
      <section className="home-db-hero" aria-label="Главный экран">
        <div className="container home-db-hero__inner">
          <div className="home-db-hero__row">
            <div className="home-db-hero__text">
              <p className="home-db-hero__kicker">SoulSynergy — сообщество практик и экспертов</p>
              <h1 className="home-db-hero__title">
                <span className="home-db-hero__title-line">Откройте лучших</span>
                <span className="home-db-hero__title-line home-db-hero__title-line--accent">экспертов и практики</span>
              </h1>
              <p className="home-db-hero__sub">
                Лента материалов, афиша событий и каталог специалистов — всё в одном месте: ясная структура, много воздуха и акцент на людях и практиках.
              </p>
              <div className="home-db-hero__popular">
                <span className="home-db-hero__popular-label">Популярное:</span>
                <div className="home-db-hero__pills">
                  {HERO_POPULAR_LINKS.map(({ label, action }) => (
                    <button
                      key={label}
                      type="button"
                      className="home-db-pill"
                      onClick={() => handleHeroPopularClick(action)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="home-db-hero__cta">
                <button type="button" className="home-db-btn home-db-btn--primary" onClick={() => navigate('/experts')}>
                  Смотреть каталог
                </button>
                <button type="button" className="home-db-btn home-db-btn--secondary" onClick={() => navigate('/events')}>
                  Афиша событий
                </button>
              </div>
              <ul className="home-db-hero__stats" aria-label="Краткая статистика">
                <li>
                  <span className="home-db-hero__stats-value">{expertsCount}</span>
                  <span className="home-db-hero__stats-label">экспертов</span>
                </li>
                <li>
                  <span className="home-db-hero__stats-value">{articles.length}</span>
                  <span className="home-db-hero__stats-label">статей</span>
                </li>
                <li>
                  <span className="home-db-hero__stats-value">{eventsPreview.length}</span>
                  <span className="home-db-hero__stats-label">событий скоро</span>
                </li>
              </ul>
            </div>
            <div className="home-db-hero__visual">
              <div
                className={`home-db-hero__shot${heroSpotlightArticle ? ' home-db-hero__shot--article' : ''}${!heroSpotlightReady ? ' home-db-hero__shot--loading' : ''}`}
                role={heroSpotlightArticle ? 'button' : undefined}
                tabIndex={heroSpotlightArticle ? 0 : undefined}
                onClick={() => {
                  if (heroSpotlightArticle) handleArticleClick(heroSpotlightArticle.id);
                }}
                onKeyDown={(e) => {
                  if (!heroSpotlightArticle) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleArticleClick(heroSpotlightArticle.id);
                  }
                }}
                aria-label={heroSpotlightArticle ? `Открыть статью: ${heroSpotlightArticle.title}` : undefined}
              >
                {!heroSpotlightReady ? null : heroSpotlightArticle ? (
                  <>
                    <img
                      src={heroSpotlightImageSrc}
                      alt=""
                      width={1200}
                      height={900}
                      sizes="(max-width: 900px) 100vw, 480px"
                      decoding="async"
                      fetchPriority="high"
                      loading="eager"
                      className="home-db-hero__shot-img"
                    />
                    <div className="home-db-hero__shot-scrim" aria-hidden />
                    <div className="home-db-hero__shot-caption">
                      <span className="home-db-hero__shot-eyebrow">Популярное сейчас</span>
                      <p className="home-db-hero__shot-title">{heroSpotlightArticle.title}</p>
                      <span className="home-db-hero__shot-meta">
                        <EyeOutlined aria-hidden /> {heroSpotlightArticle.views ?? 0}
                        <span className="home-db-hero__shot-meta-sep" aria-hidden />
                        <HeartOutlined aria-hidden /> {heroSpotlightArticle.likes_count ?? 0}
                      </span>
                    </div>
                  </>
                ) : (
                  <img
                    src={HERO_WALL_SRC}
                    alt=""
                    width={1200}
                    height={900}
                    sizes="(max-width: 900px) 100vw, 480px"
                    decoding="async"
                    fetchPriority="high"
                    loading="eager"
                    className="home-db-hero__shot-img"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container home-vast-inner">
        <div ref={showcaseSectionRef} className="home-db-showcase-anchor" style={{ marginBottom: 32 }}>
          <div className="home-vast-panel">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: 16,
                flexDirection: isMobile ? 'column' : 'row',
                marginBottom: 24
              }}
            >
              <div style={{ maxWidth: 640 }}>
                <h2 className="home-vast-section-title">Витрина направлений</h2>
                <p className="home-vast-section-desc">
                  Переключайтесь между экспертами и событиями — выбирайте формат, который откликается сейчас: личная работа или общий опыт и новые знакомства.
                </p>
              </div>
              <div className="home-vast-tabs-wrap">
                {SHOWCASE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setShowcaseTab(tab.key)}
                    className={`home-vast-tab-btn${showcaseTab === tab.key ? ' home-vast-tab-btn--active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1.35fr 0.85fr',
                gap: 18
              }}
            >
              <ShowcaseHighlightCard item={activeHighlights[0]} badges={showcaseBadges} />
              <div style={{ display: 'grid', gap: 18 }}>
                {activeHighlights.slice(1).map((item) => (
                  <ShowcaseHighlightCard key={item.title} item={item} compact />
                ))}
              </div>
            </div>

            {showcaseTab === 'events' && nextEvent && (
              <EventSpotlightSection
                event={nextEvent}
                description={nextEventDescription}
                onOpen={() => navigate(`/events/${nextEvent.id}`)}
              />
            )}
          </div>
        </div>

        <div ref={articlesFeedRef} className="home-db-feed-anchor" />
        <div className="home-vast-search">
          <SearchOutlined />
          <input
            placeholder="Поиск по статьям и темам..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Поиск статей"
          />
        </div>

        <div className="home-vast-toolbar">
          <Tabs
            activeKey={sortType}
            onChange={(key) => setSortType(key as 'new' | 'popular')}
            items={[
              {
                key: 'new',
                label: (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'inherit'
                    }}
                  >
                    <ClockPlus size={17} />
                    <span>Новое</span>
                  </span>
                )
              },
              {
                key: 'popular',
                label: (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'inherit'
                    }}
                  >
                    <Gem size={17} />
                    <span>Популярное</span>
                  </span>
                )
              }
            ]}
            style={{ marginBottom: 0, flex: 1 }}
            tabBarStyle={{ marginBottom: 0, borderBottom: 'none' }}
          />

          {(user?.userType === 'expert' || user?.userType === 'admin') && (
            <Button
              type="primary"
              icon={<EditOutlined className="writing-icon" />}
              onClick={() => navigate('/create-article')}
              size={isMobile ? 'middle' : 'large'}
              style={{
                flex: isMobile ? 1 : 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Создать статью
            </Button>
          )}
        </div>

        {loading ? (
          <div className="home-vast-loading">
            <Spin size="large" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="home-vast-empty">
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>◇</div>
            <Title level={4} style={{ marginBottom: 8, color: 'inherit' }}>Ничего не найдено</Title>
            <Text style={{ color: 'var(--vast-muted)' }}>
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
