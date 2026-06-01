import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import './DzenPage.css';

type TagClass = 'dz-tp' | 'dz-tt' | 'dz-ta';

interface Article {
  id: number;
  author_id: number;
  title: string;
  content: string;
  category?: string;
  cover_image?: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  views: number;
  likes_count: number;
}

const TAGS = [
  '#ченнелинг', '#психология', '#деньги', '#пробуждение',
  '#цолькин', '#выгорание', '#медитация', '#исцеление',
  '#саботаж', '#ретрит', '#духовность', '#тело',
];

const TOPIC_PILLS = [
  { key: '', label: 'Все темы' },
  { key: 'chan', label: 'Ченнелинг' },
  { key: 'psych', label: 'Психология' },
  { key: 'soul', label: 'Духовный путь' },
  { key: 'money', label: 'Деньги и рост' },
  { key: 'body', label: 'Тело и здоровье' },
  { key: 'zolk', label: 'Цолькин' },
  { key: 'story', label: 'Истории мастеров' },
];

const FEED_TABS = [
  { key: 'all', label: 'Всё подряд' },
  { key: 'new', label: 'Новое' },
  { key: 'pop', label: 'Популярное' },
  { key: 'chan', label: 'Ченнелинги' },
  { key: 'my', label: 'Мои авторы' },
];

const EDIT_LABEL = '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c';

const stripHtml = (html: string) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const inferTopics = (article: Article) => {
  if (article.category) {
    return [article.category];
  }

  const t = `${article.title} ${stripHtml(article.content)}`.toLowerCase();
  const tags = new Set<string>();

  if (/ченнел|послани|дух|энерг|архетип|медитац/.test(t)) {
    tags.add('chan');
    tags.add('soul');
  }
  if (/псих|саботаж|травм|страх|выгоран/.test(t)) {
    tags.add('psych');
  }
  if (/деньг|рост|доход|изобил|финанс/.test(t)) {
    tags.add('money');
  }
  if (/тело|здоров|исцел|психосомат|телес/.test(t)) {
    tags.add('body');
  }
  if (/цолькин|кин|майян|майя|тон/.test(t)) {
    tags.add('zolk');
  }
  if (/история|мой путь|как я|опыт/.test(t)) {
    tags.add('story');
  }
  if (!tags.size) {
    tags.add('soul');
  }

  return [...tags];
};

const getTagMeta = (article: Article): { label: string; className: TagClass } => {
  const topics = inferTopics(article);

  if (topics.includes('money')) return { label: 'Деньги и рост', className: 'dz-ta' };
  if (topics.includes('psych')) return { label: 'Психология', className: 'dz-ta' };
  if (topics.includes('body')) return { label: 'Тело и здоровье', className: 'dz-tt' };
  if (topics.includes('zolk')) return { label: 'Цолькин', className: 'dz-tp' };
  if (topics.includes('story')) return { label: 'История мастера', className: 'dz-tt' };
  if (topics.includes('chan')) return { label: 'Ченнелинг', className: 'dz-tp' };
  return { label: 'Духовный путь', className: 'dz-tp' };
};

const renderArticleImage = (article: Article, className: string, eager = false) => (
  <div className={className}>
    {article.cover_image ? (
      <img
        src={article.cover_image}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    ) : (
      '📝'
    )}
  </div>
);

