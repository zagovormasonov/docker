import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SoulSynergyMastersPage.css';

type TabKey = 'all' | 'new' | 'online' | 'retreats';
type TagKind = 'tp' | 'tt' | 'ta';
type BannerKind = 'b-purple' | 'b-teal' | 'b-amber';

interface PreviewData {
  ava: string;
  name: string;
  role: string;
  tags: [string, TagKind][];
  svc: { n: string; p: string }[];
  prod: { n: string; p: string }[];
  bg: string;
}

interface MasterRow {
  slug: string;
  spec: string;
  city: string;
  online: boolean;
  featured?: boolean;
  banner: BannerKind;
  ava: string;
  name: string;
  role: string;
  desc: string;
  tags: { cls: TagKind; label: string }[];
  stats: { num: string; label: string }[];
  bookPrimary?: boolean;
  cityOnlineOnly?: boolean;
  preview: PreviewData;
}

const PREVIEW_DEFAULT_KEY = 'рахмат';

const MASTERS: MasterRow[] = [
  {
    slug: 'рахмат',
    spec: 'heal chan',
    city: 'Владивосток',
    online: true,
    featured: true,
    banner: 'b-purple',
    ava: '🙏',
    name: 'Рахмат',
    role: 'Целитель · Архитектор сознания',
    desc: 'Хранитель первородной энергии. Основатель Академии эволюции сознания «ЦЕНТЕРРА».',
    tags: [
      { cls: 'tp', label: 'Целительство' },
      { cls: 'tp', label: 'Ченнелинг' },
      { cls: 'tt', label: 'Сакральная геометрия' },
    ],
    stats: [
      { num: '1', label: 'услуга' },
      { num: '1', label: 'продукт' },
    ],
    bookPrimary: true,
    preview: {
      ava: '🙏',
      name: 'Рахмат',
      role: 'Целитель · Архитектор сознания · Владивосток',
      tags: [
        ['Целительство', 'tp'],
        ['Ченнелинг', 'tp'],
        ['Психосоматика', 'tp'],
      ],
      svc: [{ n: 'Личная сессия', p: '16 369 ₽' }],
      prod: [{ n: 'Финансовая эволюция', p: '16 369 ₽' }],
      bg: '#EAE8FB',
    },
  },
  {
    slug: 'амина',
    spec: 'taro psych',
    city: 'Сочи',
    online: true,
    banner: 'b-teal',
    ava: '🌸',
    name: 'Амина',
    role: 'Таролог · Специалист психосоматики',
    desc: 'Исцеляю психосоматику секретной методикой за 1 сеанс. Специалист остеопрактики.',
    tags: [
      { cls: 'tp', label: 'Таро' },
      { cls: 'tt', label: 'Психосоматика' },
    ],
    stats: [
      { num: '3', label: 'услуги' },
      { num: '2', label: 'продукта' },
    ],
    preview: {
      ava: '🌸',
      name: 'Амина',
      role: 'Таролог · Сочи',
      tags: [
        ['Таро', 'tp'],
        ['Психосоматика', 'tt'],
      ],
      svc: [
        { n: 'Онлайн-сессия', p: '3 500 ₽' },
        { n: 'Разбор расклада', p: '1 800 ₽' },
      ],
      prod: [{ n: 'Курс по психосоматике', p: '4 900 ₽' }],
      bg: '#E2F7F0',
    },
  },
  {
    slug: 'дарья',
    spec: 'psych coach',
    city: 'Москва',
    online: true,
    banner: 'b-amber',
    ava: '🔮',
    name: 'Дарья ДарСлова',
    role: 'Психолог · Бизнес-коуч',
    desc: 'Помогаю экспертам пробить потолок дохода. Работаю с внутренними ограничениями.',
    tags: [
      { cls: 'ta', label: 'Деньги и рост' },
      { cls: 'tp', label: 'Психология' },
    ],
    stats: [
      { num: '4', label: 'услуги' },
      { num: '3', label: 'продукта' },
    ],
    preview: {
      ava: '🔮',
      name: 'Дарья ДарСлова',
      role: 'Психолог · Москва',
      tags: [
        ['Деньги и рост', 'ta'],
        ['Психология', 'tp'],
      ],
      svc: [
        { n: 'Разбор ограничений', p: '5 000 ₽' },
        { n: 'VIP-сессия', p: '12 000 ₽' },
      ],
      prod: [{ n: 'Запись эфира', p: '2 500 ₽' }],
      bg: '#FDF2E0',
    },
  },
  {
    slug: 'анастасия',
    spec: 'coach med',
    city: 'Симферополь',
    online: false,
    banner: 'b-purple',
    ava: '🦋',
    name: 'Анастасия',
    role: 'Коуч · Фасилитатор',
    desc: 'Помогаю остановиться, убрать шум и увидеть, что делать дальше.',
    tags: [
      { cls: 'tp', label: 'Коучинг' },
      { cls: 'tt', label: 'Медитации' },
    ],
    stats: [
      { num: '2', label: 'услуги' },
      { num: '1', label: 'продукт' },
    ],
    preview: {
      ava: '🦋',
      name: 'Анастасия',
      role: 'Коуч · Симферополь',
      tags: [
        ['Коучинг', 'tp'],
        ['Медитации', 'tt'],
      ],
      svc: [{ n: 'Коуч-сессия', p: '4 500 ₽' }],
      prod: [{ n: 'PDF-гайд', p: '990 ₽' }],
      bg: '#EAE8FB',
    },
  },
  {
    slug: 'роман',
    spec: 'psych body',
    city: 'Сочи',
    online: false,
    banner: 'b-teal',
    ava: '🧘',
    name: 'Роман',
    role: 'Телесный терапевт',
    desc: 'Работаю с телом как зеркалом внутренних состояний. Снятие хронических блоков.',
    tags: [
      { cls: 'tt', label: 'Тело' },
      { cls: 'tp', label: 'Психосоматика' },
    ],
    stats: [{ num: '2', label: 'услуги' }],
    preview: {
      ava: '🧘',
      name: 'Роман',
      role: 'Телесный терапевт · Сочи',
      tags: [
        ['Тело', 'tt'],
        ['Психосоматика', 'tp'],
      ],
      svc: [{ n: 'Сессия телесной терапии', p: '6 000 ₽' }],
      prod: [],
      bg: '#E2F7F0',
    },
  },
  {
    slug: 'диана',
    spec: 'chan med',
    city: '',
    online: false,
    banner: 'b-purple',
    ava: '✨',
    name: 'Диана',
    role: 'Ченнелер · Медиум',
    desc: 'Транслирую послания высших источников. Проводник между мирами.',
    tags: [
      { cls: 'tp', label: 'Ченнелинг' },
      { cls: 'tp', label: 'Медитации' },
    ],
    stats: [
      { num: '2', label: 'услуги' },
      { num: '4', label: 'продукта' },
    ],
    cityOnlineOnly: true,
    preview: {
      ava: '✨',
      name: 'Диана',
      role: 'Ченнелер · Онлайн',
      tags: [
        ['Ченнелинг', 'tp'],
        ['Медитации', 'tp'],
      ],
      svc: [{ n: 'Личный ченнелинг', p: '5 500 ₽' }],
      prod: [
        { n: 'Послания', p: '1 200 ₽' },
        { n: 'Медитации пакет', p: '2 200 ₽' },
      ],
      bg: '#EAE8FB',
    },
  },
  {
    slug: 'юлия',
    spec: 'ret med',
    city: 'Москва',
    online: false,
    banner: 'b-amber',
    ava: '🌿',
    name: 'Юлия',
    role: 'Ведущая ретритов',
    desc: 'Организую трансформационные ретриты в природе. Алтай, Байкал, Кавказ.',
    tags: [
      { cls: 'ta', label: 'Ретриты' },
      { cls: 'tt', label: 'Медитации' },
    ],
    stats: [
      { num: '3', label: 'события' },
      { num: '2', label: 'продукта' },
    ],
    preview: {
      ava: '🌿',
      name: 'Юлия',
      role: 'Ведущая ретритов · Москва',
      tags: [
        ['Ретриты', 'ta'],
        ['Медитации', 'tt'],
      ],
      svc: [
        { n: 'Ретрит Алтай 5 дней', p: '45 000 ₽' },
        { n: 'Ретрит Байкал', p: '55 000 ₽' },
      ],
      prod: [{ n: 'Онлайн-медитации', p: '1 500 ₽' }],
      bg: '#FDF2E0',
    },
  },
  {
    slug: 'мадам цолькин',
    spec: 'taro chan',
    city: '',
    online: false,
    banner: 'b-purple',
    ava: '🌙',
    name: 'Мадам Цолькин',
    role: 'Астролог · Календарь Цолькин',
    desc: 'Расшифровка судьбы через календарь Майя. Ключи к пониманию своего пути.',
    tags: [
      { cls: 'tp', label: 'Цолькин' },
      { cls: 'tp', label: 'Астрология' },
    ],
    stats: [
      { num: '2', label: 'услуги' },
      { num: '5', label: 'продуктов' },
    ],
    cityOnlineOnly: true,
    preview: {
      ava: '🌙',
      name: 'Мадам Цолькин',
      role: 'Астролог · Онлайн',
      tags: [
        ['Цолькин', 'tp'],
        ['Астрология', 'tp'],
      ],
      svc: [{ n: 'Расшифровка судьбы', p: '7 000 ₽' }],
      prod: [
        { n: 'Гайд Цолькин 2026', p: '1 900 ₽' },
        { n: 'Пакет расчётов', p: '3 500 ₽' },
      ],
      bg: '#EAE8FB',
    },
  },
];

