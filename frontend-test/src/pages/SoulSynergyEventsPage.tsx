import { useMemo, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SoulSynergyEventsPage.css';

type EventFmt = 'online' | 'offline' | 'retreat' | 'intensive';

interface PreviewDetail {
  bg: string;
  ico: string;
  when: string;
  title: string;
  loc: string;
  desc: string;
  prog: string[];
  priceFree: boolean;
  priceLabel: string;
}

const CAL_DAYS: { d: string; n: number; has: boolean }[] = [
  { d: 'Пн', n: 21, has: true },
  { d: 'Вт', n: 22, has: true },
  { d: 'Ср', n: 23, has: false },
  { d: 'Чт', n: 24, has: true },
  { d: 'Пт', n: 25, has: false },
  { d: 'Сб', n: 26, has: true },
  { d: 'Вс', n: 27, has: false },
  { d: 'Пн', n: 28, has: true },
  { d: 'Вт', n: 29, has: false },
  { d: 'Ср', n: 30, has: true },
];

const PREVIEW_BY_NAME: Record<string, PreviewDetail> = {
  'состояние деньги': {
    bg: '#FDF2E0',
    ico: '💰',
    when: 'Сегодня · 22:00',
    title: 'Состояние = Деньги',
    loc: '📍 Москва · Офлайн-тренинг',
    desc: 'Работа с внутренней архитектурой проекта для экспертов.',
    prog: ['Диагностика: где вы сейчас', 'Работа с внутренней архитектурой', 'Практика: перезапуск состояния'],
    priceFree: true,
    priceLabel: 'Бесплатно',
  },
  'гипноз ограничения': {
    bg: '#EAE8FB',
    ico: '🎙️',
    when: '21 апр · 20:00',
    title: 'Гипноз и внутренние ограничения',
    loc: '🌐 Онлайн-эфир · 2.5 ч',
    desc: 'Работа с глубинными блоками через гипнотические техники. Открытый эфир.',
    prog: ['Введение в гипноз', 'Работа с подсознанием', 'Практика освобождения'],
    priceFree: true,
    priceLabel: 'Бесплатно',
  },
  'внутренняя свобода шаги': {
    bg: '#EAE8FB',
    ico: '🌐',
    when: '22 апр · 18:00',
    title: '9 шагов к внутренней свободе',
    loc: '🌐 Онлайн-эфир · 2.5 ч',
    desc: '2.5 часа живой работы с внутренними ограничениями.',
    prog: ['Где я сейчас — диагностика', '9 шагов — карта пути', 'Групповая практика'],
    priceFree: true,
    priceLabel: 'Бесплатно',
  },
  'потолок дохода страх масштаба': {
    bg: '#FDF2E0',
    ico: '💼',
    when: '24 апр · 19:00',
    title: 'Потолок дохода: страх масштаба',
    loc: '🌐 Онлайн · 4 часа',
    desc: 'Воркшоп для экспертов. Разбор психологических механизмов, которые удерживают от масштаба.',
    prog: ['Диагностика ограничений', 'Архитектура роста', 'Инструменты пробития', 'Практика перезапуска'],
    priceFree: false,
    priceLabel: '3 500 ₽',
  },
  'телесная терапия интенсив': {
    bg: '#E2F7F0',
    ico: '🧘',
    when: '26–27 апр · Сочи',
    title: 'Телесная терапия: интенсив',
    loc: '📍 Сочи · 2 дня',
    desc: 'Двухдневный офлайн-интенсив по работе с телом.',
    prog: ['День 1: картирование тела', 'День 1: практика освобождения', 'День 2: интеграция'],
    priceFree: false,
    priceLabel: '12 000 ₽',
  },
  'ченнелинг послания мая': {
    bg: '#EAE8FB',
    ico: '✨',
    when: '28 апр · 20:00',
    title: 'Ченнелинг: послания мая',
    loc: '🌐 Онлайн · 1.5 ч',
    desc: 'Эфир-ченнелинг. Послания для тех, кто готов к новому месяцу.',
    prog: ['Открытие пространства', 'Послания', 'Ответы на вопросы'],
    priceFree: false,
    priceLabel: '1 500 ₽',
  },
  'ретрит алтай весенний': {
    bg: '#FDF2E0',
    ico: '🏔️',
    when: '15 мая · 5 дней',
    title: 'Весенний ретрит Алтай',
    loc: '📍 Алтай · до 12 человек',
    desc: 'Трансформационный ретрит в горах Алтая. 5 дней глубинной работы с собой.',
    prog: ['День 1: прибытие и настройка', 'Дни 2–4: практики', 'День 5: интеграция'],
    priceFree: false,
    priceLabel: 'от 45 000 ₽',
  },
  'школа музыки синергия': {
    bg: '#E2F7F0',
    ico: '🎵',
    when: '22 апр · 10:00',
    title: 'Школа современной музыки Баста × Синергия',
    loc: '🌐 Онлайн · 3 дня',
    desc: 'Открытый мастер-класс и программа школы.',
    prog: ['Вводная сессия', 'Разбор направлений', 'Q&A'],
    priceFree: true,
    priceLabel: 'Бесплатно',
  },
};

interface CardDef {
  name: string;
  fmt: EventFmt;
  topics: string[];
  city: string;
  price: 'free' | 'paid';
  day: number;
  feat?: boolean;
  typeClass: 'type-online' | 'type-offline' | 'type-retreat' | 'type-free';
  imgStyle: CSSProperties;
  emoji: string;
  status?: { cls: 'st-today' | 'st-soon'; label: string };
  priceBadge?: { cls?: string; label: string };
  tags: { cls: string; label: string }[];
  title: string;
  desc?: string;
  meta: string[];
}

const CARDS: CardDef[] = [
  {
    name: 'состояние деньги',
    fmt: 'offline',
    topics: ['money', 'psych'],
    city: 'Москва',
    price: 'paid',
    day: 21,
    feat: true,
    typeClass: 'type-offline',
    imgStyle: { background: 'var(--ss-ambl)' },
    emoji: '💰',
    status: { cls: 'st-today', label: 'Сегодня' },
    priceBadge: { cls: 'free', label: 'Бесплатно' },
    tags: [
      { cls: 'ta', label: 'Тренинг' },
      { cls: 'ta', label: 'Москва' },
    ],
    title: 'Состояние = Деньги. Как эксперту расти в доходе, оставаясь в ресурсе',
    desc: 'Офлайн-тренинг от Дарьи Тереховой. Работа с внутренней архитектурой проекта.',
    meta: ['📅 21 апр · 22:00', '📍 Москва', '⏱ 2 часа'],
  },
  {
    name: 'гипноз ограничения',
    fmt: 'online',
    topics: ['psych', 'soul'],
    city: 'Онлайн',
    price: 'free',
    day: 21,
    typeClass: 'type-online',
    imgStyle: { background: 'var(--ss-acp)' },
    emoji: '🎙️',
    status: { cls: 'st-today', label: 'Сегодня · 20:00' },
    tags: [
      { cls: 'tp', label: 'Онлайн-эфир' },
      { cls: 'tp', label: 'Психология' },
    ],
    title: 'Гипноз и внутренние ограничения',
    meta: ['📅 21 апр · 20:00', '🌐 Онлайн', '⏱ 2.5 ч'],
  },
  {
    name: 'внутренняя свобода шаги',
    fmt: 'online',
    topics: ['soul', 'chan'],
    city: 'Онлайн',
    price: 'free',
    day: 22,
    typeClass: 'type-online',
    imgStyle: { background: 'var(--ss-acp)' },
    emoji: '🌐',
    status: { cls: 'st-soon', label: 'Завтра' },
    tags: [
      { cls: 'tp', label: 'Онлайн-эфир' },
      { cls: 'tp', label: 'Духовный путь' },
    ],
    title: '9 шагов к внутренней свободе',
    meta: ['📅 22 апр · 18:00', '🌐 Онлайн', '⏱ 2.5 ч'],
  },
  {
    name: 'потолок дохода страх масштаба',
    fmt: 'online',
    topics: ['money', 'psych'],
    city: 'Онлайн',
    price: 'paid',
    day: 24,
    typeClass: 'type-online',
    imgStyle: { background: 'var(--ss-ambl)' },
    emoji: '💼',
    tags: [
      { cls: 'ta', label: 'Воркшоп' },
      { cls: 'ta', label: 'Деньги' },
    ],
    title: 'Потолок дохода: страх масштаба и как его пробить',
    meta: ['📅 24 апр · 19:00', '🌐 Онлайн', '⏱ 4 ч'],
  },
  {
    name: 'телесная терапия интенсив',
    fmt: 'intensive',
    topics: ['psych', 'body'],
    city: 'Сочи',
    price: 'paid',
    day: 26,
    typeClass: 'type-offline',
    imgStyle: { background: 'var(--ss-tell)' },
    emoji: '🧘',
    tags: [
      { cls: 'tt', label: 'Интенсив' },
      { cls: 'tt', label: 'Сочи' },
    ],
    title: 'Телесная терапия: двухдневный интенсив в Сочи',
    meta: ['📅 26–27 апр', '📍 Сочи', '⏱ 2 дня'],
  },
  {
    name: 'ченнелинг послания мая',
    fmt: 'online',
    topics: ['chan', 'soul'],
    city: 'Онлайн',
    price: 'paid',
    day: 28,
    typeClass: 'type-online',
    imgStyle: { background: 'var(--ss-acp)' },
    emoji: '✨',
    tags: [
      { cls: 'tp', label: 'Онлайн-эфир' },
      { cls: 'tp', label: 'Ченнелинг' },
    ],
    title: 'Ченнелинг: послания мая — что несёт новый месяц',
    meta: ['📅 28 апр · 20:00', '🌐 Онлайн', '⏱ 1.5 ч'],
  },
  {
    name: 'ретрит алтай весенний',
    fmt: 'retreat',
    topics: ['soul', 'ret', 'body'],
    city: 'Москва',
    price: 'paid',
    day: 15,
    typeClass: 'type-retreat',
    imgStyle: { background: 'var(--ss-ambl)' },
    emoji: '🏔️',
    tags: [
      { cls: 'ta', label: 'Ретрит' },
      { cls: 'ta', label: 'Алтай' },
    ],
    title: 'Весенний ретрит Алтай — 9 шагов к свободе',
    meta: ['📅 15 мая · 5 дней', '📍 Алтай', 'До 12 чел.'],
  },
  {
    name: 'школа музыки синергия',
    fmt: 'intensive',
    topics: ['money', 'psych'],
    city: 'Онлайн',
    price: 'free',
    day: 22,
    typeClass: 'type-online',
    imgStyle: { background: 'var(--ss-tell)' },
    emoji: '🎵',
    tags: [
      { cls: 'tt', label: 'Мастер-класс' },
      { cls: 'tt', label: 'Онлайн' },
    ],
    title: 'Школа современной музыки Баста × Синергия',
    meta: ['📅 22 апр · 10:00', '🌐 Онлайн', '⏱ 3 дня'],
  },
];

function matchesFilters(
  c: CardDef,
  activeFmt: string,
  activeTopic: string,
  city: string,
  price: string,
  q: string,
  calendarDay: number | null,
): boolean {
  if (activeFmt !== 'all' && c.fmt !== activeFmt) return false;
  if (activeTopic && !c.topics.includes(activeTopic)) return false;
  if (city && c.city !== city) return false;
  if (price && c.price !== price) return false;
  if (q && !c.name.includes(q)) return false;
  if (calendarDay !== null && c.day !== calendarDay) return false;
  return true;
}

function renderFoot(c: CardDef, stop: (e: React.MouseEvent) => void) {
  switch (c.name) {
    case 'состояние деньги':
      return (
        <>
          <span className="seats">
            Мест: <b>3 из 20</b>
          </span>
          <button type="button" className="reg-btn free" onClick={stop}>
            Бесплатная регистрация
          </button>
        </>
      );
    case 'гипноз ограничения':
    case 'внутренняя свобода шаги':
      return (
        <>
          <span className="seats">Открытый эфир</span>
          <button type="button" className="reg-btn free" onClick={stop}>
            Записаться бесплатно
          </button>
        </>
      );
    case 'потолок дохода страх масштаба':
      return (
        <>
          <span className="ec-foot-price">3 500 ₽</span>
          <button type="button" className="reg-btn" onClick={stop}>
            Зарегистрироваться
          </button>
        </>
      );
    case 'телесная терапия интенсив':
      return (
        <>
          <span className="seats">
            Мест: <b>6 из 12</b>
          </span>
          <button type="button" className="reg-btn" style={{ background: 'var(--ss-coral)' }} onClick={stop}>
            Забронировать · 12 000 ₽
          </button>
        </>
      );
    case 'ченнелинг послания мая':
      return (
        <>
          <span className="ec-foot-price">1 500 ₽</span>
          <button type="button" className="reg-btn" onClick={stop}>
            Зарегистрироваться
          </button>
        </>
      );
    case 'ретрит алтай весенний':
      return (
        <>
          <span className="seats">
            Мест: <b>4 из 12</b>
          </span>
          <button type="button" className="reg-btn" style={{ background: 'var(--ss-amb)' }} onClick={stop}>
            Забронировать · 45 000 ₽
          </button>
        </>
      );
    case 'школа музыки синергия':
      return (
        <>
          <span className="seats">Открытая регистрация</span>
          <button type="button" className="reg-btn free" onClick={stop}>
            Бесплатно
          </button>
        </>
      );
    default:
      return null;
  }
}

const SoulSynergyEventsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [citySel, setCitySel] = useState('');
  const [priceSel, setPriceSel] = useState('');
  const [activeFmt, setActiveFmt] = useState('all');
  const [activeTopic, setActiveTopic] = useState('');
  const [calendarDay, setCalendarDay] = useState<number | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string>('состояние деньги');

  const q = search.trim().toLowerCase();

  const visibility = useMemo(() => {
    const map: Record<string, boolean> = {};
    let count = 0;
    for (const c of CARDS) {
      const ok = matchesFilters(c, activeFmt, activeTopic, citySel, priceSel, q, calendarDay);
      map[c.name] = ok;
      if (ok) count++;
    }
    return { map, count };
  }, [activeFmt, activeTopic, citySel, priceSel, q, calendarDay]);

  const preview = PREVIEW_BY_NAME[selectedPreview] ?? PREVIEW_BY_NAME['состояние деньги'];

  const stopFoot = (e: React.MouseEvent) => e.stopPropagation();

  const onCalDayClick = (n: number) => {
    setCalendarDay((prev) => (prev === n ? null : n));
  };

  return (
    <div className="ss-ev">
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
          <Link className="nl" to="/experts">
            Мастера
          </Link>
          <Link className="nl active" to="/events">
            События
          </Link>
          <span className="nl">Цифровые продукты</span>
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
            </svg>
          </button>
          <button type="button" className="cab-btn" onClick={() => navigate('/expert-dashboard')}>
            Кабинет мастера
          </button>
          <div className="ava" />
        </div>
      </nav>

      <div className="page-hdr">
        <div className="ph-row">
          <div>
            <div className="ph-title">События</div>
            <div className="ph-sub">Живые эфиры, встречи, воркшопы и ретриты от мастеров платформы</div>
          </div>
          <button type="button" className="add-btn" onClick={() => navigate('/events/create')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Создать событие
          </button>
        </div>
        <div className="search-row">
          <div className="srch">
            <span className="srch-ico">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.1" />
                <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
            </span>
            <input
              className="srch-inp"
              type="search"
              placeholder="Поиск по названию или ведущему..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="sel" value={citySel} onChange={(e) => setCitySel(e.target.value)}>
            <option value="">Все города</option>
            <option value="Москва">Москва</option>
            <option value="Сочи">Сочи</option>
            <option value="Онлайн">Онлайн</option>
          </select>
          <select className="sel" value={priceSel} onChange={(e) => setPriceSel(e.target.value)}>
            <option value="">Любая цена</option>
            <option value="free">Бесплатные</option>
            <option value="paid">Платные</option>
          </select>
        </div>
        <div className="fmt-tabs">
          {[
            { fmt: 'all', label: 'Все события' },
            { fmt: 'online', label: '🌐 Онлайн-эфиры' },
            { fmt: 'offline', label: '📍 Очные встречи' },
            { fmt: 'retreat', label: '🏔️ Ретриты' },
            { fmt: 'intensive', label: '⚡ Интенсивы' },
          ].map((t) => (
            <span
              key={t.fmt}
              role="button"
              tabIndex={0}
              className={`fmtab${activeFmt === t.fmt ? ' on' : ''}`}
              onClick={() => setActiveFmt(t.fmt)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveFmt(t.fmt);
                }
              }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>

      <div className="topic-bar">
        {[
          { topic: '', label: 'Все темы' },
          { topic: 'psych', label: 'Психология' },
          { topic: 'money', label: 'Деньги и рост' },
          { topic: 'soul', label: 'Духовный путь' },
          { topic: 'body', label: 'Тело и здоровье' },
          { topic: 'rel', label: 'Отношения' },
          { topic: 'chan', label: 'Ченнелинг' },
          { topic: 'ret', label: 'Ретриты' },
        ].map((p) => (
          <span
            key={p.topic || 'all'}
            role="button"
            tabIndex={0}
            className={`pill${activeTopic === p.topic ? ' on' : ''}`}
            onClick={() => setActiveTopic(p.topic)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTopic(p.topic);
              }
            }}
          >
            {p.label}
          </span>
        ))}
      </div>

      <div className="layout">
        <div className="main">
          <div className="cal-strip">
            {CAL_DAYS.map((day) => (
              <div
                key={`${day.d}-${day.n}`}
                className={`cal-day${day.has ? ' has-ev' : ''}${calendarDay === day.n ? ' on' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => onCalDayClick(day.n)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onCalDayClick(day.n);
                  }
                }}
              >
                <div className="cd-d">{day.d}</div>
                <div className="cd-n">{day.n}</div>
              </div>
            ))}
          </div>
          <div className="sort-row">
            <span className="cnt">Показано {visibility.count} событий</span>
            <select className="sort-sel" defaultValue="nearest">
              <option value="nearest">Сначала ближайшие</option>
              <option value="pop">По популярности</option>
              <option value="free">Бесплатные первые</option>
            </select>
          </div>
          <div className="events-list">
            {CARDS.map((c) => (
              <div
                key={c.name}
                className={`ec ${c.feat ? 'feat ' : ''}${c.typeClass}${visibility.map[c.name] ? '' : ' dimmed'}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPreview(c.name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPreview(c.name);
                  }
                }}
              >
                <div className="ec-img" style={c.imgStyle}>
                  {c.emoji}
                  {c.status ? <span className={`ec-status ${c.status.cls}`}>{c.status.label}</span> : null}
                  {c.priceBadge ? (
                    <span className={`ec-price-badge${c.priceBadge.cls === 'free' ? ' free' : ''}`}>{c.priceBadge.label}</span>
                  ) : null}
                </div>
                <div className="ec-body">
                  <div className="ec-tags">
                    {c.tags.map((t) => (
                      <span key={t.label} className={`etag ${t.cls}`}>
                        {t.label}
                      </span>
                    ))}
                  </div>
                  <div className="ec-title">{c.title}</div>
                  {c.desc ? <div className="ec-desc">{c.desc}</div> : null}
                  <div className="ec-meta">
                    {c.meta.map((m) => (
                      <span key={m} className="em">
                        {m}
                      </span>
                    ))}
                  </div>
                  <div className="ec-foot">{renderFoot(c, stopFoot)}</div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="more-btn">
            Показать ещё события
          </button>
        </div>

        <aside className="sidebar">
          <div className="side-sec">
            <div className="side-h">Превью события</div>
            <div className="prev">
              <div className="pv-img" style={{ background: preview.bg }}>
                {preview.ico}
              </div>
              <div className="pv-body">
                <div className="pv-when">{preview.when}</div>
                <div className="pv-title">{preview.title}</div>
                <div className="pv-loc">{preview.loc}</div>
                <div className="pv-desc">{preview.desc}</div>
                <div className="pv-prog">
                  <div className="pvp-h">Программа</div>
                  {preview.prog.map((line) => (
                    <div key={line} className="pvp-item">
                      <span className="pvp-dot" />
                      {line}
                    </div>
                  ))}
                </div>
                <div className="pv-price">
                  {preview.priceFree ? <span className="pv-free">{preview.priceLabel}</span> : preview.priceLabel}
                </div>
                <button type="button" className={`reg-big${preview.priceFree ? ' is-free' : ''}`}>
                  {preview.priceFree ? 'Бесплатная регистрация' : `Зарегистрироваться → ${preview.priceLabel}`}
                </button>
                <button type="button" className="share-btn">
                  Поделиться
                </button>
              </div>
            </div>
          </div>
          <div className="side-sec">
            <div className="side-h">Ближайшие</div>
            <div className="upc-item">
              <div className="upc-date">
                <div className="upc-day">21</div>
                <div className="upc-mon">апр</div>
              </div>
              <div>
                <div className="upc-title">Состояние = Деньги</div>
                <div className="upc-meta">Москва · Бесплатно</div>
              </div>
            </div>
            <div className="upc-item">
              <div className="upc-date">
                <div className="upc-day">22</div>
                <div className="upc-mon">апр</div>
              </div>
              <div>
                <div className="upc-title">9 шагов к свободе</div>
                <div className="upc-meta">Онлайн · Бесплатно</div>
              </div>
            </div>
            <div className="upc-item">
              <div className="upc-date">
                <div className="upc-day">24</div>
                <div className="upc-mon">апр</div>
              </div>
              <div>
                <div className="upc-title">Потолок дохода</div>
                <div className="upc-meta">Онлайн · 3 500 ₽</div>
              </div>
            </div>
            <div className="upc-item">
              <div className="upc-date">
                <div className="upc-day">15</div>
                <div className="upc-mon">май</div>
              </div>
              <div>
                <div className="upc-title">Ретрит Алтай</div>
                <div className="upc-meta">Алтай · от 45 000 ₽</div>
              </div>
            </div>
          </div>
          <div className="side-sec">
            <div className="side-h">Статистика апреля</div>
            <div className="stats-grid">
              <div className="sc">
                <div className="sc-n">24</div>
                <div className="sc-l">событий</div>
              </div>
              <div className="sc">
                <div className="sc-n">8</div>
                <div className="sc-l">бесплатных</div>
              </div>
              <div className="sc">
                <div className="sc-n">312</div>
                <div className="sc-l">участников</div>
              </div>
              <div className="sc">
                <div className="sc-n">6</div>
                <div className="sc-l">городов</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SoulSynergyEventsPage;
