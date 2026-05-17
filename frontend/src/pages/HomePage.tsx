import { lazy, Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button, Modal } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import './HomePageV2.css';

dayjs.locale('ru');

const ArticlePage = lazy(() => import('./ArticlePage'));
const HOME_PRIMARY_CACHE_TTL = 2 * 60 * 1000;
const HOME_AUX_CACHE_TTL = 5 * 60 * 1000;

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

interface ExpertRow {
  id: number;
  name: string;
  avatar_url?: string;
  topics?: string[];
}

interface EventRow {
  id: number;
  title: string;
  event_date: string;
  price: string;
  is_online: boolean;
  city_name?: string;
}

interface DigitalProductPreview {
  title: string;
  price: string;
  author: string;
}

interface HomePrimaryCache {
  timestamp: number;
  articlesNew: Article[];
  events: EventRow[];
  expertsSide: ExpertRow[];
}

interface HomeAuxCache {
  timestamp: number;
  popularArticles?: Article[];
  expertsCount?: number;
  digitalPreview?: DigitalProductPreview[];
}

let homePrimaryCache: HomePrimaryCache | null = null;
let homeAuxCache: HomeAuxCache | null = null;

const TICKER_LINE = [
  { dot: 'var(--ss-teal)', text: 'Рахмат опубликовал новую практику' },
  { dot: 'var(--ss-accent)', text: 'Новый ченнелинг от Амины' },
  { dot: 'var(--ss-amber)', text: 'Эфир «Внутренний саботаж» сегодня в 20:00' },
  { dot: 'var(--ss-teal)', text: 'Анастасия вышла онлайн' },
  { dot: 'var(--ss-accent)', text: 'Дарья добавила запись эфира в цифровые продукты' },
  { dot: 'var(--ss-amber)', text: '17 участников зарегистрировались на ретрит' },
  { dot: 'var(--ss-teal)', text: 'Юлия обновила профиль мастера' },
  { dot: 'var(--ss-accent)', text: 'Новый мастер на платформе — Диана' },
];

const PILL_MAP: Record<string, string[]> = {
  healing: ['healing', 'practice'],
  spirit: ['spirit', 'channeling'],
  money: ['money', 'growth'],
  channeling: ['channeling', 'spirit'],
  practice: ['practice', 'healing'],
};

const PHOTOS = ['🌊', '💰', '🎙️', '🎧', '🌿', '✨', '🏔️', '🌙', '🧘', '🔥', '🌐', '📄'];

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function inferTags(text: string): string[] {
  const t = text.toLowerCase();
  const tags = new Set<string>();

  if (/деньг|рост|доход|финанс|потолок|масштаб/.test(t)) {
    tags.add('money');
    tags.add('growth');
  }
  if (/исцел|тел|здоров|тело|психосомат/.test(t)) {
    tags.add('healing');
    tags.add('practice');
  }
  if (/духов|ченнел|архетип|медитац|целитель|энерг/.test(t)) {
    tags.add('spirit');
    tags.add('channeling');
  }
  if (/практик|медитац|йог|гипноз/.test(t)) {
    tags.add('practice');
  }
  if (/ченнелинг|channeling|послание/.test(t)) {
    tags.add('channeling');
  }
  if (/ретрит|эфир|событ|тренинг/.test(t)) {
    tags.add('practice');
  }
  if (!tags.size) {
    tags.add('spirit');
  }

  return [...tags];
}

