import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import './DigitalProductsPage.css';
import api from '../api/axios';

type Fmt = 'all' | 'audio' | 'video' | 'text' | 'bundle';
type Cat = '' | 'soul' | 'money' | 'heal' | 'chan' | 'med' | 'rel';

interface Product {
  id: number | string;
  fmt: Fmt;
  cat: string;
  isNew: boolean;
  price: number;
  thumbBg: string;
  emoji: string;
  imageUrl?: string;
  badge: string;
  tagClass: 'dp-tag-p' | 'dp-tag-t' | 'dp-tag-a';
  tagLabel: string;
  title: string;
  desc?: string;
  meta: string;
  metaDetail: string;
  featured?: boolean;
  hitLabel?: string;
  btnClass?: string;
  btnLabel: string;
  raw?: ApiProduct;
}

interface ApiProduct {
  id: number;
  title: string;
  description?: string;
  price?: number | string;
  image_url?: string;
  product_format?: Fmt;
  category_key?: string;
  is_new?: boolean;
  thumb_bg?: string;
  emoji?: string;
  badge?: string;
  tag_label?: string;
  meta_detail?: string;
  is_featured?: boolean;
  hit_label?: string;
  button_label?: string;
  expert_name?: string;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    fmt: 'bundle',
    cat: 'money soul',
    isNew: true,
    price: 16369,
    thumbBg: '#eae8fb',
    emoji: '🏆',
    badge: '📦 Пакет курса',
    tagClass: 'dp-tag-p',
    tagLabel: 'Деньги · Рост',
    title: 'Финансовая эволюция: MoneyMaker — полный курс',
    desc: '3 модуля глубинной работы с деньгами, страхами масштаба и внутренними блоками.',
    meta: 'Рахмат',
    metaDetail: '3 модуля · 6 часов',
    featured: true,
    hitLabel: 'Хит',
    btnLabel: 'Открыть',
  },
  {
    id: 2,
    fmt: 'video',
    cat: 'soul heal',
    isNew: false,
    price: 2500,
    thumbBg: '#e2f7f0',
    emoji: '🎬',
    badge: '🎬 Запись эфира',
    tagClass: 'dp-tag-t',
    tagLabel: 'Психология',
    title: 'Гипноз и внутренние ограничения',
    meta: 'Дарья',
    metaDetail: '2.5 часа',
    btnClass: 'dp-teal',
    btnLabel: 'Открыть',
  },
  {
    id: 3,
    fmt: 'audio',
    cat: 'med soul',
    isNew: true,
    price: 1500,
    thumbBg: '#eae8fb',
    emoji: '🎧',
    badge: '🎧 Аудио',
    tagClass: 'dp-tag-p',
    tagLabel: 'Медитации',
    title: 'Пакет медитаций: утренние практики',
    meta: 'Юлия',
    metaDetail: '7 треков',
    btnLabel: 'Открыть',
  },
  {
    id: 4,
    fmt: 'text',
    cat: 'money',
    isNew: false,
    price: 990,
    thumbBg: '#fdf2e0',
    emoji: '📄',
    badge: '📄 PDF-гайд',
    tagClass: 'dp-tag-a',
    tagLabel: 'Деньги',
    title: '9 шагов к внутренней свободе. Рабочая тетрадь',
    meta: 'Анастасия',
    metaDetail: '42 стр.',
    btnLabel: 'Открыть',
  },
  {
    id: 5,
    fmt: 'audio',
    cat: 'chan soul',
    isNew: true,
    price: 1200,
    thumbBg: '#eae8fb',
    emoji: '✨',
    badge: '🎧 Аудио',
    tagClass: 'dp-tag-p',
    tagLabel: 'Ченнелинг',
    title: 'Послания света — апрель 2026',
    meta: 'Диана',
    metaDetail: '38 мин',
    btnLabel: 'Открыть',
  },
  {
    id: 6,
    fmt: 'video',
    cat: 'money soul',
    isNew: false,
    price: 4900,
    thumbBg: '#e2f7f0',
    emoji: '🎬',
    badge: '🎬 Видеокурс',
    tagClass: 'dp-tag-t',
    tagLabel: 'Психосоматика',
    title: 'Курс по психосоматике: тело знает',
    meta: 'Амина',
    metaDetail: '5 модулей',
    btnClass: 'dp-teal',
    btnLabel: 'Открыть',
  },
  {
    id: 7,
    fmt: 'text',
    cat: 'chan soul',
    isNew: false,
    price: 1900,
    thumbBg: '#eae8fb',
    emoji: '🌙',
    badge: '📄 Гайд',
    tagClass: 'dp-tag-p',
    tagLabel: 'Цолькин',
    title: 'Гайд Цолькин 2026: ваш код судьбы',
    meta: 'Мадам Цолькин',
    metaDetail: '68 стр.',
    btnLabel: 'Открыть',
  },
  {
    id: 8,
    fmt: 'bundle',
    cat: 'heal med',
    isNew: false,
    price: 3500,
    thumbBg: '#fdf2e0',
    emoji: '🏔️',
    badge: '📦 Пакет',
    tagClass: 'dp-tag-a',
    tagLabel: 'Ретриты · Практики',
    title: 'Пакет: подготовка к ретриту',
    meta: 'Юлия',
    metaDetail: '3 практики + гайд',
    btnLabel: 'Открыть',
  },
  {
    id: 9,
    fmt: 'audio',
    cat: 'heal',
    isNew: false,
    price: 0,
    thumbBg: '#e2f7f0',
    emoji: '🌿',
    badge: '🎧 Бесплатно',
    tagClass: 'dp-tag-t',
    tagLabel: 'Тело и здоровье',
    title: 'Вводная медитация: сканирование тела',
    meta: 'Роман',
    metaDetail: '18 мин · демо',
    btnClass: 'dp-teal',
    btnLabel: 'Слушать',
  },
];

