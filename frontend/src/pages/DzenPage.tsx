import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DzenPage.css';

/* ── Types ───────────────────────────────────────────────── */
type TagClass = 'dz-tp' | 'dz-tt' | 'dz-ta';

interface Article {
  id: number;
  topics: string[];
  author: string;
  date: string;
  read?: string;
  likes: number;
  views: string;
  emoji: string;
  bg: string;
  tagClass: TagClass;
  tagLabel: string;
  title: string;
  excerpt: string;
  fullText?: string;
}

interface SideAuthor {
  emoji: string;
  name: string;
  count: string;
  role: string;
}

interface TrendItem {
  title: string;
  meta: string;
}

/* ── Data ────────────────────────────────────────────────── */
const FEATURED: Article = {
  id: 0,
  topics: ['chan', 'soul'],
  author: 'Амина',
  date: '02 апр 2026',
  read: '5 мин',
  likes: 127,
  views: '3.4к',
  emoji: '🌊',
  bg: '#eae8fb',
  tagClass: 'dz-tp',
  tagLabel: 'Ченнелинг',
  title: 'Апрель 2026 — послание духа света. Время перехода',
  excerpt:
    'Послание для тех, кто стоит на пороге. Апрель — месяц сдвигов. Энергии говорят: время отпустить старое и шагнуть в неизвестность с доверием...',
  fullText:
    '<p>Послание для тех, кто стоит на пороге. Апрель — месяц сдвигов, перехода и обновления.</p><p>Энергии говорят: время отпустить старое и шагнуть в неизвестность с доверием. Это не прыжок в пропасть — это полёт.</p><p>Те, кто долго ждали «правильного момента» — этот момент наступил. Не потому что всё стало идеально. А потому что вы сами стали готовы.</p><p>Апрель активирует зону самовыражения. Говорите. Пишите. Показывайте себя.</p>',
};

const GRID_ARTICLES: Article[] = [
  {
    id: 1,
    topics: ['psych', 'money'],
    author: 'Дарья',
    date: '30 мар 2026',
    likes: 56,
    views: '874',
    emoji: '💰',
    bg: '#fdf2e0',
    tagClass: 'dz-ta',
    tagLabel: 'Психология · Деньги',
    title: '7 признаков внутреннего саботажа роста',
    excerpt: 'Почему даже самые умные эксперты остаются в тени? Разбираем механизмы.',
    fullText: '<p>Почему даже самые умные эксперты остаются в тени? Разбираем 7 механизмов внутреннего саботажа.</p><p>Саботаж — это не слабость. Это защита психики от неизвестного. Чем раньше вы это признаете, тем быстрее сможете двигаться вперёд.</p>',
  },
  {
    id: 2,
    topics: ['soul', 'chan'],
    author: 'Роман',
    date: '28 мар 2026',
    likes: 31,
    views: '612',
    emoji: '✨',
    bg: '#eae8fb',
    tagClass: 'dz-tp',
    tagLabel: 'Духовный путь',
    title: 'Магирани и архетипы нового времени',
    excerpt: 'Кто такие духовные лидеры нового времени? Как узнать, что ты — из них?',
    fullText: '<p>Магирани — это те, кто пришёл в этот мир с особой миссией трансформации. Они чувствуют себя «не такими» с самого детства.</p><p>Как узнать себя? Ответ внутри.</p>',
  },
  {
    id: 3,
    topics: ['body', 'soul'],
    author: 'Юлия',
    date: '26 мар 2026',
    likes: 18,
    views: '430',
    emoji: '🌿',
    bg: '#e2f7f0',
    tagClass: 'dz-tt',
    tagLabel: 'Тело и здоровье',
    title: 'Путь осознанного взросления: тело как учитель',
    excerpt: 'Всё, что мы не прожили — остаётся в теле. Как вернуться к себе.',
    fullText: '<p>Тело хранит всё. Каждое подавленное чувство, каждый непрожитый опыт — всё это живёт в мышцах, суставах, органах.</p><p>Осознанное взросление начинается с возвращения к телу.</p>',
  },
  {
    id: 4,
    topics: ['psych', 'money'],
    author: 'Дарья',
    date: '22 мар 2026',
    likes: 88,
    views: '2.1к',
    emoji: '🔥',
    bg: '#fdf2e0',
    tagClass: 'dz-ta',
    tagLabel: 'Выгорание',
    title: 'Выгорание эксперта: как я потеряла себя в работе',
    excerpt: 'Личная история и выход. Когда успех стал клеткой.',
    fullText: '<p>Это случилось не сразу. Постепенно. Я замечала усталость, но списывала её на загруженность. Пока однажды не проснулась и не смогла встать с кровати.</p><p>Это была точка невозврата. И одновременно — точка спасения.</p>',
  },
];

