import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Row, Col, Tabs, Typography, Spin, Button, Modal } from 'antd';
import { EyeOutlined, UserOutlined, HeartOutlined, EditOutlined, SearchOutlined, CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Gem, ClockPlus, Moon, Sun, Star, Zap, Feather, Heart, Sparkles } from 'lucide-react';
import OrbitingCircles from '../components/magicui/OrbitingCircles';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import LazyImage from '../components/LazyImage';
import LazyAvatar from '../components/LazyAvatar';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import ArticlePage from './ArticlePage';
import './HomePage.css';

dayjs.locale('ru');


const { Title, Text } = Typography;

type SortType = 'new' | 'popular';

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

 interface Expert {
  id: number;
  name: string;
  avatar_url?: string;
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



const ArticleCard = memo(({ article, onOpen, onOpenAuthor }: ArticleCardProps) => (
  <div className="home-vast-article" onClick={() => onOpen(article.id)}>
    <div className="home-vast-article__inner">
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(searchQuery);
  const searchTimeoutRef = useRef<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  const [orbitExperts, setOrbitExperts] = useState<Expert[]>([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchOrbitExperts = async () => {
      try {
        const response = await api.get('/experts/search?limit=8&order=newest');
        setOrbitExperts(response.data || []);
      } catch (error) {
        console.error('Ошибка загрузки экспертов для орбиты:', error);
      }
    };
    fetchOrbitExperts();
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

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

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

  return (
    <div className="home-vast" style={{ paddingBottom: 24, position: 'relative' }}>
      <div className="magic-radial-fade" />
      <section className="home-db-hero" aria-label="Главный экран" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container home-db-hero__inner">
          <div className="home-db-hero__row">
            <div className="home-db-hero__text">
              <div className="home-db-hero__orbit">
                {orbitExperts.slice(0, 2).map((expert, i) => (
                  <OrbitingCircles key={expert.id} radius={50} duration={20} delay={i * 10}>
                    <div className="orbit-avatar-wrapper" onClick={() => navigate(`/experts/${expert.id}`)}>
                      <LazyAvatar src={expert.avatar_url} size={32} icon={<UserOutlined />} />
                    </div>
                  </OrbitingCircles>
                ))}
                {orbitExperts.slice(2, 5).map((expert, i) => (
                  <OrbitingCircles key={expert.id} radius={90} duration={30} delay={i * 10} reverse>
                    <div className="orbit-avatar-wrapper" onClick={() => navigate(`/experts/${expert.id}`)}>
                      <LazyAvatar src={expert.avatar_url} size={38} icon={<UserOutlined />} />
                    </div>
                  </OrbitingCircles>
                ))}
                {orbitExperts.slice(5, 8).map((expert, i) => (
                  <OrbitingCircles key={expert.id} radius={135} duration={45} delay={i * 15}>
                    <div className="orbit-avatar-wrapper" onClick={() => navigate(`/experts/${expert.id}`)}>
                      <LazyAvatar src={expert.avatar_url} size={44} icon={<UserOutlined />} />
                    </div>
                  </OrbitingCircles>
                ))}
                <div className="orbit-center">
                  <Sparkles size={24} className="orbit-center-icon" />
                </div>
              </div>
              <p className="home-db-hero__kicker">SoulSynergy — сообщество практик и экспертов</p>
              <h1 className="home-db-hero__title">
                <span className="home-db-hero__title-line">Откройте лучших</span>
                <span className="home-db-hero__title-line home-db-hero__title-line--accent magic-gradient-text">экспертов и практики</span>
              </h1>
              <p className="home-db-hero__sub">
                Лента материалов, афиша событий и каталог специалистов — всё в одном месте: ясная структура, много воздуха и акцент на людях и практиках.
              </p>
              <div className="home-db-hero__search">
                <div className="home-vast-search">
                  <SearchOutlined />
                  <input
                    placeholder="Поиск по статьям и темам..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    aria-label="Поиск статей"
                  />
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
            </div>
          </div>
        </div>
      </section>

      <div className="container home-vast-inner">

        <div className="home-vast-toolbar">
          <div className="home-vast-filters">
            <button
              className={`home-vast-filter ${sortType === 'new' ? 'is-active' : ''}`}
              onClick={() => setSortType('new')}
            >
              <ClockPlus size={16} />
              <span>Новое</span>
            </button>
            <button
              className={`home-vast-filter ${sortType === 'popular' ? 'is-active' : ''}`}
              onClick={() => setSortType('popular')}
            >
              <Gem size={16} />
              <span>Популярное</span>
            </button>
          </div>

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