function animateCount(el: HTMLElement | null, target: number, duration = 1400) {
  if (!el || target < 0) return;

  let start: number | null = null;

  const step = (ts: number) => {
    if (start === null) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = String(Math.round(eased * target));

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { user, token } = useAuth();

  const [articlesNew, setArticlesNew] = useState<Article[]>([]);
  const [articlesPopular, setArticlesPopular] = useState<Article[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [expertsSide, setExpertsSide] = useState<ExpertRow[]>([]);
  const [digitalPreview, setDigitalPreview] = useState<DigitalProductPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [popularLoaded, setPopularLoaded] = useState(false);
  const [popularLoading, setPopularLoading] = useState(false);

  const [feedTab, setFeedTab] = useState<'stream' | 'popular' | 'events'>('stream');
  const [pillActive, setPillActive] = useState<string | null>(null);

  const [heroSearch, setHeroSearch] = useState(searchQuery);

  const [stats, setStats] = useState({ experts: 0, articles: 0, eventsMonth: 0, digital: 0 });

  const s1 = useRef<HTMLDivElement>(null);
  const s2 = useRef<HTMLDivElement>(null);
  const s3 = useRef<HTMLDivElement>(null);
  const s4 = useRef<HTMLDivElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setHeroSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (homePrimaryCache && Date.now() - homePrimaryCache.timestamp < HOME_PRIMARY_CACHE_TTL) {
      setArticlesNew(homePrimaryCache.articlesNew);
      setEvents(homePrimaryCache.events);
      setExpertsSide(homePrimaryCache.expertsSide);
      setLoading(false);
    }

    if (homeAuxCache && Date.now() - homeAuxCache.timestamp < HOME_AUX_CACHE_TTL) {
      if (homeAuxCache.popularArticles) {
        setArticlesPopular(homeAuxCache.popularArticles);
        setPopularLoaded(true);
      }
      if (homeAuxCache.digitalPreview) {
        setDigitalPreview(homeAuxCache.digitalPreview);
      }
      if (typeof homeAuxCache.expertsCount === 'number') {
        setStats((prev) => ({ ...prev, experts: homeAuxCache?.expertsCount ?? prev.experts }));
      }
    }

    let alive = true;

    (async () => {
      if (!homePrimaryCache || Date.now() - homePrimaryCache.timestamp >= HOME_PRIMARY_CACHE_TTL) {
        setLoading(true);
      }

      try {
        const [newRes, evRes, exRes] = await Promise.all([
          api.get('/articles?sort=new'),
          api.get('/events'),
          api.get('/experts/search?limit=8&order=newest'),
        ]);

        if (!alive) return;

        const nextArticles = Array.isArray(newRes.data) ? newRes.data : [];
        const nextEvents = Array.isArray(evRes.data) ? evRes.data : [];
        const nextExperts = Array.isArray(exRes.data) ? exRes.data : [];

        setArticlesNew(nextArticles);
        setEvents(nextEvents);
        setExpertsSide(nextExperts);
        setStats((prev) => ({
          ...prev,
          articles: nextArticles.length,
          eventsMonth: nextEvents.filter((event) => dayjs(event.event_date).month() === dayjs().month()).length,
        }));

        homePrimaryCache = {
          timestamp: Date.now(),
          articlesNew: nextArticles,
          events: nextEvents,
          expertsSide: nextExperts,
        };
      } catch (error) {
        console.error(error);
        if (alive) {
          if (!homePrimaryCache) {
            setArticlesNew([]);
            setEvents([]);
            setExpertsSide([]);
          }
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (feedTab !== 'popular' || popularLoaded) return;

    let alive = true;

    (async () => {
      setPopularLoading(true);
      try {
        const response = await api.get('/articles?sort=popular');
        if (!alive) return;

        const nextPopular = Array.isArray(response.data) ? response.data : [];
        setArticlesPopular(nextPopular);
        setPopularLoaded(true);
        homeAuxCache = {
          ...homeAuxCache,
          timestamp: Date.now(),
          popularArticles: nextPopular,
        };
      } catch (error) {
        console.error('Ошибка загрузки популярных статей:', error);
      } finally {
        if (alive) {
          setPopularLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [feedTab, popularLoaded]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (typeof homeAuxCache?.expertsCount === 'number') {
          return;
        }

        const response = await api.get('/experts/count');
        if (!alive) return;

        const expertsCount = response.data?.count ?? 0;
        setStats((prev) => ({ ...prev, experts: expertsCount }));
        homeAuxCache = {
          ...homeAuxCache,
          timestamp: Date.now(),
          expertsCount,
        };
      } catch {
        // ignore stats enrichment errors
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      let alive = true;

      (async () => {
        if (!expertsSide.length) {
          setDigitalPreview([]);
          return;
        }

        if (homeAuxCache?.digitalPreview && Date.now() - homeAuxCache.timestamp < HOME_AUX_CACHE_TTL) {
          setDigitalPreview(homeAuxCache.digitalPreview);
          return;
        }

        const sampleExperts = expertsSide.slice(0, 3);
        try {
          const results = await Promise.all(
            sampleExperts.map((expert) =>
              api.get(`/products/expert/${expert.id}`).then((response) => ({
                expert,
                products: response.data || [],
              })).catch(() => ({
                expert,
                products: [],
              }))
            )
          );

          if (!alive) return;

          const preview = results
            .flatMap(({ expert, products }) =>
              products
                .filter((product: { product_type?: string }) => product.product_type === 'digital')
                .map((product: { title: string; price: string }) => ({
                  title: product.title,
                  price: `${product.price} ₽`,
                  author: expert.name,
                }))
            )
            .slice(0, 3);

          setDigitalPreview(preview);
          setStats((prev) => ({ ...prev, digital: preview.length }));
          homeAuxCache = {
            ...homeAuxCache,
            timestamp: Date.now(),
            digitalPreview: preview,
          };
        } catch {
          // ignore deferred preview errors
        }
      })();

      return () => {
        alive = false;
      };
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [expertsSide]);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      if (!alive) return;
      animateCount(s1.current, stats.experts);
      animateCount(s2.current, stats.articles >= 100 ? 100 : stats.articles);
      animateCount(s3.current, stats.eventsMonth);
      animateCount(s4.current, stats.digital);
    }, 320);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [stats]);

  const articlesMain = feedTab === 'popular' ? articlesPopular : articlesNew;

  const filteredArticles = useMemo(() => {
    let list = articlesMain;
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      list = list.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          stripHtml(article.content || '').toLowerCase().includes(query)
      );
    }

    if (pillActive && PILL_MAP[pillActive]) {
      const mapped = PILL_MAP[pillActive];
      list = list.filter((article) => {
        const tags = inferTags(`${article.title} ${stripHtml(article.content)}`);
        return mapped.some((tag) => tags.includes(tag));
      });
    }

    return list;
  }, [articlesMain, searchQuery, pillActive]);

  const featured = useMemo(() => {
    if (!filteredArticles.length) return null;
    return filteredArticles.find((article) => article.is_pinned) || filteredArticles[0];
  }, [filteredArticles]);

  const gridArticles = useMemo(() => {
    if (!featured) return filteredArticles;
    return filteredArticles.filter((article) => article.id !== featured.id);
  }, [filteredArticles, featured]);

  const sidebarEvents = useMemo(() => events.slice(0, 4), [events]);

  const applySearch = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (heroSearch.trim()) next.set('q', heroSearch.trim());
      else next.delete('q');
      return next;
    });
  }, [heroSearch, setSearchParams]);

  const openArticle = (id: number) => {
    setSelectedArticleId(id);
    setModalOpen(true);
  };

  const cabinetHref =
    user?.userType === 'expert' || user?.userType === 'admin' ? '/expert-dashboard' : '/profile';
  const cabinetLabel =
    user?.userType === 'expert' || user?.userType === 'admin' ? 'Кабинет мастера' : 'Личный кабинет';

  const onPill = (filter: string) => {
    setPillActive((prev) => (prev === filter ? null : filter));
  };

  const tagClassForArticle = (article: Article): string => {
    const tags = inferTags(`${article.title} ${stripHtml(article.content)}`);
    if (tags.includes('money')) return 'ss-ta';
    if (tags.includes('healing') || tags.includes('practice')) return 'ss-tt';
    return 'ss-tp';
  };

  const tagLabelForArticle = (article: Article): string => {
    const tags = inferTags(`${article.title} ${stripHtml(article.content)}`);
    if (tags.includes('money')) return 'Рост · Тема';
    if (tags.includes('healing')) return 'Здоровье';
    if (tags.includes('channeling')) return 'Ченнелинг';
    if (tags.includes('practice')) return 'Практика';
    return 'Материал';
  };

  const emojiFor = (id: number) => PHOTOS[id % PHOTOS.length];

  const cardDimmed = (article: Article) => {
    if (!pillActive || !PILL_MAP[pillActive]) return false;
    const tags = inferTags(`${article.title} ${stripHtml(article.content)}`);
    return !PILL_MAP[pillActive].some((tag) => tags.includes(tag));
  };

  const monthLabel = dayjs().format('MMMM');

  const renderArticleCard = (article: Article, featuredCard: boolean) => {
    const dimmed = cardDimmed(article);
    const cover = article.cover_image ? (
      <img src={article.cover_image} alt="" />
    ) : (
      <span aria-hidden>{emojiFor(article.id)}</span>
    );

    return (
      <article
        key={article.id}
        className={`ss-card ${featuredCard ? 'ss-feat' : ''} ${dimmed ? 'ss-dimmed' : ''}`}
        onClick={() => openArticle(article.id)}
      >
        <div className="ss-c-img">{cover}</div>
        <div className="ss-c-body">
          <span className={`ss-ctag ${tagClassForArticle(article)}`}>{tagLabelForArticle(article)}</span>
          <div className="ss-c-title">{article.title}</div>
          {featuredCard ? <div className="ss-c-excerpt">{stripHtml(article.content).slice(0, 140)}…</div> : null}
          <div className="ss-c-meta">
            {dayjs(article.created_at).format('DD MMM')} · {article.author_name}
            {featuredCard ? ` · ${article.views.toLocaleString('ru-RU')} просм.` : ''}
          </div>
        </div>
        {!featuredCard ? (
          <div className="ss-c-foot">
            <span>
              {article.author_avatar ? (
                <img className="ss-avxs" src={article.author_avatar} alt="" />
              ) : (
                <span className="ss-avxs" />
              )}
              <span style={{ fontSize: 11, color: 'var(--ss-text-2)' }}>{article.author_name}</span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--ss-text-3)' }}>
              ♥ {article.likes_count || 0} · {article.views}
            </span>
          </div>
        ) : null}
      </article>
    );
  };

  const renderEventCard = (event: EventRow, featuredCard: boolean) => {
    const paid = event.price && event.price !== '0' && String(event.price).toLowerCase() !== 'бесплатно';

    return (
      <article
        key={event.id}
        className={`ss-card ss-type-ev ${featuredCard ? 'ss-feat' : ''}`}
        onClick={() => navigate(`/events/${event.id}`)}
      >
        <div className="ss-c-img" style={{ background: 'var(--ss-accent-pale)', fontSize: featuredCard ? 42 : 38 }}>
          🎙️
        </div>
        <div className="ss-c-body">
          <span className="ss-ctag ss-tp">
            {event.is_online ? 'Онлайн' : event.city_name || 'Оффлайн'} · {dayjs(event.event_date).format('DD MMM')}
          </span>
          <div className="ss-c-title">{event.title}</div>
          {featuredCard ? (
            <div className="ss-c-excerpt">
              {dayjs(event.event_date).format('DD MMMM')} · {event.is_online ? 'Онлайн' : event.city_name || ''}
            </div>
          ) : null}
          <div className="ss-c-meta">{dayjs(event.event_date).format('HH:mm')}</div>
        </div>
        <div className="ss-c-foot">
          {paid ? <span className="ss-pill-paid">{event.price}</span> : <span className="ss-pill-free">Бесплатно</span>}
          <span style={{ fontSize: 11, color: 'var(--ss-accent)', cursor: 'pointer' }}>Подробнее →</span>
        </div>
      </article>
    );
  };

  const tickerDup = [...TICKER_LINE, ...TICKER_LINE];

  return (
    <div className="home-v2">
      <nav className="ss-nav">
        <Link className="ss-nav-logo" to="/">
          <div className="ss-logo-mark">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 1.5C7 1.5 4.5 4.2 4.5 7C4.5 8.38 5.62 9.5 7 9.5C8.38 9.5 9.5 8.38 9.5 7C9.5 4.2 7 1.5 7 1.5Z"
                fill="white"
                opacity=".9"
              />
              <path
                d="M7 9.5C7 9.5 9.8 8.7 11.5 7C10.2 10.8 7 12.5 7 12.5C7 12.5 3.8 10.8 2.5 7C4.2 8.7 7 9.5 7 9.5Z"
                fill="white"
                opacity=".55"
              />
            </svg>
          </div>
          SoulSynergy
        </Link>

        <div className="ss-nav-links">
          <Link className={`ss-nl ${location.pathname === '/' ? 'ss-active' : ''}`} to="/">
            Главная
          </Link>
          <Link className={`ss-nl ${location.pathname.startsWith('/experts') ? 'ss-active' : ''}`} to="/experts">
            Мастера
          </Link>
          <Link className={`ss-nl ${location.pathname.startsWith('/events') ? 'ss-active' : ''}`} to="/events">
            Практики
          </Link>
          <Link className="ss-nl" to="/expert-landing">
            Цифровые продукты<span className="ss-ndot" />
          </Link>
          <button type="button" className="ss-nl" onClick={() => navigate('/')}>
            Дзен
          </button>
        </div>

        <div className="ss-nav-right">
          {token ? (
            <Link className="ss-ibt" to="/chats" aria-label="Чаты">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
                <path
                  d="M2 2.5h11v7.5H8L5.5 12.5V10H2V2.5z"
                  stroke="currentColor"
                  strokeWidth=".9"
                  fill="none"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ) : null}

          <Link className="ss-ibt" to={token ? '/profile' : '/login'} aria-label="Профиль">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
              <path
                d="M7.5 1.5C5.3 1.5 3.5 3.3 3.5 5.5V9L2 10.5h11L11.5 9V5.5C11.5 3.3 9.7 1.5 7.5 1.5Z"
                stroke="currentColor"
                strokeWidth=".9"
                fill="none"
              />
              <path d="M6.2 12a1.3 1.3 0 002.6 0" stroke="currentColor" strokeWidth=".9" />
            </svg>
          </Link>

          <Link className="ss-cab-btn" to={token ? cabinetHref : '/login'}>
            {cabinetLabel}
          </Link>

          <Link to={token ? cabinetHref : '/login'} className="ss-ava" aria-label="Профиль">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : null}
          </Link>
        </div>
      </nav>

      <div className="ss-ticker-wrap">
        <div className="ss-ticker-track">
          {tickerDup.map((line, index) => (
            <div key={index} className="ss-ti">
              <span className="ss-tdot" style={{ background: line.dot }} />
              {line.text}
            </div>
          ))}
        </div>
      </div>

      <section className="ss-hero">
        <div className="ss-hero-bg" />
        <div className="ss-pulse-wrap">
          <div className="ss-pr" />
          <div className="ss-pr ss-pr2" />
        </div>

        <div className="ss-eyebrow">
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
            <circle cx="4" cy="4" r="3" fill="#7B6FD4" />
          </svg>
          Сообщество практик и мастеров
        </div>

        <h1>
          Откройте своего мастера
          <br />
          и найдите <em>свой путь</em>
        </h1>

        <p className="ss-hero-sub">
          Лента живых практик, записи эфиров, события и каталог настоящих специалистов — всё в одном пространстве.
        </p>

        <p className="ss-res-label">Что сейчас ваш запрос?</p>
        <div className="ss-res-pills">
          {(
            [
              ['healing', 'ss-on-t', 'Исцеление и тело'],
              ['spirit', 'ss-on-p', 'Духовный путь'],
              ['money', 'ss-on-a', 'Рост и деньги'],
              ['channeling', 'ss-on-p', 'Ченнелинг'],
              ['practice', 'ss-on-t', 'Практики'],
            ] as const
          ).map(([key, cls, label]) => (
            <button
              key={key}
              type="button"
              className={`ss-rp ${pillActive === key ? cls : ''}`}
              onClick={() => onPill(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ss-hero-search">
          <span className="ss-s-ico" aria-hidden>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.1" />
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
          </span>
          <input
            className="ss-s-inp"
            type="search"
            placeholder="Поиск по статьям, мастерам и практикам..."
            value={heroSearch}
            onChange={(e) => setHeroSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
          />
          <button type="button" className="ss-s-btn" onClick={applySearch}>
            Найти
          </button>
        </div>

        <div className="ss-hero-stats">
          <div className="ss-stat">
            <div className="ss-stat-n" ref={s1}>0</div>
            <div className="ss-stat-l">мастеров</div>
          </div>
          <div className="ss-stat">
            <div className="ss-stat-n" ref={s2}>0</div>
            <div className="ss-stat-l">статей в ленте</div>
          </div>
          <div className="ss-stat">
            <div className="ss-stat-n" ref={s3}>0</div>
            <div className="ss-stat-l">{`событий в ${monthLabel}`}</div>
          </div>
          <div className="ss-stat">
            <div className="ss-stat-n" ref={s4}>0</div>
            <div className="ss-stat-l">цифровых продуктов</div>
          </div>
        </div>
      </section>

      <div className="ss-page">
        <main>
          <div className="ss-feed-header">
            <button
              type="button"
              className={`ss-ftab ${feedTab === 'stream' ? 'ss-on' : ''}`}
              onClick={() => setFeedTab('stream')}
            >
              Живой поток
            </button>
            <button
              type="button"
              className={`ss-ftab ${feedTab === 'popular' ? 'ss-on' : ''}`}
              onClick={() => setFeedTab('popular')}
            >
              Популярное
            </button>
            <button
              type="button"
              className={`ss-ftab ${feedTab === 'events' ? 'ss-on' : ''}`}
              onClick={() => setFeedTab('events')}
            >
              События
            </button>
          </div>

          {loading || (feedTab === 'popular' && popularLoading && !popularLoaded) ? (
            <div className="ss-loading">Загрузка ленты…</div>
          ) : feedTab === 'events' ? (
            <div className="ss-feed-grid">
              {events.slice(0, 1).map((event) => renderEventCard(event, true))}
              {events.slice(1).map((event) => renderEventCard(event, false))}
              {!events.length ? <div className="ss-empty">Событий пока нет</div> : null}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="ss-empty">Ничего не найдено — попробуйте сбросить фильтры или поиск</div>
          ) : (
            <>
              <div className="ss-feed-grid">
                {featured ? renderArticleCard(featured, true) : null}
                {gridArticles.map((article) => renderArticleCard(article, false))}
              </div>
              <button type="button" className="ss-more-btn" onClick={() => navigate('/experts')}>
                Показать ещё
              </button>
            </>
          )}
        </main>

        <aside className="ss-sidebar">
          <div className="ss-side-card">
            <div className="ss-side-title">Мастера онлайн</div>
            {expertsSide.slice(0, 4).map((expert, index) => (
              <button
                key={expert.id}
                type="button"
                className="ss-ex-item"
                onClick={() => navigate(`/experts/${expert.id}`)}
              >
                <div className="ss-ex-ava">
                  {expert.avatar_url ? <img src={expert.avatar_url} alt="" /> : PHOTOS[expert.id % PHOTOS.length]}
                </div>
                <div>
                  <div className="ss-ex-name">{expert.name}</div>
                  <div className="ss-ex-role">
                    {index < 3 ? (
                      <>
                        <span className="ss-online-pip" />
                        онлайн · {(expert.topics && expert.topics[0]) || 'Эксперт'}
                      </>
                    ) : (
                      <span style={{ color: 'var(--ss-text-3)' }}>был(а) недавно</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
            <Link className="ss-side-link" to="/experts">
              Смотреть каталог →
            </Link>
          </div>

          <div className="ss-side-card">
            <div className="ss-side-title">Ближайшие события</div>
            {sidebarEvents.map((event) => (
              <div key={event.id} className="ss-ev-item">
                <div className="ss-ev-when">{dayjs(event.event_date).format('DD MMMM · HH:mm')}</div>
                <div className="ss-ev-title">{event.title}</div>
                <div className="ss-ev-foot">
                  {event.price && event.price !== '0' ? (
                    <span className="ss-pill-paid">{event.price}</span>
                  ) : (
                    <span className="ss-pill-free">Бесплатно</span>
                  )}
                  <Link to={`/events/${event.id}`} style={{ fontSize: 11, color: 'var(--ss-accent)', textDecoration: 'none' }}>
                    →
                  </Link>
                </div>
              </div>
            ))}
            {!sidebarEvents.length ? (
              <div style={{ fontSize: 12, color: 'var(--ss-text-3)' }}>Нет предстоящих событий</div>
            ) : null}
            <Link className="ss-side-link" to="/events">
              Вся афиша →
            </Link>
          </div>

          <div className="ss-side-card">
            <div className="ss-side-title">
              Цифровые практики <span className="ss-new-badge">Новый раздел</span>
            </div>
            {digitalPreview.length ? (
              digitalPreview.map((item, index) => (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  className="ss-dp-item"
                  onClick={() => navigate('/experts')}
                >
                  <div className="ss-dp-ico" style={{ background: 'var(--ss-teal-light)' }}>
                    🎧
                  </div>
                  <div>
                    <div className="ss-dp-title">{item.title}</div>
                    <div className="ss-dp-price">
                      {item.author} · {item.price}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div style={{ fontSize: 12, color: 'var(--ss-text-3)' }}>Продукты появятся в профилях мастеров</div>
            )}
            <Link className="ss-side-link" to="/experts">
              Смотреть все →
            </Link>
          </div>

          <div className="ss-join-blk">
            <h3>Вы — мастер или эксперт?</h3>
            <p>Создайте профиль, публикуйте практики и находите своих клиентов через доверие и резонанс.</p>
            <button type="button" className="ss-jbtn ss-jbtn-w" onClick={() => navigate('/register')}>
              Создать профиль
            </button>
            <button type="button" className="ss-jbtn ss-jbtn-t" onClick={() => navigate('/expert-landing')}>
              Узнать больше
            </button>
          </div>
        </aside>
      </div>

      <Modal
        title={null}
        footer={null}
        closable={false}
        onCancel={() => {
          setModalOpen(false);
          setSelectedArticleId(null);
        }}
        open={modalOpen}
        width="100%"
        centered
        destroyOnClose
        maskStyle={{
          backgroundColor: isMobile ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: isMobile ? 'none' : 'blur(8px)',
          opacity: 1,
        }}
        bodyStyle={{
          padding: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'transparent',
          boxShadow: 'none',
        }}
        style={{ padding: 0, maxWidth: '100%', top: 0 }}
      >
        <style>
          {`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .ant-modal-content { box-shadow: none !important; background: transparent !important; border: none !important; }
          `}
        </style>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
          <Button
            type="text"
            icon={<CloseOutlined style={{ fontSize: 24, color: '#2d2a4a' }} />}
            onClick={() => {
              setModalOpen(false);
              setSelectedArticleId(null);
            }}
            style={{
              position: 'fixed',
              top: isMobile ? 12 : 40,
              right: isMobile ? 12 : 40,
              zIndex: 2000,
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />

          <div
            className="hide-scrollbar"
            style={{
              overflowY: 'auto',
              flex: 1,
              paddingBottom: 80,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div style={{ width: '100%', maxWidth: 900 }}>
              {selectedArticleId ? (
                <Suspense fallback={<div className="ss-loading">Загрузка статьи…</div>}>
                  <ArticlePage embeddedArticleId={selectedArticleId} />
                </Suspense>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