const FEATURED_PREVIEW = {
  emoji: '🏆',
  thumbBg: '#eae8fb',
  tagClass: 'dp-tag-p' as const,
  tagLabel: 'Деньги · Рост',
  title: 'Финансовая эволюция: MoneyMaker',
  desc: '3 модуля глубинной работы. Авторская методика трансформации отношений с деньгами.',
  modules: ['Модуль 1: Корни ограничений', 'Модуль 2: Архитектура изобилия', 'Модуль 3: Монетизация энергии'],
  price: '16 369 ₽',
  oldPrice: '22 000 ₽',
  discount: '-25%',
};

const AUTHORS = [
  { emoji: '🙏', name: 'Рахмат', cnt: '1 продукт' },
  { emoji: '🌸', name: 'Амина', cnt: '2 продукта' },
  { emoji: '🔮', name: 'Дарья', cnt: '1 продукт' },
  { emoji: '✨', name: 'Диана', cnt: '2 продукта' },
  { emoji: '🌿', name: 'Юлия', cnt: '2 продукта' },
];

function useCounter(target: number, duration = 1200, delay = 200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const timer = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [target, duration, delay]);
  return value;
}

const FMT_TABS: { key: Fmt; label: string }[] = [
  { key: 'all', label: 'Все форматы' },
  { key: 'audio', label: '🎧 Аудио' },
  { key: 'video', label: '🎬 Видео и записи' },
  { key: 'text', label: '📄 PDF и тексты' },
  { key: 'bundle', label: '📦 Пакеты' },
];

const CAT_PILLS: { key: Cat; label: string }[] = [
  { key: '', label: 'Все темы' },
  { key: 'soul', label: 'Душа и путь' },
  { key: 'money', label: 'Деньги и рост' },
  { key: 'heal', label: 'Тело и исцеление' },
  { key: 'chan', label: 'Ченнелинг' },
  { key: 'med', label: 'Медитации' },
  { key: 'rel', label: 'Отношения' },
];

const tagClassByBg = (bg?: string): Product['tagClass'] => {
  if (bg === '#e2f7f0') return 'dp-tag-t';
  if (bg === '#fdf2e0') return 'dp-tag-a';
  return 'dp-tag-p';
};

const fallbackBadgeByFormat = (fmt: Fmt) => {
  if (fmt === 'audio') return '🎧 Аудио';
  if (fmt === 'video') return '🎬 Запись эфира';
  if (fmt === 'bundle') return '📦 Пакет';
  return '📄 PDF-гайд';
};

const fallbackEmojiByFormat = (fmt: Fmt) => {
  if (fmt === 'audio') return '🎧';
  if (fmt === 'video') return '🎬';
  if (fmt === 'bundle') return '🏆';
  return '📄';
};