const LIST_ARTICLES: Article[] = [
  {
    id: 5,
    topics: ['zolk', 'chan'],
    author: 'Мадам Цолькин',
    date: '31 мар',
    likes: 64,
    views: '1.8к',
    emoji: '🌙',
    bg: '#eae8fb',
    tagClass: 'dz-tp',
    tagLabel: 'Цолькин',
    title: 'Мадам Цолькин: апрель 2026 — ваш код и задача месяца',
    excerpt: '',
    fullText: '<p>Апрель 2026 в календаре Цолькин — время Тона 4. Четыре — число структуры, формы, стабильности.</p><p>Ваша задача месяца: выстроить фундамент для нового цикла.</p>',
  },
  {
    id: 6,
    topics: ['soul', 'chan'],
    author: 'Амина',
    date: '28 мар',
    likes: 43,
    views: '1.1к',
    emoji: '🔮',
    bg: '#eae8fb',
    tagClass: 'dz-tp',
    tagLabel: 'Ченнелинг',
    title: 'Послания духа света: как открыться каналу и не потеряться',
    excerpt: '',
    fullText: '<p>Открыться каналу — значит научиться слышать тонкие сигналы. Это навык, который развивается с практикой.</p><p>Главное правило: всегда возвращайтесь в тело.</p>',
  },
  {
    id: 7,
    topics: ['body', 'psych'],
    author: 'Роман',
    date: '25 мар',
    likes: 72,
    views: '2.4к',
    emoji: '🧘',
    bg: '#e2f7f0',
    tagClass: 'dz-tt',
    tagLabel: 'Психосоматика',
    title: 'Психосоматика: почему болит спина — и при чём тут мама',
    excerpt: '',
    fullText: '<p>Спина — это опора. В психосоматике боли в спине связаны с нехваткой поддержки, перегрузом ответственности и страхом потери почвы под ногами.</p><p>«Мама» здесь — метафора первичной поддержки.</p>',
  },
  {
    id: 8,
    topics: ['money', 'soul'],
    author: 'Рахмат',
    date: '20 мар',
    likes: 95,
    views: '3.2к',
    emoji: '💎',
    bg: '#fdf2e0',
    tagClass: 'dz-ta',
    tagLabel: 'Деньги · Энергия',
    title: 'Деньги как энергия: почему они уходят от тех, кто их боится',
    excerpt: '',
    fullText: '<p>Деньги — это энергия обмена. Они текут туда, где им рады, где их принимают с благодарностью.</p><p>Страх денег создаёт энергетический барьер. Первый шаг — осознать свои убеждения об изобилии.</p>',
  },
  {
    id: 9,
    topics: ['story', 'soul'],
    author: 'Анастасия',
    date: '15 мар',
    likes: 114,
    views: '4.1к',
    emoji: '🦋',
    bg: '#eae8fb',
    tagClass: 'dz-tp',
    tagLabel: 'История мастера',
    title: 'Как я ушла из корпорации и стала коучем: честно о страхах и деньгах',
    excerpt: '',
    fullText: '<p>Это была самая страшная и самая правильная вещь, которую я сделала в жизни. Уйти с должности топ-менеджера без подушки безопасности.</p><p>Прошло три года. Я не жалею ни разу.</p>',
  },
  {
    id: 10,
    topics: ['chan', 'soul'],
    author: 'Диана',
    date: '14 апр',
    likes: 58,
    views: '1.5к',
    emoji: '🌌',
    bg: '#eae8fb',
    tagClass: 'dz-tp',
    tagLabel: 'Ченнелинг',
    title: 'Послания звёздных душ: что хочет сказать Вселенная в апреле',
    excerpt: '',
    fullText: '<p>В апреле активируется космический портал Плеяд. Звёздные души особенно чувствительны в это время.</p><p>Послание одно: вы не одни. Поддержка приходит с уровней, которые вы ещё не видите.</p>',
  },
];

