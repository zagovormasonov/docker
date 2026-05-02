import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spin, Button, Space, Modal, Switch } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined, EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/ru';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import ServiceManager from '../components/profile/ServiceManager';
import ProductManager from '../components/profile/ProductManager';
import '../components/ExpertCalendar.css';
import './ExpertCabinetV2.css';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);
dayjs.locale('ru');

type Panel = 'dashboard' | 'profile' | 'calendar' | 'clients' | 'services' | 'products' | 'income';

interface Client {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  last_booking_date?: string;
  total_bookings: number;
}

interface Booking {
  id: number;
  date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  client_name: string;
  client_email: string;
  client_avatar?: string;
  client_message?: string;
  rejection_reason?: string;
  created_at: string;
}

interface NotifRow {
  id: number;
  title?: string;
  message?: string;
  is_read?: boolean;
  created_at: string;
}

interface ExpertSchedule {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

const PH = ['🌸', '🦋', '🔮', '🌿', '✨', '🙏'];

function IconGrid() {
  return (
    <svg className="ec-cm-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg className="ec-cm-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1" />
      <path d="M2 13.5C2 11 4.7 9 8 9C11.3 9 14 11 14 13.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
function IconCal() {
  return (
    <svg className="ec-cm-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1" />
      <path d="M1.5 6.5h13M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
function IconClients() {
  return (
    <svg className="ec-cm-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1" />
      <path d="M1 13C1 10.8 3.2 9 6 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <circle cx="11.5" cy="6" r="2" stroke="currentColor" strokeWidth="1" />
      <path d="M8.5 13C8.5 11.3 9.8 10 11.5 10C13.2 10 14.5 11.3 14.5 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg className="ec-cm-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.5L10 5.5L14.5 6.2L11.3 9.3L12 14L8 12L4 14L4.7 9.3L1.5 6.2L6 5.5L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconBox() {
  return (
    <svg className="ec-cm-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1" />
      <path d="M5 4V3C5 2.4 5.4 2 6 2h4C10.6 2 11 2.4 11 3v1" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
function IconIncome() {
  return (
    <svg className="ec-cm-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 12L5.5 7.5L8.5 9.5L12 5L14 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ExpertDashboardPage: React.FC = () => {
  const { user, loading: authLoading, token } = useAuth();
  const navigate = useNavigate();

  const [panel, setPanel] = useState<Panel>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [incomingCount, setIncomingCount] = useState(0);
  const [calMonth, setCalMonth] = useState(dayjs());
  const [pickDay, setPickDay] = useState(dayjs());
  const [schedules, setSchedules] = useState<ExpertSchedule[]>([]);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [scheduleErr, setScheduleErr] = useState('');
  const [scheduleOk, setScheduleOk] = useState('');
  const [activeScheduleForms, setActiveScheduleForms] = useState<Record<number, { startTime: string; endTime: string }[]>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const loadAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [bk, inc, cl, ex, pr, nt] = await Promise.all([
        api.get('/bookings/expert/bookings'),
        api.get('/bookings/incoming').catch(() => ({ data: [] })),
        api.get('/experts/my-clients').catch(() => ({ data: [] })),
        api.get(`/experts/${user.id}`).catch(() => ({ data: {} })),
        api.get('/products').catch(() => ({ data: [] })),
        api.get('/notifications').catch(() => ({ data: { notifications: [] } })),
      ]);
      setAllBookings(bk.data || []);
      setIncomingCount((inc.data || []).length);
      setClients(cl.data || []);
      setServices(ex.data?.services || []);
      setProducts(Array.isArray(pr.data) ? pr.data : []);
      setNotifications(nt.data?.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.userType !== 'expert' && user.userType !== 'admin')) {
      navigate('/profile');
      return;
    }
    loadAll();
  }, [user, authLoading, navigate, loadAll]);

  useEffect(() => {
    if (panel === 'clients' && user) loadAll();
  }, [panel, user, loadAll]);

  const loadSchedules = useCallback(async () => {
    try {
      const r = await api.get('/schedule/expert/schedule');
      setSchedules(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      console.error(e);
      setScheduleErr('Не удалось загрузить расписание');
    }
  }, []);

  useEffect(() => {
    if (panel === 'calendar') loadSchedules();
  }, [panel, loadSchedules]);

  useEffect(() => {
    if (!scheduleOk) return;
    const t = window.setTimeout(() => setScheduleOk(''), 4500);
    return () => window.clearTimeout(t);
  }, [scheduleOk]);

  const formatDate = (dateStr: string, timeSlot?: string) => {
    const d = dayjs(dateStr);
    const formatted = d.locale('ru').format('D MMMM YYYY');
    return `${formatted}${timeSlot ? `, ${timeSlot}` : ''} МСК`;
  };

  const bookingDayKey = (d: string) => dayjs(d).format('YYYY-MM-DD');

  const pendingBookings = useMemo(() => allBookings.filter((b) => b.status === 'pending'), [allBookings]);
  const confirmedBookings = useMemo(() => allBookings.filter((b) => b.status === 'confirmed'), [allBookings]);

  const weekBookingsCount = useMemo(() => {
    const start = dayjs().startOf('isoWeek');
    const end = dayjs().endOf('isoWeek');
    return allBookings.filter(
      (b) => ['pending', 'confirmed'].includes(b.status) && dayjs(b.date).isBetween(start, end, 'day', '[]')
    ).length;
  }, [allBookings]);

  const monthBookingsCount = useMemo(() => {
    const m = dayjs().month();
    const y = dayjs().year();
    return allBookings.filter((b) => dayjs(b.date).month() === m && dayjs(b.date).year() === y && b.status === 'confirmed').length;
  }, [allBookings]);

  const incomeEstimate = useMemo(() => {
    if (!services.length || !monthBookingsCount) return 0;
    const avg = services.reduce((s, x) => s + Number(x.price || 0), 0) / services.length;
    return Math.round(avg * monthBookingsCount);
  }, [services, monthBookingsCount]);

  const digitalCount = useMemo(() => products.filter((p) => p.product_type === 'digital').length, [products]);

  const chartMonths = useMemo(() => {
    const out: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = dayjs().subtract(i, 'month');
      const c = allBookings.filter(
        (b) => dayjs(b.date).month() === m.month() && dayjs(b.date).year() === m.year() && ['confirmed', 'pending'].includes(b.status)
      ).length;
      out.push({ label: m.locale('ru').format('MMM'), count: c });
    }
    return out;
  }, [allBookings]);

  const maxChart = useMemo(() => Math.max(...chartMonths.map((x) => x.count), 1), [chartMonths]);

  const calCells = useMemo(() => {
    const start = calMonth.startOf('month');
    const daysInMonth = calMonth.daysInMonth();
    let pad = start.day() === 0 ? 6 : start.day() - 1;
    const cells: { day: number | null; key: string }[] = [];
    while (pad > 0) {
      cells.push({ day: null, key: `p${pad}` });
      pad--;
    }
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: `d${d}` });
    return cells;
  }, [calMonth]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    allBookings.forEach((b) => {
      const k = bookingDayKey(b.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(b);
    });
    return map;
  }, [allBookings]);

  const scheduleByWeekday = useMemo(() => {
    const acc: Record<number, ExpertSchedule[]> = {};
    schedules.forEach((s) => {
      if (!acc[s.day_of_week]) acc[s.day_of_week] = [];
      acc[s.day_of_week].push(s);
    });
    return acc;
  }, [schedules]);

  const slotsForPickDay = useMemo(() => {
    const k = pickDay.format('YYYY-MM-DD');
    return bookingsByDay.get(k) || [];
  }, [pickDay, bookingsByDay]);

  const topicNames = useMemo(() => {
    const t = user?.topics;
    if (!t || !Array.isArray(t)) return [];
    return t.map((x: any) => (typeof x === 'object' && x?.name ? x.name : String(x)));
  }, [user?.topics]);

  const completeness = useMemo(() => {
    if (!user) return 0;
    let ok = 0;
    const total = 7;
    if (user.name) ok++;
    if (user.bio) ok++;
    if (user.avatarUrl) ok++;
    if (user.city) ok++;
    if (topicNames.length) ok++;
    if (services.length) ok++;
    if (user.telegramUrl || user.vkUrl) ok++;
    return Math.min(100, Math.round((ok / total) * 100));
  }, [user, topicNames.length, services.length]);

  const recentClients = useMemo(() => {
    const sorted = [...clients].sort((a, b) => {
      const da = a.last_booking_date ? dayjs(a.last_booking_date).valueOf() : 0;
      const db = b.last_booking_date ? dayjs(b.last_booking_date).valueOf() : 0;
      return db - da;
    });
    return sorted.slice(0, 4);
  }, [clients]);

  const handleBookingAction = async (id: number, action: 'confirm' | 'reject', reason?: string) => {
    try {
      await api.put(`/bookings/${id}/${action}`, { rejectionReason: reason });
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!confirm('Отменить запись?')) return;
    try {
      await api.put(`/bookings/expert/bookings/${id}/status`, {
        status: 'cancelled',
        rejectionReason: 'Отменено экспертом',
      });
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const clearScheduleMsgs = () => {
    setScheduleErr('');
    setScheduleOk('');
  };

  const addScheduleFormRow = (dayOfWeek: number) => {
    setActiveScheduleForms((prev) => ({
      ...prev,
      [dayOfWeek]: [...(prev[dayOfWeek] || []), { startTime: '09:00', endTime: '18:00' }],
    }));
  };

  const removeScheduleFormRow = (dayOfWeek: number, index: number) => {
    setActiveScheduleForms((prev) => ({
      ...prev,
      [dayOfWeek]: (prev[dayOfWeek] || []).filter((_, i) => i !== index),
    }));
  };

  const updateScheduleFormRow = (dayOfWeek: number, index: number, field: 'startTime' | 'endTime', value: string) => {
    setActiveScheduleForms((prev) => ({
      ...prev,
      [dayOfWeek]: (prev[dayOfWeek] || []).map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  };

  const handleExpertScheduleAdd = async (dayOfWeek: number, index: number) => {
    const form = activeScheduleForms[dayOfWeek]?.[index];
    if (!form) return;
    const { startTime, endTime } = form;
    if (!startTime || !endTime) {
      setScheduleErr('Укажите время начала и окончания');
      return;
    }
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    if (start >= end) {
      setScheduleErr('Время начала должно быть раньше окончания');
      return;
    }
    setScheduleBusy(true);
    clearScheduleMsgs();
    try {
      await api.post('/schedule/expert/schedule', { dayOfWeek, startTime, endTime });
      setScheduleOk('Слот добавлен');
      removeScheduleFormRow(dayOfWeek, index);
      await loadSchedules();
    } catch (err: any) {
      setScheduleErr(err.response?.data?.error || 'Ошибка добавления слота');
    } finally {
      setScheduleBusy(false);
    }
  };

  const handleExpertScheduleDelete = async (scheduleId: number) => {
    clearScheduleMsgs();
    try {
      await api.delete(`/schedule/expert/schedule/${scheduleId}`);
      setScheduleOk('Слот удалён');
      await loadSchedules();
    } catch (err: any) {
      setScheduleErr(err.response?.data?.error || 'Ошибка удаления');
    }
  };

  const handleExpertScheduleToggle = async (scheduleId: number, isActive: boolean) => {
    clearScheduleMsgs();
    try {
      await api.put(`/schedule/expert/schedule/${scheduleId}/toggle`, { isActive });
      setScheduleOk(isActive ? 'Слот включён' : 'Слот выключен');
      await loadSchedules();
    } catch (err: any) {
      setScheduleErr(err.response?.data?.error || 'Ошибка переключения слота');
    }
  };

  if (authLoading) {
    return (
      <div className="ec-loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!user || (user.userType !== 'expert' && user.userType !== 'admin')) return null;

  const subToday = dayjs().locale('ru').format('dddd, D MMMM YYYY');
  const greeting = `Добрый день, ${user.name?.split(' ')[0] || 'мастер'} 🙏`;

  const MenuBtn = ({ id, icon, label, badge }: { id: Panel; icon: React.ReactNode; label: string; badge?: number }) => (
    <button type="button" className={`ec-cm-item ${panel === id ? 'ec-active' : ''}`} onClick={() => setPanel(id)}>
      {icon}
      <span>{label}</span>
      {badge != null && badge > 0 ? <span className="ec-cm-badge">{badge}</span> : null}
    </button>
  );

  const renderMiniCalendar = (onPick?: boolean) => (
    <>
      <div className="ec-cal-hdr">
        <span className="ec-cal-month">{calMonth.locale('ru').format('MMMM YYYY')}</span>
        <div className="ec-cal-nav">
          <button type="button" className="ec-cal-nav-btn" aria-label="Назад" onClick={() => setCalMonth((m) => m.subtract(1, 'month'))}>
            ‹
          </button>
          <button type="button" className="ec-cal-nav-btn" aria-label="Вперёд" onClick={() => setCalMonth((m) => m.add(1, 'month'))}>
            ›
          </button>
        </div>
      </div>
      <div className="ec-cal-grid">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
          <div key={d} className="ec-cal-dow">
            {d}
          </div>
        ))}
        {calCells.map(({ day, key }) => {
          if (day === null) return <div key={key} className="ec-cal-cell ec-empty" />;
          const date = calMonth.date(day);
          const k = date.format('YYYY-MM-DD');
          const dayBk = bookingsByDay.get(k) || [];
          const has = dayBk.length > 0;
          const booked = dayBk.some((b) => b.status === 'confirmed');
          const isToday = date.isSame(dayjs(), 'day');
          let cls = 'ec-cal-cell';
          if (isToday) cls += ' ec-today';
          else if (booked) cls += ' ec-booked';
          else if (has) cls += ' ec-has-slot';
          return (
            <button
              key={key}
              type="button"
              className={cls}
              onClick={() => {
                if (onPick) setPickDay(date);
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </>
  );

  const renderDashboard = () => (
    <>
      <div className="ec-page-title">{greeting}</div>
      <div className="ec-page-sub">Всё время по МСК · {subToday}</div>

      <div className="ec-stats-row">
        <div className="ec-sc">
          <div className="ec-sc-label">
            Записи этой недели <span>📅</span>
          </div>
          <div className="ec-sc-val">{weekBookingsCount}</div>
          {incomingCount > 0 ? <span className="ec-sc-delta ec-delta-up">+{incomingCount} нов.</span> : <span className="ec-sc-delta ec-delta-neutral">без новых</span>}
        </div>
        <div className="ec-sc">
          <div className="ec-sc-label">
            Доход (оценка){' '}
            <span title="По средней цене услуги × число подтверждённых записей в месяце">💰</span>
          </div>
          <div className="ec-sc-val">{incomeEstimate > 0 ? `${incomeEstimate.toLocaleString('ru-RU')} ₽` : '—'}</div>
          <span className="ec-sc-delta ec-delta-neutral">{monthBookingsCount} записей в месяце</span>
        </div>
        <div className="ec-sc">
          <div className="ec-sc-label">
            Услуг в профиле <span>💼</span>
          </div>
          <div className="ec-sc-val">{services.length}</div>
          <span className="ec-sc-delta ec-delta-neutral">цифр. продуктов: {digitalCount}</span>
        </div>
        <div className="ec-sc">
          <div className="ec-sc-label">
            Клиентов <span>👥</span>
          </div>
          <div className="ec-sc-val">{clients.length}</div>
          <span className="ec-sc-delta ec-delta-neutral">в базе</span>
        </div>
      </div>

      <div className="ec-two-col">
        <div className="ec-col-card">
          <div className="ec-cc-hdr">
            <span className="ec-cc-title">Календарь записей</span>
            <button type="button" className="ec-cc-action" onClick={() => setPanel('calendar')}>
              Открыть →
            </button>
          </div>
          {renderMiniCalendar(true)}
          <div className="ec-slots-list">
            {slotsForPickDay.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ec-t3)', padding: '8px 0' }}>Нет записей на выбранный день</div>
            ) : (
              slotsForPickDay.map((b) => (
                <div key={b.id} className={`ec-slot ${b.status === 'confirmed' ? 'ec-booked' : 'ec-available'}`}>
                  <span className="ec-slot-time">{b.time_slot || '—'}</span>
                  <span className="ec-slot-dur">запись</span>
                  <span className="ec-slot-client">{b.client_name}</span>
                  <span className={`ec-slot-status ${b.status === 'confirmed' ? 'ec-st-book' : 'ec-st-avail'}`}>
                    {b.status === 'pending' ? 'Ожидает' : b.status === 'confirmed' ? 'Записана' : b.status}
                  </span>
                </div>
              ))
            )}
            <button type="button" className="ec-slot-add" onClick={() => setPanel('calendar')}>
              + Управление слотами
            </button>
          </div>
        </div>

        <div className="ec-col-card">
          <div className="ec-cc-hdr">
            <span className="ec-cc-title">Последние клиенты</span>
            <button type="button" className="ec-cc-action" onClick={() => setPanel('clients')}>
              Все →
            </button>
          </div>
          {recentClients.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ec-t3)', fontSize: 13 }}>Клиентов пока нет</div>
          ) : (
            recentClients.map((c, i) => (
              <div key={c.id} className="ec-client-item">
                <div className="ec-cl-ava">{c.avatar_url ? <img src={c.avatar_url} alt="" /> : PH[c.id % PH.length]}</div>
                <div>
                  <div className="ec-cl-name">{c.name}</div>
                  <div className="ec-cl-meta">
                    {c.total_bookings} записей
                    {c.last_booking_date ? ` · ${dayjs(c.last_booking_date).locale('ru').format('DD MMM')}` : ''}
                  </div>
                </div>
                <div className="ec-cl-last">
                  <div className="ec-cl-date">{i === 0 ? 'недавно' : ''}</div>
                  <div className="ec-cl-amount">{c.email ? '' : ''}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="ec-two-col">
        <div className="ec-col-card">
          <div className="ec-cc-hdr">
            <span className="ec-cc-title">Активность по месяцам</span>
            <button type="button" className="ec-cc-action" onClick={() => setPanel('income')}>
              Подробнее →
            </button>
          </div>
          <div className="ec-income-chart">
            <div className="ec-chart-bars">
              {chartMonths.map((x, i) => (
                <div key={x.label} className="ec-bar-wrap">
                  <div
                    className={`ec-bar ${i === chartMonths.length - 1 ? 'ec-bar-active' : ''}`}
                    style={{ height: `${Math.round((x.count / maxChart) * 78)}px` }}
                  />
                  <div className="ec-bar-label">{x.label}</div>
                </div>
              ))}
            </div>
            <div className="ec-chart-total">
              <span className="ec-ct-val">{allBookings.filter((b) => ['confirmed', 'pending'].includes(b.status)).length}</span>
              <span className="ec-ct-sub">всего записей в разделе</span>
            </div>
          </div>
        </div>

        <div className="ec-col-card">
          <div className="ec-cc-hdr">
            <span className="ec-cc-title">Уведомления</span>
            <button type="button" className="ec-cc-action" onClick={() => navigate('/profile')}>
              Профиль →
            </button>
          </div>
          {notifications.slice(0, 5).map((n) => (
            <div key={n.id} className={`ec-notif-item ${!n.is_read ? 'ec-unread' : ''}`}>
              <div className="ec-ni-ico" style={{ background: 'var(--ec-acp)' }}>
                📬
              </div>
              <div>
                <div className="ec-ni-text">{n.title || n.message || 'Уведомление'}</div>
                <div className="ec-ni-time">{dayjs(n.created_at).locale('ru').format('DD MMM · HH:mm')}</div>
              </div>
            </div>
          ))}
          {!notifications.length && <div style={{ padding: 24, fontSize: 13, color: 'var(--ec-t3)' }}>Нет уведомлений</div>}
        </div>
      </div>

      {pendingBookings.length > 0 && (
        <div className="ec-col-card" style={{ marginBottom: 20 }}>
          <div className="ec-cc-hdr">
            <span className="ec-cc-title">Ожидают подтверждения ({pendingBookings.length})</span>
          </div>
          <div style={{ padding: 16 }}>
            {pendingBookings.map((b) => (
              <div key={b.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--ec-bd)' }}>
                <div style={{ fontWeight: 600 }}>{b.client_name}</div>
                <div style={{ fontSize: 12, color: 'var(--ec-t3)', marginTop: 4 }}>{formatDate(b.date, b.time_slot)}</div>
                <Space style={{ marginTop: 8 }}>
                  <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleBookingAction(b.id, 'confirm')}>
                    Подтвердить
                  </Button>
                  <Button
                    danger
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => {
                      const r = prompt('Причина отклонения (необязательно):');
                      if (r !== null) handleBookingAction(b.id, 'reject', r || undefined);
                    }}
                  >
                    Отклонить
                  </Button>
                </Space>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const renderProfile = () => (
    <>
      <div className="ec-page-title">Мой профиль</div>
      <div className="ec-page-sub">Так вас видят искатели в каталоге мастеров</div>
      <div className="ec-profile-panel">
        <div className="ec-pp-cover" />
        <div className="ec-pp-ava-wrap">
          <div className="ec-pp-ava">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <UserOutlined style={{ fontSize: 22, color: '#fff' }} />}</div>
          <button type="button" className="ec-pp-edit-btn" onClick={() => navigate('/profile')}>
            ✏️ Редактировать профиль
          </button>
        </div>
        <div className="ec-pp-info">
          <div className="ec-pp-name">{user.name}</div>
          <div className="ec-pp-role">
            {[user.userType === 'admin' ? 'Админ' : 'Эксперт', user.city].filter(Boolean).join(' · ')}
          </div>
          {user.bio ? <div className="ec-pp-bio">{user.bio}</div> : <div className="ec-pp-bio" style={{ color: 'var(--ec-t3)' }}>Добавьте описание в настройках профиля</div>}
          {topicNames.length > 0 && (
            <div className="ec-pp-tags">
              {topicNames.slice(0, 8).map((t) => (
                <span key={t} className="ec-ptag">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="ec-pp-links">
            {user.vkUrl ? (
              <a className="ec-plink" href={user.vkUrl} target="_blank" rel="noreferrer">
                VK
              </a>
            ) : null}
            {user.telegramUrl ? (
              <a className="ec-plink" href={user.telegramUrl} target="_blank" rel="noreferrer">
                Telegram
              </a>
            ) : null}
          </div>
        </div>
        <div className="ec-pp-complete">
          <div className="ec-pc-row">
            <span className="ec-pc-label">Заполненность профиля</span>
            <span className="ec-pc-pct">{completeness}%</span>
          </div>
          <div className="ec-pc-bar">
            <div className="ec-pc-fill" style={{ width: `${completeness}%` }} />
          </div>
          <div className="ec-pc-bar" style={{ marginTop: 8, fontSize: 11, color: 'var(--ec-t3)' }}>
            Откройте раздел «Редактировать профиль» для детальных настроек
          </div>
        </div>
      </div>
      <div className="ec-two-col">
        <div className="ec-col-card">
          <div className="ec-cc-hdr">
            <span className="ec-cc-title">Услуги в профиле</span>
            <button type="button" className="ec-cc-action" onClick={() => setPanel('services')}>
              Управление →
            </button>
          </div>
          {services.slice(0, 4).map((s) => (
            <div key={s.id} className="ec-svc-item">
              <div className="ec-svc-ico" style={{ background: 'var(--ec-acp)' }}>
                🤝
              </div>
              <div>
                <div className="ec-svc-name">{s.title}</div>
                <div className="ec-svc-desc">
                  {s.duration ? `${s.duration} мин` : ''} · {s.service_type || 'формат'}
                </div>
              </div>
              <span className="ec-svc-price">{Number(s.price || 0).toLocaleString('ru-RU')} ₽</span>
            </div>
          ))}
          {!services.length && <div style={{ padding: 16, fontSize: 13, color: 'var(--ec-t3)' }}>Услуги не добавлены</div>}
          <button type="button" className="ec-add-svc-btn" onClick={() => setPanel('services')}>
            + Добавить услугу
          </button>
        </div>
        <div className="ec-col-card">
          <div className="ec-cc-hdr">
            <span className="ec-cc-title">Цифровые продукты</span>
            <button type="button" className="ec-cc-action" onClick={() => setPanel('products')}>
              Управление →
            </button>
          </div>
          {products
            .filter((p) => p.product_type === 'digital')
            .slice(0, 4)
            .map((p) => (
              <div key={p.id} className="ec-svc-item">
                <div className="ec-svc-ico" style={{ background: 'var(--ec-ambl)' }}>
                  🏆
                </div>
                <div>
                  <div className="ec-svc-name">{p.title}</div>
                  <div className="ec-svc-desc">{p.description?.slice(0, 60) || 'Цифровой продукт'}</div>
                </div>
                <span className="ec-svc-price">{Number(p.price || 0).toLocaleString('ru-RU')} ₽</span>
              </div>
            ))}
          {!products.filter((p) => p.product_type === 'digital').length && (
            <div style={{ padding: 16, fontSize: 13, color: 'var(--ec-t3)' }}>Нет цифровых продуктов</div>
          )}
          <button type="button" className="ec-add-svc-btn" onClick={() => setPanel('products')}>
            + Добавить продукт
          </button>
        </div>
      </div>
    </>
  );

  const renderCalendarPanel = () => {
    const dow = pickDay.day();
    const daySchedules = scheduleByWeekday[dow] || [];
    const activeCount = daySchedules.filter((s) => s.is_active).length;
    const dayActive = activeCount > 0;
    const n = daySchedules.length;
    const sessionWord =
      n === 0 ? 'слотов' : n === 1 ? 'слот' : n >= 2 && n <= 4 ? 'слота' : 'слотов';
    const fmt = (time: string) => time.slice(0, 5);

    const handleToggleDay = async (makeActive: boolean) => {
      if (daySchedules.length === 0) return;
      try {
        setScheduleBusy(true);
        clearScheduleMsgs();
        await Promise.all(
          daySchedules.map((schedule) =>
            api.put(`/schedule/expert/schedule/${schedule.id}/toggle`, { isActive: makeActive })
          )
        );
        setScheduleOk(makeActive ? 'День активирован' : 'День выключен');
        await loadSchedules();
      } catch (err: any) {
        setScheduleErr(err.response?.data?.error || 'Ошибка обновления дня');
      } finally {
        setScheduleBusy(false);
      }
    };

    return (
      <>
        <div className="ec-page-title">Календарь записей</div>
        <div className="ec-page-sub">Выберите день в сетке — настраиваются слоты на этот день недели (МСК, повтор каждую неделю).</div>
        <div className="ec-two-col">
          <div className="ec-col-card ec-schedule-widget">
            <div className="ec-cc-hdr">
              <span className="ec-cc-title">Календарь и слоты</span>
            </div>
            <p className="ec-schedule-widget-hint">
              Активные слоты показываются клиентам. Записи на конкретные даты — в колонке справа.
            </p>
            {scheduleErr ? <div className="ec-schedule-widget-alert ec-schedule-widget-alert--err">{scheduleErr}</div> : null}
            {scheduleOk ? <div className="ec-schedule-widget-alert ec-schedule-widget-alert--ok">{scheduleOk}</div> : null}
            {renderMiniCalendar(true)}
            <div className="ec-cc-hdr ec-cc-hdr--sub">
              <span className="ec-cc-title">Шаблон · {pickDay.locale('ru').format('dddd')}</span>
              <span style={{ fontSize: 11, color: 'var(--ec-t3)' }}>
                {n} {sessionWord}
              </span>
            </div>
            <div className="availability-section">
              <div className="add-slots-section">
                <div className="days-schedule-form" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="day-card">
                    <div className="day-card-header">
                      <div className="day-card-title">
                        <div className="day-icon">
                          <CalendarOutlined />
                        </div>
                        <div>
                          <div className="day-title">{pickDay.locale('ru').format('dddd')}</div>
                          <div className="day-meta">Повторяется каждую неделю</div>
                        </div>
                      </div>
                      <div className="day-card-actions">
                        <span className={`day-status ${dayActive ? 'active' : 'inactive'}`}>
                          {dayActive ? 'Есть активные слоты' : 'Все слоты выкл.'}
                        </span>
                        <Switch
                          checked={dayActive}
                          onChange={(checked) => handleToggleDay(checked)}
                          checkedChildren="Вкл"
                          unCheckedChildren="Выкл"
                          className="day-switch"
                          disabled={daySchedules.length === 0 || scheduleBusy}
                        />
                        <button
                          type="button"
                          className="day-delete"
                          disabled={daySchedules.length === 0 || scheduleBusy}
                          onClick={() => {
                            if (daySchedules.length === 0) return;
                            Modal.confirm({
                              title: 'Удалить все слоты этого дня недели?',
                              content: 'Все интервалы для выбранного дня будут удалены.',
                              okText: 'Удалить',
                              cancelText: 'Отмена',
                              okButtonProps: { danger: true },
                              centered: true,
                              onOk: async () => {
                                try {
                                  setScheduleBusy(true);
                                  clearScheduleMsgs();
                                  for (const sch of daySchedules) {
                                    await api.delete(`/schedule/expert/schedule/${sch.id}`);
                                  }
                                  setScheduleOk('Слоты дня удалены');
                                  await loadSchedules();
                                } catch (err: any) {
                                  setScheduleErr(err.response?.data?.error || 'Ошибка удаления');
                                } finally {
                                  setScheduleBusy(false);
                                }
                              },
                            });
                          }}
                          title="Удалить все слоты дня"
                        >
                          <CloseOutlined />
                        </button>
                      </div>
                    </div>

                    <div className="day-sessions">
                      {daySchedules.length === 0 ? (
                        <div className="empty-day">Нет слотов — добавьте интервал ниже</div>
                      ) : (
                        daySchedules.map((schedule) => (
                          <div key={schedule.id} className={`session-card ${!schedule.is_active ? 'inactive' : ''}`}>
                            <div className="session-info">
                              <span className="session-dot" />
                              <span className="session-time">
                                {fmt(schedule.start_time)} — {fmt(schedule.end_time)}
                              </span>
                              <span className="session-duration">{schedule.slot_duration} мин</span>
                              {schedule.is_active ? (
                                <span className="session-client-hint">Клиентам видно</span>
                              ) : (
                                <span className="session-client-hint session-client-hint--off">Скрыто</span>
                              )}
                            </div>
                            <div className="session-controls">
                              <button
                                type="button"
                                className="btn-edit-schedule"
                                disabled={scheduleBusy}
                                onClick={() => {
                                  Modal.confirm({
                                    title: 'Изменить время слота',
                                    centered: true,
                                    content: (
                                      <div style={{ marginTop: 20 }}>
                                        <div style={{ marginBottom: 16 }}>
                                          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Начало</label>
                                          <input
                                            type="time"
                                            defaultValue={schedule.start_time}
                                            id={`ec-edit-start-${schedule.id}`}
                                            style={{
                                              width: '100%',
                                              padding: '8px 12px',
                                              border: '1px solid #d9d9d9',
                                              borderRadius: '6px',
                                              fontSize: '14px',
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Окончание</label>
                                          <input
                                            type="time"
                                            defaultValue={schedule.end_time}
                                            id={`ec-edit-end-${schedule.id}`}
                                            style={{
                                              width: '100%',
                                              padding: '8px 12px',
                                              border: '1px solid #d9d9d9',
                                              borderRadius: '6px',
                                              fontSize: '14px',
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ),
                                    okText: 'Сохранить',
                                    cancelText: 'Отмена',
                                    onOk: async () => {
                                      const startInput = document.getElementById(`ec-edit-start-${schedule.id}`) as HTMLInputElement;
                                      const endInput = document.getElementById(`ec-edit-end-${schedule.id}`) as HTMLInputElement;
                                      if (!startInput?.value || !endInput?.value) {
                                        setScheduleErr('Укажите время начала и окончания');
                                        return;
                                      }
                                      const start = new Date(`2000-01-01T${startInput.value}`);
                                      const end = new Date(`2000-01-01T${endInput.value}`);
                                      if (start >= end) {
                                        setScheduleErr('Начало должно быть раньше окончания');
                                        return;
                                      }
                                      try {
                                        setScheduleBusy(true);
                                        clearScheduleMsgs();
                                        await api.put(`/schedule/expert/schedule/${schedule.id}`, {
                                          startTime: startInput.value,
                                          endTime: endInput.value,
                                        });
                                        setScheduleOk('Время обновлено');
                                        await loadSchedules();
                                      } catch (err: any) {
                                        setScheduleErr(err.response?.data?.error || 'Ошибка сохранения');
                                      } finally {
                                        setScheduleBusy(false);
                                      }
                                    },
                                  });
                                }}
                                title="Редактировать"
                              >
                                <EditOutlined />
                              </button>
                              <button
                                type="button"
                                className="btn-delete-small"
                                disabled={scheduleBusy}
                                onClick={() => {
                                  Modal.confirm({
                                    title: 'Удалить слот?',
                                    content: `${fmt(schedule.start_time)} — ${fmt(schedule.end_time)} (${schedule.slot_duration} мин)`,
                                    okText: 'Удалить',
                                    cancelText: 'Отмена',
                                    okButtonProps: { danger: true },
                                    centered: true,
                                    onOk: async () => {
                                      await handleExpertScheduleDelete(schedule.id);
                                    },
                                  });
                                }}
                                title="Удалить слот"
                              >
                                <DeleteOutlined />
                              </button>
                              <Switch
                                checked={schedule.is_active}
                                disabled={scheduleBusy}
                                onChange={(checked) => handleExpertScheduleToggle(schedule.id, checked)}
                                checkedChildren="Вкл"
                                unCheckedChildren="Выкл"
                                className="session-switch"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {activeScheduleForms[dow]?.map((form, index) => (
                      <div key={index} className="session-form">
                        <div className="session-form-title">Новый слот</div>
                        <div className="time-inputs wide">
                          <div className="time-input-wrapper">
                            <input
                              type="time"
                              value={form.startTime}
                              onChange={(e) => updateScheduleFormRow(dow, index, 'startTime', e.target.value)}
                              className="form-input-small"
                            />
                          </div>
                          <span className="time-separator">—</span>
                          <div className="time-input-wrapper">
                            <input
                              type="time"
                              value={form.endTime}
                              onChange={(e) => updateScheduleFormRow(dow, index, 'endTime', e.target.value)}
                              className="form-input-small"
                            />
                          </div>
                          <span className="slot-length">Авто мин</span>
                        </div>
                        <div className="session-actions modern">
                          <button
                            type="button"
                            className="btn-cancel-modern"
                            onClick={() => removeScheduleFormRow(dow, index)}
                            disabled={scheduleBusy}
                          >
                            Отменить
                          </button>
                          <button
                            type="button"
                            className="btn-save-modern"
                            onClick={() => handleExpertScheduleAdd(dow, index)}
                            disabled={scheduleBusy}
                          >
                            ✓ Сохранить слот
                          </button>
                        </div>
                      </div>
                    ))}

                    <button type="button" className="btn-add-session modern" disabled={scheduleBusy} onClick={() => addScheduleFormRow(dow)}>
                      + Добавить слот на {pickDay.locale('ru').format('dddd')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ec-col-card">
            <div className="ec-cc-hdr">
              <span className="ec-cc-title">Подтверждённые и заявки</span>
            </div>
            <div style={{ padding: 16, maxHeight: 480, overflowY: 'auto' }}>
              {[...pendingBookings, ...confirmedBookings].slice(0, 20).map((b) => (
                <div key={b.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--ec-bd)' }}>
                  <div style={{ fontWeight: 600 }}>{b.client_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ec-t3)' }}>{formatDate(b.date, b.time_slot)}</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Статус: {b.status}</div>
                  {b.status === 'pending' && (
                    <div className="ec-booking-actions">
                      <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleBookingAction(b.id, 'confirm')}>
                        OK
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => {
                          const r = prompt('Причина:');
                          if (r !== null) handleBookingAction(b.id, 'reject', r || undefined);
                        }}
                      >
                        Нет
                      </Button>
                    </div>
                  )}
                  {b.status === 'confirmed' && (
                    <Button size="small" danger style={{ marginTop: 8 }} onClick={() => handleCancelBooking(b.id)}>
                      Отменить
                    </Button>
                  )}
                </div>
              ))}
              {!pendingBookings.length && !confirmedBookings.length && (
                <div style={{ color: 'var(--ec-t3)', fontSize: 13 }}>Пока нет записей</div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderClientsPanel = () => (
    <>
      <div className="ec-page-title">Мои клиенты</div>
      <div className="ec-page-sub">История и контакты</div>
      <div className="ec-col-card">
        <div className="ec-cc-hdr">
          <span className="ec-cc-title">Все клиенты ({clients.length})</span>
        </div>
        {loading ? (
          <div className="ec-loading">
            <Spin />
          </div>
        ) : clients.length ? (
          clients.map((c) => (
            <div key={c.id} className="ec-client-item">
              <div className="ec-cl-ava">{c.avatar_url ? <img src={c.avatar_url} alt="" /> : PH[c.id % PH.length]}</div>
              <div style={{ flex: 1 }}>
                <div className="ec-cl-name">{c.name}</div>
                <div className="ec-cl-meta">{c.email}</div>
                <div className="ec-cl-meta">
                  {c.total_bookings} записей
                  {c.last_booking_date ? ` · последняя ${dayjs(c.last_booking_date).locale('ru').format('DD MMM YYYY')}` : ''}
                </div>
              </div>
              <Button
                size="small"
                type="primary"
                onClick={async () => {
                  try {
                    const r = await api.post('/chats/create', { otherUserId: c.id });
                    navigate(`/chats/${r.data.id}`);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Чат
              </Button>
            </div>
          ))
        ) : (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--ec-t3)' }}>Клиентов пока нет</div>
        )}
      </div>
    </>
  );

  const renderIncome = () => (
    <>
      <div className="ec-page-title">Доход</div>
      <div className="ec-page-sub">Оценка по ценам услуг и числу подтверждённых записей в месяце</div>
      <div className="ec-stats-row">
        <div className="ec-sc">
          <div className="ec-sc-label">{dayjs().locale('ru').format('MMMM')}</div>
          <div className="ec-sc-val">{incomeEstimate > 0 ? `${incomeEstimate.toLocaleString('ru-RU')} ₽` : '—'}</div>
        </div>
        <div className="ec-sc">
          <div className="ec-sc-label">Записей в месяце</div>
          <div className="ec-sc-val">{monthBookingsCount}</div>
        </div>
        <div className="ec-sc">
          <div className="ec-sc-label">Услуг</div>
          <div className="ec-sc-val">{services.length}</div>
        </div>
        <div className="ec-sc">
          <div className="ec-sc-label">Продуктов</div>
          <div className="ec-sc-val">{products.length}</div>
        </div>
      </div>
      <div className="ec-col-card">
        <div className="ec-cc-hdr">
          <span className="ec-cc-title">Активность по месяцам</span>
        </div>
        <div className="ec-income-chart">
          <div className="ec-chart-bars">
            {chartMonths.map((x, i) => (
              <div key={x.label} className="ec-bar-wrap">
                <div
                  className={`ec-bar ${i === chartMonths.length - 1 ? 'ec-bar-active' : ''}`}
                  style={{ height: `${Math.round((x.count / maxChart) * 78)}px` }}
                />
                <div className="ec-bar-label">{x.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="expert-cab-v2">
      <nav className="ec-nav">
        <Link className="ec-nav-logo" to="/">
          <div className="ec-logo-mark">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 1.5C7 1.5 4.5 4.2 4.5 7C4.5 8.38 5.62 9.5 7 9.5C8.38 9.5 9.5 8.38 9.5 7C9.5 4.2 7 1.5 7 1.5Z" fill="white" opacity=".9" />
              <path d="M7 9.5C7 9.5 9.8 8.7 11.5 7C10.2 10.8 7 12.5 7 12.5C7 12.5 3.8 10.8 2.5 7C4.2 8.7 7 9.5 7 9.5Z" fill="white" opacity=".55" />
            </svg>
          </div>
          SoulSynergy
        </Link>
        <div className="ec-nav-links">
          <Link className="ec-nl" to="/">
            Главная
          </Link>
          <Link className="ec-nl" to="/experts">
            Мастера
          </Link>
          <Link className="ec-nl" to="/events">
            События
          </Link>
          <Link className="ec-nl" to="/expert-landing">
            Цифровые продукты
          </Link>
          <Link className="ec-nl" to="/">
            Дзен
          </Link>
        </div>
        <div className="ec-nav-right">
          {token ? (
            <Link className="ec-ibt" to="/chats">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
                <path d="M7.5 1.5C5.3 1.5 3.5 3.3 3.5 5.5V9L2 10.5h11L11.5 9V5.5C11.5 3.3 9.7 1.5 7.5 1.5Z" stroke="currentColor" strokeWidth=".9" fill="none" />
              </svg>
            </Link>
          ) : null}
          <span className="ec-cab-active">Кабинет мастера</span>
          <Link to="/profile" className="ec-ava-nav">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : '★'}
          </Link>
        </div>
      </nav>

      <div className="ec-layout">
        <aside className="ec-side">
          <div className="ec-profile-mini">
            <div className="ec-pm-ava">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : '★'}</div>
            <div className="ec-pm-name">{user.name}</div>
            <div className="ec-pm-role">{topicNames[0] || 'Эксперт'} · {user.city || 'город не указан'}</div>
            <div className="ec-pm-status">
              <span className="ec-pm-dot" />
              На платформе
            </div>
          </div>
          <nav className="ec-menu">
            <span className="ec-cm-section">Основное</span>
            <MenuBtn id="dashboard" icon={<IconGrid />} label="Обзор" />
            <MenuBtn id="profile" icon={<IconUser />} label="Мой профиль" />
            <MenuBtn id="calendar" icon={<IconCal />} label="Календарь" badge={incomingCount} />
            <MenuBtn id="clients" icon={<IconClients />} label="Клиенты" />
            <span className="ec-cm-section">Продукты</span>
            <MenuBtn id="services" icon={<IconStar />} label="Услуги" />
            <MenuBtn id="products" icon={<IconBox />} label="Цифровые продукты" />
            <span className="ec-cm-section">Финансы</span>
            <MenuBtn id="income" icon={<IconIncome />} label="Доход" />
          </nav>
        </aside>

        <main className="ec-main">
          {loading && panel === 'dashboard' ? (
            <div className="ec-loading">
              <Spin />
            </div>
          ) : (
            <>
              {panel === 'dashboard' && renderDashboard()}
              {panel === 'profile' && renderProfile()}
              {panel === 'calendar' && renderCalendarPanel()}
              {panel === 'clients' && renderClientsPanel()}
              {panel === 'services' && (
                <>
                  <div className="ec-page-title">Мои услуги</div>
                  <div className="ec-page-sub">Что вы предлагаете клиентам</div>
                  <ServiceManager user={user} services={services} onServicesUpdate={setServices} isMobile={isMobile} />
                </>
              )}
              {panel === 'products' && (
                <>
                  <div className="ec-page-title">Цифровые продукты</div>
                  <div className="ec-page-sub">Курсы, записи, медитации</div>
                  <ProductManager products={products} onProductsUpdate={setProducts} isMobile={isMobile} />
                </>
              )}
              {panel === 'income' && renderIncome()}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ExpertDashboardPage;