const mapApiProduct = (p: ApiProduct): Product => {
  const fmt = p.product_format || 'text';
  const price = Number(p.price || 0);

  return {
    id: `api-${p.id}`,
    fmt,
    cat: p.category_key || 'soul',
    isNew: Boolean(p.is_new),
    price: Number.isFinite(price) ? price : 0,
    thumbBg: p.thumb_bg || '#eae8fb',
    emoji: p.emoji || fallbackEmojiByFormat(fmt),
    imageUrl: p.image_url,
    badge: p.badge || fallbackBadgeByFormat(fmt),
    tagClass: tagClassByBg(p.thumb_bg),
    tagLabel: p.tag_label || 'Авторский продукт',
    title: p.title,
    desc: p.description,
    meta: p.expert_name || 'Эксперт',
    metaDetail: p.meta_detail || '',
    featured: Boolean(p.is_featured),
    hitLabel: p.hit_label || undefined,
    btnClass: p.thumb_bg === '#e2f7f0' ? 'dp-teal' : undefined,
    btnLabel: p.button_label || 'Открыть',
    raw: p,
  };
};

const DigitalProductsPage = () => {
  const navigate = useNavigate();
  const [activeFmt, setActiveFmt] = useState<Fmt>('all');
  const [activeCat, setActiveCat] = useState<Cat>('');
  const [showFree, setShowFree] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [previewId, setPreviewId] = useState<number | string>(1);
  const [openedProduct, setOpenedProduct] = useState<Product | null>(null);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.get('/products/digital/public')
      .then((response) => {
        const rows = Array.isArray(response.data) ? response.data : [];
        setApiProducts(rows.map(mapApiProduct));
      })
      .catch((error) => {
        console.error('Error loading digital products:', error);
      });
  }, []);

  const products = useMemo(() => [...apiProducts, ...PRODUCTS], [apiProducts]);
  const authors = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => counts.set(p.meta, (counts.get(p.meta) || 0) + 1));
    return Array.from(counts.entries()).slice(0, 8).map(([name, count], i) => ({
      emoji: ['🙏', '🌸', '🔮', '✨', '🌿', '📄', '🎧', '🎬'][i] || '✨',
      name,
      cnt: `${count} ${count === 1 ? 'продукт' : count < 5 ? 'продукта' : 'продуктов'}`
    }));
  }, [products]);

  const c1 = useCounter(Math.max(87, products.length));
  const c2 = useCounter(Math.max(24, authors.length));
  const c3 = useCounter(143);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const fmtOk = activeFmt === 'all' || p.fmt === activeFmt;
      const catOk = !activeCat || p.cat.includes(activeCat);
      const freeOk = !showFree || p.price === 0;
      const newOk = !showNew || p.isNew;
      return fmtOk && catOk && freeOk && newOk;
    });
  }, [activeFmt, activeCat, showFree, showNew, products]);

  const filteredIds = useMemo(() => new Set(filtered.map((p) => p.id)), [filtered]);

  const preview = useMemo(() => products.find((p) => p.id === previewId), [previewId, products]);

  const openProduct = (product: Product) => {
    setPreviewId(product.id);
    setOpenedProduct(product);
  };

  const openCreateProduct = () => {
    const token = localStorage.getItem('token');
    navigate(token ? '/expert-dashboard?panel=products&action=new' : '/login');
  };

  return (
    <div className="dp-page">
      <Modal
        title={openedProduct?.title}
        open={Boolean(openedProduct)}
        onCancel={() => setOpenedProduct(null)}
        footer={null}
        width={760}
        centered
      >
        {openedProduct && (
          <div className="dp-modal-product">
            <div className="dp-modal-hero" style={{ background: openedProduct.thumbBg }}>
              {openedProduct.imageUrl ? <img src={openedProduct.imageUrl} alt={openedProduct.title} /> : openedProduct.emoji}
              <span className="dp-fmt-badge">{openedProduct.badge}</span>
              {(openedProduct.hitLabel || openedProduct.isNew) && (
                <span className="dp-new-dot">{openedProduct.hitLabel || 'Новое'}</span>
              )}
            </div>
            <div className="dp-modal-body">
              <span className={`dp-cat-tag ${openedProduct.tagClass}`}>{openedProduct.tagLabel}</span>
              <h3>{openedProduct.title}</h3>
              <div className="dp-card-meta" style={{ marginBottom: 14 }}>
                <span><span className="dp-avxs" />{openedProduct.meta}</span>
                {openedProduct.metaDetail ? <span>{openedProduct.metaDetail}</span> : null}
              </div>
              <p>{openedProduct.desc || 'Авторский цифровой продукт от мастера платформы.'}</p>
              <div className="dp-price-row">
                <span className={`dp-pp-price${openedProduct.price === 0 ? ' dp-free' : ''}`}>
                  {openedProduct.price === 0 ? 'Бесплатно' : `${openedProduct.price.toLocaleString('ru-RU')} ₽`}
                </span>
              </div>
              <button type="button" className="dp-buy-btn" onClick={() => setOpenedProduct(null)}>
                {openedProduct.price === 0 ? 'Открыть' : 'Перейти к покупке'}
              </button>
            </div>
          </div>
        )}
      </Modal>
      {/* Hero */}
      <div className="dp-hero">
        <div className="dp-eyebrow">
          <svg width="7" height="7" viewBox="0 0 7 7" aria-hidden>
            <circle cx="3.5" cy="3.5" r="3" fill="#7B6FD4" />
          </svg>
          Новый раздел платформы
        </div>
        <div className="dp-hero-h">
          Практики, которые работают <em>в вашем темпе</em>
        </div>
        <div className="dp-hero-sub">
          Записи эфиров, курсы, аудио-медитации, PDF-гайды и ченнелинг-пакеты от мастеров платформы.
          Купил — и возвращаешься когда готов.
        </div>
        <div className="dp-stats">
          <div className="dp-stat">
            <div className="dp-stat-n">{c1}</div>
            <div className="dp-stat-l">продуктов</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-n">{c2}</div>
            <div className="dp-stat-l">мастеров-авторов</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-n">{c3}</div>
            <div className="dp-stat-l">покупок этой недели</div>
          </div>
        </div>
        <div className="dp-fmt-tabs">
          {FMT_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`dp-fmtab${activeFmt === t.key ? ' dp-on' : ''}`}
              onClick={() => setActiveFmt(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="dp-filter-bar">
        <span className="dp-fb-label">Тема:</span>
        {CAT_PILLS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`dp-pill${activeCat === p.key ? ' dp-on' : ''}`}
            onClick={() => setActiveCat(p.key)}
          >
            {p.label}
          </button>
        ))}
        <div className="dp-divider" />
        <button
          type="button"
          className={`dp-pill${showFree ? ' dp-on-t' : ''}`}
          onClick={() => setShowFree((v) => !v)}
        >
          Бесплатные
        </button>
        <button
          type="button"
          className={`dp-pill${showNew ? ' dp-on' : ''}`}
          onClick={() => setShowNew((v) => !v)}
        >
          Новинки
        </button>
      </div>

      {/* Layout */}
      <div className="dp-layout">
        <div className="dp-main">
          <div className="dp-sort-row">
            <span className="dp-count">Найдено {filtered.length} продуктов</span>
            <select className="dp-sort-sel">
              <option>По популярности</option>
              <option>Сначала новые</option>
              <option>Дешевле</option>
              <option>Дороже</option>
            </select>
          </div>

          <div className="dp-grid">
            {products.map((p) => {
              const visible = filteredIds.has(p.id);
              if (p.featured) {
                return (
                  <div
                    key={p.id}
                    className={`dp-card dp-feat${!visible ? ' dp-dimmed' : ''}`}
                    onClick={() => openProduct(p)}
                  >
                    <div className="dp-thumb" style={{ background: p.thumbBg }}>
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.title} /> : p.emoji}
                      {p.hitLabel && <span className="dp-new-dot">{p.hitLabel}</span>}
                      <span className="dp-fmt-badge">{p.badge}</span>
                    </div>
                    <div className="dp-card-body">
                      <span className={`dp-cat-tag ${p.tagClass}`}>{p.tagLabel}</span>
                      <div className="dp-card-title">{p.title}</div>
                      {p.desc && <div className="dp-card-desc">{p.desc}</div>}
                      <div className="dp-card-meta">
                        <span><span className="dp-avxs" />{p.meta}</span>
                        <span>{p.metaDetail}</span>
                        <span>⭐ 4.9</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={p.id}
                  className={`dp-card${!visible ? ' dp-dimmed' : ''}`}
                  onClick={() => openProduct(p)}
                >
                  <div className="dp-thumb" style={{ background: p.thumbBg }}>
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.title} /> : p.emoji}
                    {p.isNew && <span className="dp-new-dot">Новое</span>}
                    <span className="dp-fmt-badge">{p.badge}</span>
                  </div>
                  <div className="dp-card-body">
                    <span className={`dp-cat-tag ${p.tagClass}`}>{p.tagLabel}</span>
                    <div className="dp-card-title">{p.title}</div>
                    <div className="dp-card-meta">
                      <span><span className="dp-avxs" />{p.meta}</span>
                      <span>{p.metaDetail}</span>
                    </div>
                  </div>
                  <div className="dp-card-foot">
                    <span className={`dp-price${p.price === 0 ? ' dp-free' : ''}`}>
                      {p.price === 0 ? 'Бесплатно' : `${p.price.toLocaleString('ru-RU')} ₽`}
                    </span>
                    <button
                      type="button"
                      className={`dp-open-btn${p.btnClass ? ` ${p.btnClass}` : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openProduct(p);
                      }}
                    >
                      {p.btnLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" className="dp-more-btn">Показать ещё продукты</button>

          {/* Мобильный промо-блок — виден только когда сайдбар скрыт */}
          <div className="dp-mobile-promo">
            <div className="dp-promo">
              <h4>Вы мастер?</h4>
              <p>Загрузите свой курс, запись или медитацию и начните зарабатывать на платформе.</p>
              <button type="button" className="dp-promo-btn" onClick={openCreateProduct}>Добавить продукт</button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="dp-sidebar">
          <div className="dp-side-sec">
            <div className="dp-side-h">Превью продукта</div>
            <div className="dp-prev">
              {preview ? (
                <>
                  <div className="dp-pp-thumb" style={{ background: preview.thumbBg }}>
                    {preview.imageUrl ? <img src={preview.imageUrl} alt={preview.title} /> : preview.emoji}
                  </div>
                  <div className="dp-pp-body">
                    <span className={`dp-pp-cat ${preview.tagClass}`}>{preview.tagLabel}</span>
                    <div className="dp-pp-title">{preview.title}</div>
                    <div className="dp-pp-desc">
                      {preview.desc || 'Авторская практика от мастера платформы.'}
                    </div>
                    {preview.id === 1 && (
                      <div className="dp-pp-modules">
                        <div className="dp-ppm-title">Что внутри</div>
                        {FEATURED_PREVIEW.modules.map((m) => (
                          <div key={m} className="dp-ppm-item">
                            <span className="dp-ppm-dot" />
                            {m}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="dp-price-row">
                      <div>
                        <span className="dp-pp-price">
                          {preview.price === 0 ? 'Бесплатно' : `${preview.price.toLocaleString('ru-RU')} ₽`}
                        </span>
                        {preview.id === 1 && <span className="dp-pp-old">22 000 ₽</span>}
                      </div>
                      {preview.id === 1 && <span className="dp-discount-badge">-25%</span>}
                    </div>
                    <button type="button" className="dp-buy-btn" onClick={() => openProduct(preview)}>Открыть практику →</button>
                    <button type="button" className="dp-wish-btn">В избранное</button>
                  </div>
                </>
              ) : (
                <div className="dp-pp-body" style={{ textAlign: 'center', color: '#a8a5c4', padding: '24px 14px' }}>
                  Выберите продукт
                </div>
              )}
            </div>
          </div>

          <div className="dp-side-sec">
            <div className="dp-side-h">Авторы продуктов</div>
            {authors.map((a) => (
              <div key={a.name} className="dp-author-item">
                <div className="dp-author-ava">{a.emoji}</div>
                <div>
                  <div className="dp-author-name">{a.name}</div>
                  <div className="dp-author-cnt">{a.cnt}</div>
                </div>
                <span className="dp-author-arrow">→</span>
              </div>
            ))}
          </div>

          <div className="dp-side-sec">
            <div className="dp-promo">
              <h4>Вы мастер?</h4>
              <p>Загрузите свой курс, запись или медитацию и начните зарабатывать на платформе.</p>
              <button type="button" className="dp-promo-btn" onClick={openCreateProduct}>Добавить продукт</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DigitalProductsPage;