const TRENDING: TrendItem[] = [
  { title: 'Как я ушла из корпорации и стала коучем', meta: 'Анастасия · 4.1к просм.' },
  { title: 'Деньги как энергия: почему они уходят', meta: 'Рахмат · 3.2к просм.' },
  { title: 'Апрель 2026 — послание духа света', meta: 'Амина · 3.4к просм.' },
  { title: 'Психосоматика: почему болит спина', meta: 'Роман · 2.4к просм.' },
  { title: 'Выгорание эксперта: личная история', meta: 'Дарья · 2.1к просм.' },
];

const SIDE_AUTHORS: SideAuthor[] = [
  { emoji: '🌸', name: 'Амина', count: '12 статей', role: 'Таролог' },
  { emoji: '🔮', name: 'Дарья ДарСлова', count: '8 статей', role: 'Психолог' },
  { emoji: '🙏', name: 'Рахмат', count: '6 статей', role: 'Целитель' },
  { emoji: '🌙', name: 'Мадам Цолькин', count: '14 статей', role: 'Астролог' },
];

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
  { key: 'my', label: 'Мои подписки' },
];

/* ── Reader modal ────────────────────────────────────────── */
function Reader({ article, onClose }: { article: Article; onClose: () => void }) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

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
          <button type="button" className="dz-reader-share">Поделиться</button>
        </div>
        <div className="dz-reader-img" style={{ background: article.bg }}>{article.emoji}</div>
        <div className="dz-reader-body">
          <span className={`dz-reader-cat ${article.tagClass}`}>{article.tagLabel}</span>
          <div className="dz-reader-title">{article.title}</div>
          <div className="dz-reader-meta">
            <span className="dz-art-author"><span className="dz-avxs" />{article.author}</span>
            <span className="dz-art-date">{article.date}</span>
            {article.read && <span className="dz-art-read">{article.read}</span>}
          </div>
          <div
            className="dz-reader-text"
            dangerouslySetInnerHTML={{ __html: article.fullText || article.excerpt }}
          />
        </div>
        <div className="dz-reader-foot">
          <button
            type="button"
            className={`dz-like-btn${liked ? ' dz-liked' : ''}`}
            onClick={() => setLiked(true)}
          >
            ❤ Нравится · {article.likes + (liked ? 1 : 0)}
          </button>
          <button type="button" className="dz-sub-btn">Подписаться на автора</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */
const DzenPage = () => {
  const navigate = useNavigate();
  const [activeTopic, setActiveTopic] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const [readerArticle, setReaderArticle] = useState<Article | null>(null);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const topicFilter = activeTab === 'chan' ? 'chan' : activeTopic;

  const isVisible = useCallback(
    (article: Article) => {
      const topicOk = !topicFilter || article.topics.includes(topicFilter);
      const q = query.toLowerCase().trim();
      const queryOk = !q || article.author.toLowerCase().includes(q) || article.title.toLowerCase().includes(q);
      return topicOk && queryOk;
    },
    [topicFilter, query],
  );

  const visibleFeatured = useMemo(() => isVisible(FEATURED), [isVisible]);
  const visibleGrid = useMemo(() => GRID_ARTICLES.map((a) => isVisible(a)), [isVisible]);
  const visibleList = useMemo(() => LIST_ARTICLES.map((a) => isVisible(a)), [isVisible]);

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    if (key === 'chan') setActiveTopic('chan');
    else setActiveTopic('');
  };

  const toggleFollow = (name: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  return (
    <div className="dz-page">
      {readerArticle && <Reader article={readerArticle} onClose={() => setReaderArticle(null)} />}

      {/* Hero */}
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
          <button type="button" className="dz-write-btn" onClick={() => navigate('/create-article')}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 10l1.5-3.5L10 0l2 2-6.5 7.5L2 10z" stroke="#fff" strokeWidth="1" fill="none" strokeLinejoin="round" />
              <path d="M8.5 1.5l2 2" stroke="#fff" strokeWidth="1" />
            </svg>
            Написать статью
          </button>
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
              onClick={() => handleTabClick(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Topic pills */}
      <div className="dz-topic-bar">
        {TOPIC_PILLS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`dz-pill${topicFilter === p.key ? ' dz-on' : ''}`}
            onClick={() => { setActiveTopic(p.key); setActiveTab('all'); }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Layout */}
      <div className="dz-layout">
        <div className="dz-main">

          {/* Featured */}
          <div
            className={`dz-feat${!visibleFeatured ? ' dz-dimmed' : ''}`}
            onClick={() => setReaderArticle(FEATURED)}
          >
            <div className="dz-feat-img" style={{ background: FEATURED.bg }}>{FEATURED.emoji}</div>
            <div className="dz-feat-body">
              <span className={`dz-fa-tag ${FEATURED.tagClass}`}>{FEATURED.tagLabel}</span>
              <div className="dz-feat-title">{FEATURED.title}</div>
              <div className="dz-feat-excerpt">{FEATURED.excerpt}</div>
              <div className="dz-art-meta">
                <span className="dz-art-author"><span className="dz-avxs" />{FEATURED.author}</span>
                <span className="dz-art-date">{FEATURED.date}</span>
                <span className="dz-art-read">{FEATURED.read}</span>
                <span className="dz-art-likes">❤ {FEATURED.likes} · 👁 {FEATURED.views}</span>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="dz-grid">
            {GRID_ARTICLES.map((a, i) => (
              <div
                key={a.id}
                className={`dz-card${!visibleGrid[i] ? ' dz-dimmed' : ''}`}
                onClick={() => setReaderArticle(a)}
              >
                <div className="dz-card-img" style={{ background: a.bg }}>{a.emoji}</div>
                <div className="dz-card-body">
                  <span className={`dz-ac-tag ${a.tagClass}`}>{a.tagLabel}</span>
                  <div className="dz-card-title">{a.title}</div>
                  <div className="dz-card-excerpt">{a.excerpt}</div>
                  <div className="dz-card-foot">
                    <span className="dz-ac-author"><span className="dz-avxs" />{a.author}</span>
                    <span className="dz-ac-stats">❤ {a.likes} · 👁 {a.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* List */}
          <div className="dz-list">
            {LIST_ARTICLES.map((a, i) => (
              <div
                key={a.id}
                className={`dz-list-item${!visibleList[i] ? ' dz-dimmed' : ''}`}
                onClick={() => setReaderArticle(a)}
              >
                <div className="dz-list-img" style={{ background: a.bg }}>{a.emoji}</div>
                <div className="dz-list-body">
                  <span className={`dz-al-tag ${a.tagClass}`}>{a.tagLabel}</span>
                  <div className="dz-list-title">{a.title}</div>
                  <div className="dz-list-meta">
                    <span className="dz-al-author"><span className="dz-avxs" />{a.author}</span>
                    <span className="dz-al-stats">{a.date} · ❤ {a.likes} · 👁 {a.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="dz-more-btn">Показать ещё статьи</button>
        </div>

        {/* Sidebar */}
        <aside className="dz-sidebar">
          <div className="dz-side-sec">
            <div className="dz-side-h">Популярное сейчас</div>
            {TRENDING.map((t, i) => (
              <div key={i} className="dz-tr-item">
                <span className="dz-tr-num">{i + 1}</span>
                <div>
                  <div className="dz-tr-title">{t.title}</div>
                  <div className="dz-tr-meta">{t.meta}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="dz-side-sec">
            <div className="dz-side-h">Авторы для подписки</div>
            {SIDE_AUTHORS.map((a) => (
              <div key={a.name} className="dz-author-item">
                <div className="dz-author-ava">{a.emoji}</div>
                <div className="dz-author-info">
                  <div className="dz-author-name">{a.name}</div>
                  <div className="dz-author-sub">{a.count} · {a.role}</div>
                </div>
                <button
                  type="button"
                  className={`dz-follow-btn${followed.has(a.name) ? ' dz-following' : ''}`}
                  onClick={() => toggleFollow(a.name)}
                >
                  {followed.has(a.name) ? '✓ Читаю' : '+ Читать'}
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

          <div className="dz-side-sec">
            <div className="dz-promo-block">
              <div className="dz-promo-title">Пишите о своём пути</div>
              <div className="dz-promo-sub">Публикуйте статьи, ченнелинги, практики — ваша аудитория ждёт.</div>
              <button type="button" className="dz-promo-btn" onClick={() => navigate('/create-article')}>
                Написать статью
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DzenPage;