const ONLINE_STRIP = [
  { ava: '🙏', name: 'Рахмат', role: 'Целитель' },
  { ava: '🌸', name: 'Амина', role: 'Таролог' },
  { ava: '🔮', name: 'Дарья', role: 'Психолог · Коуч' },
];

function CityPin() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth=".9" />
      <path d="M5 9C5 9 2 6.5 2 4a3 3 0 016 0C8 6.5 5 9 5 9Z" stroke="currentColor" strokeWidth=".9" fill="none" />
    </svg>
  );
}

function matchesMaster(
  m: MasterRow,
  q: string,
  city: string,
  fmt: string,
  activeTab: TabKey,
  activeSpec: string,
): boolean {
  const specStr = m.spec;
  const nameSlug = m.slug;
  if (q && !nameSlug.includes(q) && !specStr.includes(q)) return false;
  if (city && m.city !== city) return false;

  if (fmt === 'online') {
    if (!(m.online || m.cityOnlineOnly)) return false;
  } else if (fmt === 'offline') {
    if (m.online && !m.city) return false;
    if (!m.city && m.cityOnlineOnly) return false;
    if (!m.city) return false;
  }

  if (activeSpec && !specStr.split(' ').includes(activeSpec)) return false;

  if (activeTab === 'online') return m.online;
  if (activeTab === 'retreats') return specStr.includes('ret');
  return true;
}

const SoulSynergyMastersPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [citySel, setCitySel] = useState('');
  const [fmtSel, setFmtSel] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [activeSpec, setActiveSpec] = useState('');
  const [previewKey, setPreviewKey] = useState(PREVIEW_DEFAULT_KEY);

  const q = search.trim().toLowerCase();

  const visibility = useMemo(() => {
    const map: Record<string, boolean> = {};
    let count = 0;
    for (const m of MASTERS) {
      const ok = matchesMaster(m, q, citySel, fmtSel, activeTab, activeSpec);
      map[m.slug] = ok;
      if (ok) count++;
    }
    return { map, count };
  }, [q, citySel, fmtSel, activeTab, activeSpec]);

  const preview = MASTERS.find((m) => m.slug === previewKey)?.preview ?? MASTERS[0].preview;

  const selectTab = (key: TabKey) => {
    setActiveTab(key);
    setActiveSpec('');
  };

  const selectSpec = (spec: string) => {
    setActiveSpec(spec);
    setActiveTab('all');
  };

  const stopFoot = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="ss-mstr">
      <nav className="nav">
        <Link className="nav-logo" to="/">
          <div className="logo-mark">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
        <div className="nav-links">
          <Link className="nl" to="/">
            Главная
          </Link>
          <Link className="nl active" to="/experts">
            Мастера
          </Link>
          <span className="nl">Практики</span>
          <span className="nl">
            Цифровые продукты<span className="ndot" />
          </span>
          <span className="nl">Дзен</span>
        </div>
        <div className="nav-right">
          <button type="button" className="ibt" aria-label="Чаты">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M2 2.5h11v7.5H8L5.5 12.5V10H2V2.5z"
                stroke="currentColor"
                strokeWidth=".9"
                fill="none"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button type="button" className="ibt" aria-label="Уведомления">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M7.5 1.5C5.3 1.5 3.5 3.3 3.5 5.5V9L2 10.5h11L11.5 9V5.5C11.5 3.3 9.7 1.5 7.5 1.5Z"
                stroke="currentColor"
                strokeWidth=".9"
                fill="none"
              />
              <path d="M6.2 12a1.3 1.3 0 002.6 0" stroke="currentColor" strokeWidth=".9" />
            </svg>
          </button>
          <button type="button" className="cab-btn" onClick={() => navigate('/expert-dashboard')}>
            Кабинет мастера
          </button>
          <div className="ava" />
        </div>
      </nav>

      <div className="page-header">
        <div className="ph-top">
          <div>
            <div className="ph-title">Мастера</div>
            <div className="ph-sub">Найдите своего специалиста через доверие и резонанс</div>
          </div>
          <button type="button" className="add-btn" onClick={() => navigate('/become-expert')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Стать мастером
          </button>
        </div>
        <div className="search-row">
          <div className="srch-wrap">
            <span className="srch-ico">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.1" />
                <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
            </span>
            <input
              className="srch-inp"
              type="search"
              placeholder="Поиск по имени, специализации..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="sel" value={citySel} onChange={(e) => setCitySel(e.target.value)}>
            <option value="">Все города</option>
            <option value="Москва">Москва</option>
            <option value="Сочи">Сочи</option>
            <option value="Владивосток">Владивосток</option>
            <option value="Симферополь">Симферополь</option>
          </select>
          <select className="sel" value={fmtSel} onChange={(e) => setFmtSel(e.target.value)}>
            <option value="">Формат</option>
            <option value="online">Онлайн</option>
            <option value="offline">Очно</option>
          </select>
        </div>
        <div className="filter-tabs">
          {(
            [
              ['all', 'Все мастера'],
              ['new', 'Новые'],
              ['online', 'Онлайн сейчас'],
              ['retreats', 'Ретриты'],
            ] as [TabKey, string][]
          ).map(([key, label]) => (
            <span
              key={key}
              role="button"
              tabIndex={0}
              className={`ftab${activeTab === key ? ' on' : ''}`}
              onClick={() => selectTab(key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectTab(key);
                }
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="spec-pills">
        {[
          { spec: '', label: 'Все специализации' },
          { spec: 'heal', label: 'Целительство' },
          { spec: 'taro', label: 'Таро и предсказания' },
          { spec: 'psych', label: 'Психология' },
          { spec: 'coach', label: 'Коучинг' },
          { spec: 'med', label: 'Медитации' },
          { spec: 'ret', label: 'Ретриты' },
          { spec: 'chan', label: 'Ченнелинг' },
          { spec: 'body', label: 'Тело и массаж' },
        ].map((p) => (
          <span
            key={p.spec || 'all'}
            role="button"
            tabIndex={0}
            className={`sp${activeSpec === p.spec ? ' on' : ''}`}
            onClick={() => selectSpec(p.spec)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectSpec(p.spec);
              }
            }}
          >
            {p.label}
          </span>
        ))}
      </div>

      <div className="layout">
        <div className="catalog">
          <div className="sort-row">
            <span className="sort-label">Найдено {visibility.count} мастеров</span>
            <select className="sort-sel" defaultValue="resonance">
              <option value="resonance">По резонансу</option>
              <option value="new">По новизне</option>
              <option value="online">Онлайн первые</option>
              <option value="rating">По рейтингу</option>
            </select>
          </div>
          <div className="grid">
            {MASTERS.map((m) => (
              <div
                key={m.slug}
                className={`mc${m.featured ? ' featured' : ''}${visibility.map[m.slug] ? '' : ' dimmed'}`}
                role="button"
                tabIndex={0}
                onClick={() => setPreviewKey(m.slug)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPreviewKey(m.slug);
                  }
                }}
              >
                <div className={`mc-banner ${m.banner}`}>
                  {m.featured ? <span className="feat-badge">Топ мастер</span> : null}
                  {m.online ? (
                    <div className="online-badge">
                      <span className="online-dot" />
                      онлайн
                    </div>
                  ) : null}
                </div>
                <div className="mc-body">
                  <div className="mc-ava-wrap">
                    <div className="mc-ava">{m.ava}</div>
                  </div>
                  <div className="mc-name">{m.name}</div>
                  <div className="mc-role">{m.role}</div>
                  {m.cityOnlineOnly ? (
                    <div className="mc-city mc-city-online">Онлайн</div>
                  ) : (
                    <div className="mc-city">
                      <CityPin />
                      {m.city}
                    </div>
                  )}
                  <div className="mc-desc">{m.desc}</div>
                  <div className="mc-tags">
                    {m.tags.map((t) => (
                      <span key={t.label} className={`tag ${t.cls}`}>
                        {t.label}
                      </span>
                    ))}
                  </div>
                  <div className="mc-foot">
                    <div className="mc-stats">
                      {m.stats.map((s) => (
                        <span key={s.label} className="mcs">
                          <span>{s.num}</span> {s.label}
                        </span>
                      ))}
                    </div>
                    <button type="button" className={`mc-btn${m.bookPrimary ? ' primary' : ''}`} onClick={stopFoot}>
                      Записаться
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="load-more">
            Показать ещё мастеров
          </button>
        </div>

        <aside className="sidebar">
          <div className="side-section">
            <div className="side-h">Превью мастера</div>
            <div className="preview-card">
              <div className="pc-banner" style={{ background: preview.bg }} />
              <div className="pc-body">
                <div className="pc-ava">{preview.ava}</div>
                <div className="pc-name">{preview.name}</div>
                <div className="pc-role">{preview.role}</div>
                <div className="pc-tags">
                  {preview.tags.map(([text, cls]) => (
                    <span key={text} className={`tag ${cls}`}>
                      {text}
                    </span>
                  ))}
                </div>
                <div className="pc-services">
                  <div className="pcs-title">Услуги</div>
                  {preview.svc.map((s) => (
                    <div key={s.n} className="pcs-item">
                      <span className="pcs-name">{s.n}</span>
                      <span className="pcs-price">{s.p}</span>
                    </div>
                  ))}
                </div>
                {preview.prod.length > 0 ? (
                  <div className="pc-services">
                    <div className="pcs-title">Цифровые продукты</div>
                    {preview.prod.map((s) => (
                      <div key={s.n} className="pcs-item">
                        <span className="pcs-name">{s.n}</span>
                        <span className="pcs-price">{s.p}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <button type="button" className="book-btn">
                  Записаться на сессию
                </button>
                <button type="button" className="msg-btn">
                  Написать сообщение
                </button>
              </div>
            </div>
          </div>
          <div className="side-section">
            <div className="side-h">Онлайн сейчас</div>
            <div className="online-strip">
              {ONLINE_STRIP.map((o) => (
                <div key={o.name} className="os-item">
                  <div className="os-ava">{o.ava}</div>
                  <div>
                    <div className="os-name">{o.name}</div>
                    <div className="os-role">{o.role}</div>
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
                <div className="sc-n">48</div>
                <div className="sc-l">мастеров</div>
              </div>
              <div className="stat-chip">
                <div className="sc-n">24</div>
                <div className="sc-l">онлайн</div>
              </div>
              <div className="stat-chip">
                <div className="sc-n">312</div>
                <div className="sc-l">практик</div>
              </div>
              <div className="stat-chip">
                <div className="sc-n">87</div>
                <div className="sc-l">продуктов</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SoulSynergyMastersPage;