function Reader({
  article,
  canEdit,
  onClose,
  onEdit,
  onDelete,
  onAuthorClick,
}: {
  article: Article;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAuthorClick: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const tagMeta = getTagMeta(article);

  return (
    <div className="dz-reader-overlay" onClick={onClose}>
      <div className="dz-reader" onClick={(e) => e.stopPropagation()}>
        <div className="dz-reader-hdr">
          <button type="button" className="dz-reader-back" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Назад
          </button>
          {canEdit && (
            <div className="dz-reader-actions">
              <button type="button" className="dz-reader-edit" aria-label={EDIT_LABEL} onClick={onEdit}>
                Редактировать
              </button>
              <button type="button" className="dz-reader-delete" onClick={onDelete}>
                Удалить
              </button>
            </div>
          )}
        </div>
        {renderArticleImage(article, 'dz-reader-img', true)}
        <div className="dz-reader-body">
          <span className={`dz-reader-cat ${tagMeta.className}`}>{tagMeta.label}</span>
          <div className="dz-reader-title">{article.title}</div>
          <div className="dz-reader-meta">
            <button type="button" className="dz-reader-author" onClick={onAuthorClick}>
              <span className="dz-avxs">
                <img src={article.author_avatar || '/emp.jpg'} alt="" loading="lazy" decoding="async" />
              </span>
              <span>{article.author_name}</span>
            </button>
            <span className="dz-art-date">{dayjs(article.created_at).format('DD MMM YYYY')}</span>
            <span className="dz-art-read">👁 {article.views}</span>
          </div>
          <div className="dz-reader-text" dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
        <div className="dz-reader-foot">
          <button type="button" className="dz-like-btn">❤ Нравится · {article.likes_count || 0}</button>
        </div>
      </div>
    </div>
  );
}

const DzenPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isExpert = user?.userType === 'expert' || user?.userType === 'admin';

  const [activeTopic, setActiveTopic] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const [readerArticle, setReaderArticle] = useState<Article | null>(null);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [articlesNew, setArticlesNew] = useState<Article[]>([]);
  const [articlesPopular, setArticlesPopular] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [newRes, popularRes] = await Promise.all([
          api.get('/articles?sort=new&section=dzen'),
          api.get('/articles?sort=popular&section=dzen'),
        ]);

        if (!alive) return;
        setArticlesNew(Array.isArray(newRes.data) ? newRes.data : []);
        setArticlesPopular(Array.isArray(popularRes.data) ? popularRes.data : []);
      } catch (error) {
        console.error('Ошибка загрузки Дзена:', error);
        if (alive) {
          setArticlesNew([]);
          setArticlesPopular([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const toggleFollow = (name: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const topicFilter = activeTab === 'chan' ? 'chan' : activeTopic;
  const baseArticles = activeTab === 'pop' ? articlesPopular : articlesNew;
  const isSearchMode = query.trim().length > 0;

  const visibleArticles = useMemo(() => {
    let list = [...baseArticles];
    const q = query.toLowerCase().trim();

    if (activeTab === 'my') {
      list = list.filter((article) => followed.has(article.author_name));
    }

    if (topicFilter) {
      list = list.filter((article) => inferTopics(article).includes(topicFilter));
    }

    if (q) {
      list = list.filter((article) => {
        const plain = stripHtml(article.content).toLowerCase();
        return article.title.toLowerCase().includes(q) || article.author_name.toLowerCase().includes(q) || plain.includes(q);
      });
    }

    return list;
  }, [baseArticles, activeTab, followed, query, topicFilter]);

  const featured = isSearchMode ? null : visibleArticles[0] || null;
  const gridArticles = isSearchMode ? [] : visibleArticles.slice(1, 5);
  const listArticles = isSearchMode ? visibleArticles : visibleArticles.slice(5);

  const trending = useMemo(() => articlesPopular.slice(0, 5), [articlesPopular]);

  const sideAuthors = useMemo(() => {
    const counts = new Map<string, { id: number; name: string; avatar?: string; count: number }>();
    for (const article of articlesNew) {
      const current = counts.get(article.author_name) || {
        id: article.author_id,
        name: article.author_name,
        avatar: article.author_avatar,
        count: 0,
      };
      current.count += 1;
      if (!current.avatar && article.author_avatar) current.avatar = article.author_avatar;
      counts.set(article.author_name, current);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 4);
  }, [articlesNew]);

  const openCreateArticle = useCallback(() => {
    navigate('/create-article?publishNow=1&redirectTo=/dzen&section=dzen');
  }, [navigate]);

  const openEditArticle = useCallback((articleId: number) => {
    navigate(`/edit-article/${articleId}?publishNow=1&redirectTo=/dzen&section=dzen`);
  }, [navigate]);

  const removeArticleFromFeeds = useCallback((articleId: number) => {
    setArticlesNew((items) => items.filter((article) => article.id !== articleId));
    setArticlesPopular((items) => items.filter((article) => article.id !== articleId));
    setReaderArticle((article) => article?.id === articleId ? null : article);
  }, []);

  const deleteArticle = useCallback(async (article: Article) => {
    if (!window.confirm('Удалить статью? Это действие нельзя отменить.')) return;

    try {
      await api.delete(`/articles/${article.id}`);
      removeArticleFromFeeds(article.id);
    } catch (error) {
      console.error('Ошибка удаления статьи:', error);
      alert('Не удалось удалить статью');
    }
  }, [removeArticleFromFeeds]);

  const openAuthorProfile = useCallback((authorId: number) => {
    navigate(`/experts/${authorId}`);
  }, [navigate]);

  return (
    <div className="dz-page">
      {readerArticle && (
        <Reader
          article={readerArticle}
          canEdit={user?.id === readerArticle.author_id}
          onClose={() => setReaderArticle(null)}
          onEdit={() => openEditArticle(readerArticle.id)}
          onDelete={() => deleteArticle(readerArticle)}
          onAuthorClick={() => openAuthorProfile(readerArticle.author_id)}
        />
      )}

      <div className="dz-hero">
        <div className="dz-hero-top">
          <div className="dz-hero-left">
            <div className="dz-eyebrow">
              <svg width="7" height="7" viewBox="0 0 7 7" aria-hidden><circle cx="3.5" cy="3.5" r="3" fill="#7B6FD4" /></svg>
              Живые тексты платформы
            </div>
            <div className="dz-hero-title">Дзен — читайте <em>живых мастеров</em></div>
            <div className="dz-hero-sub">Ченнелинги, практики, психология, истории и размышления от экспертов сообщества.</div>
          </div>
          {isExpert && (
            <button type="button" className="dz-write-btn" onClick={openCreateArticle}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2 10l1.5-3.5L10 0l2 2-6.5 7.5L2 10z" stroke="#fff" strokeWidth="1" fill="none" strokeLinejoin="round" />
                <path d="M8.5 1.5l2 2" stroke="#fff" strokeWidth="1" />
              </svg>
              Написать статью
            </button>
          )}
        </div>

        <div className="dz-search">
          <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="dz-search-ico" aria-hidden>
            <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.1" />
            <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <input
            className="dz-search-inp"
            type="text"
            placeholder="Поиск по статьям и авторам..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="dz-feed-tabs">
          {FEED_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`dz-ftab${activeTab === t.key ? ' dz-on' : ''}`}
              onClick={() => {
                setActiveTab(t.key);
                setActiveTopic(t.key === 'chan' ? 'chan' : '');
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dz-topic-bar">
        {TOPIC_PILLS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`dz-pill${topicFilter === p.key ? ' dz-on' : ''}`}
            onClick={() => {
              setActiveTopic(p.key);
              setActiveTab('all');
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="dz-layout">
        <div className="dz-main">
          {loading ? (
            <div className="dz-more-btn" style={{ cursor: 'default' }}>Загрузка статей...</div>
          ) : (
            <>
              {featured && (
                <div className="dz-feat" onClick={() => setReaderArticle(featured)}>
                  {renderArticleImage(featured, 'dz-feat-img', true)}
                  <div className="dz-feat-body">
                    <span className={`dz-fa-tag ${getTagMeta(featured).className}`}>{getTagMeta(featured).label}</span>
                    <div className="dz-feat-title">{featured.title}</div>
                    <div className="dz-feat-excerpt">{stripHtml(featured.content).slice(0, 220)}...</div>
                    <div className="dz-art-meta">
                      <span className="dz-art-author"><span className="dz-avxs"><img src={featured.author_avatar || '/emp.jpg'} alt="" loading="lazy" decoding="async" /></span>{featured.author_name}</span>
                      <span className="dz-art-date">{dayjs(featured.created_at).format('DD MMM YYYY')}</span>
                      <span className="dz-art-read">❤ {featured.likes_count} · 👁 {featured.views}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="dz-grid">
                {gridArticles.map((article) => (
                  <div key={article.id} className="dz-card" onClick={() => setReaderArticle(article)}>
                    {renderArticleImage(article, 'dz-card-img')}
                    <div className="dz-card-body">
                      <span className={`dz-ac-tag ${getTagMeta(article).className}`}>{getTagMeta(article).label}</span>
                      <div className="dz-card-title">{article.title}</div>
                      <div className="dz-card-excerpt">{stripHtml(article.content).slice(0, 120)}...</div>
                      <div className="dz-card-foot">
                        <span className="dz-ac-author"><span className="dz-avxs"><img src={article.author_avatar || '/emp.jpg'} alt="" loading="lazy" decoding="async" /></span>{article.author_name}</span>
                        <span className="dz-ac-stats">❤ {article.likes_count} · 👁 {article.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`dz-list${isSearchMode ? ' dz-search-results' : ''}`}>
                {listArticles.map((article) => (
                  <div key={article.id} className="dz-list-item" onClick={() => setReaderArticle(article)}>
                    {renderArticleImage(article, 'dz-list-img')}
                    <div className="dz-list-body">
                      <span className={`dz-al-tag ${getTagMeta(article).className}`}>{getTagMeta(article).label}</span>
                      <div className="dz-list-title">{article.title}</div>
                      <div className="dz-list-meta">
                        <span className="dz-al-author"><span className="dz-avxs"><img src={article.author_avatar || '/emp.jpg'} alt="" loading="lazy" decoding="async" /></span>{article.author_name}</span>
                        <span className="dz-al-stats">{dayjs(article.created_at).format('DD MMM')} · ❤ {article.likes_count} · 👁 {article.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!visibleArticles.length && <button type="button" className="dz-more-btn">Статей пока нет</button>}
            </>
          )}
        </div>

        <aside className="dz-sidebar">
          <div className="dz-side-sec">
            <div className="dz-side-h">Популярное сейчас</div>
            {trending.map((article, index) => (
              <div key={article.id} className="dz-tr-item" onClick={() => setReaderArticle(article)}>
                <span className="dz-tr-num">{index + 1}</span>
                <div>
                  <div className="dz-tr-title">{article.title}</div>
                  <div className="dz-tr-meta">{article.author_name} · {article.views} просмотров</div>
                </div>
              </div>
            ))}
          </div>

          <div className="dz-side-sec">
            <div className="dz-side-h">Авторы для подписки</div>
            {sideAuthors.map((author) => (
              <div key={author.name} className="dz-author-item">
                <button type="button" className="dz-author-profile" onClick={() => openAuthorProfile(author.id)}>
                  <span className="dz-author-ava">
                    <img src={author.avatar || '/emp.jpg'} alt="" loading="lazy" decoding="async" />
                  </span>
                </button>
                <div className="dz-author-info">
                  <button type="button" className="dz-author-name" onClick={() => openAuthorProfile(author.id)}>{author.name}</button>
                  <div className="dz-author-sub">{author.count} статей · эксперт</div>
                </div>
                <button
                  type="button"
                  className={`dz-follow-btn${followed.has(author.name) ? ' dz-following' : ''}`}
                  onClick={() => toggleFollow(author.name)}
                >
                  {followed.has(author.name) ? '✓ Читаю' : '+ Читать'}
                </button>
              </div>
            ))}
          </div>

          <div className="dz-side-sec">
            <div className="dz-side-h">Темы</div>
            <div className="dz-tags-cloud">
              {TAGS.map((tag) => (
                <span key={tag} className="dz-tc-tag">{tag}</span>
              ))}
            </div>
          </div>

          {isExpert && (
            <div className="dz-side-sec">
              <div className="dz-promo-block">
                <div className="dz-promo-title">Пишите о своём пути</div>
                <div className="dz-promo-sub">Публикуйте статьи, практики и размышления — материал сразу появится в Дзене.</div>
                <button type="button" className="dz-promo-btn" onClick={openCreateArticle}>
                  Написать статью
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default DzenPage;
