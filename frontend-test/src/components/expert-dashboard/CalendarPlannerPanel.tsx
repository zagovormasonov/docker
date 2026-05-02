import React, { useMemo, useState, useEffect, useCallback } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/ru';
import { Button, Modal, Space, message, Checkbox, Select } from 'antd';
import { CheckOutlined, CloseOutlined, CopyOutlined, DeleteOutlined, DownOutlined, LinkOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import { cabinetSelectPopupContainer } from '../ExpertCabinetSelect';

dayjs.extend(isoWeek);
dayjs.locale('ru');

export interface PlannerBooking {
  id: number;
  date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  client_name: string;
  client_email: string;
  client_message?: string;
}

export interface PlannerExpertSchedule {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

function parseHHMM(time: string): number {
  if (!time || typeof time !== 'string') return 0;
  const m = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function parseBookingSlotRange(slot: string): { start: number; end: number } | null {
  if (!slot) return null;
  const norm = slot.replace(/–/g, '-').trim();
  const parts = norm.split(/\s*-\s*/);
  if (parts.length < 2) return null;
  const start = parseHHMM(parts[0]);
  const end = parseHHMM(parts[1]);
  if (end <= start) return null;
  return { start, end };
}

const HOUR_PX = 52;

function fmtTime(time: string) {
  return time.slice(0, 5);
}

const HOUR_OPTS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTE_OPTS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const HOUR_OPTIONS = HOUR_OPTS.map((x) => ({ label: x, value: x }));
const MINUTE_OPTIONS = MINUTE_OPTS.map((x) => ({ label: x, value: x }));

function parseHm(v: string): { h: string; m: string } {
  const m = v?.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return { h: '09', m: '00' };
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return { h: String(h).padStart(2, '0'), m: String(mm).padStart(2, '0') };
}

const PlannerTimeField: React.FC<{
  value: string;
  onChange: (hhmm: string) => void;
  labelledBy?: string;
}> = ({ value, onChange, labelledBy }) => {
  const { h, m } = parseHm(value);
  const suffix = <DownOutlined className="ec-planner-time-suffix-ico" aria-hidden />;

  return (
    <div className="ec-planner-time-field" role="group" aria-labelledby={labelledBy}>
      <Select
        aria-label="Часы"
        value={h}
        options={HOUR_OPTIONS}
        onChange={(nh) => onChange(`${nh}:${m}`)}
        variant="borderless"
        showSearch={false}
        listHeight={280}
        popupMatchSelectWidth={false}
        dropdownStyle={{ minWidth: 120 }}
        className="ec-planner-time-ant-select ec-planner-time-ant-select--h"
        popupClassName="ec-cabinet-select-dropdown ec-planner-time-dropdown"
        getPopupContainer={cabinetSelectPopupContainer}
        suffixIcon={suffix}
      />
      <span className="ec-planner-time-colon" aria-hidden>
        :
      </span>
      <Select
        aria-label="Минуты"
        value={m}
        options={MINUTE_OPTIONS}
        onChange={(nm) => onChange(`${h}:${nm}`)}
        variant="borderless"
        showSearch={false}
        listHeight={280}
        popupMatchSelectWidth={false}
        dropdownStyle={{ minWidth: 120 }}
        className="ec-planner-time-ant-select ec-planner-time-ant-select--m"
        popupClassName="ec-cabinet-select-dropdown ec-planner-time-dropdown"
        getPopupContainer={cabinetSelectPopupContainer}
        suffixIcon={suffix}
      />
    </div>
  );
};

export interface CalendarPlannerPanelProps {
  pickDay: Dayjs;
  setPickDay: (d: Dayjs) => void;
  setCalMonth: (d: Dayjs) => void;
  miniCalendar: React.ReactNode;
  schedules: PlannerExpertSchedule[];
  loadSchedules: () => Promise<void>;
  allBookings: PlannerBooking[];
  services: { title?: string; price?: number }[];
  user: { id: number; slug?: string; name?: string };
  pendingBookings: PlannerBooking[];
  confirmedBookings: PlannerBooking[];
  formatDate: (dateStr: string, timeSlot?: string) => string;
  onBookingConfirm: (id: number) => Promise<void>;
  onBookingReject: (id: number, reason?: string) => Promise<void>;
  onBookingCancel: (id: number) => Promise<void>;
}

const CalendarPlannerPanel: React.FC<CalendarPlannerPanelProps> = ({
  pickDay,
  setPickDay,
  setCalMonth,
  miniCalendar,
  schedules,
  loadSchedules,
  allBookings,
  services,
  user,
  pendingBookings,
  confirmedBookings,
  formatDate,
  onBookingConfirm,
  onBookingReject,
  onBookingCancel,
}) => {
  const [plannerTab, setPlannerTab] = useState<'day' | 'week'>('day');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [editSchedule, setEditSchedule] = useState<PlannerExpertSchedule | null>(null);
  const [editVisible, setEditVisible] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ start: '09:00', end: '10:00' });
  const [bookingFocus, setBookingFocus] = useState<PlannerBooking | null>(null);
  const [editTimes, setEditTimes] = useState({ start: '09:00', end: '10:00' });

  useEffect(() => {
    if (!ok) return;
    const t = window.setTimeout(() => setOk(''), 4500);
    return () => window.clearTimeout(t);
  }, [ok]);

  useEffect(() => {
    if (editSchedule) {
      setEditVisible(editSchedule.is_active);
      setEditTimes({
        start: fmtTime(editSchedule.start_time),
        end: fmtTime(editSchedule.end_time),
      });
    }
  }, [editSchedule]);

  const scheduleByWeekday = useMemo(() => {
    const acc: Record<number, PlannerExpertSchedule[]> = {};
    schedules.forEach((s) => {
      if (!acc[s.day_of_week]) acc[s.day_of_week] = [];
      acc[s.day_of_week].push(s);
    });
    return acc;
  }, [schedules]);

  const dow = pickDay.day();
  const daySchedules = scheduleByWeekday[dow] || [];
  const svcTitle = services[0]?.title || 'Консультация';
  const publicUrl = `${window.location.origin}/experts/${user.slug || user.id}`;

  const bookingsOnPickDay = useMemo(
    () =>
      allBookings.filter(
        (b) => dayjs(b.date).isSame(pickDay, 'day') && ['pending', 'confirmed'].includes(b.status)
      ),
    [allBookings, pickDay]
  );

  const { gridStartMin, gridEndMin, gridHeightPx, minToPx } = useMemo(() => {
    let gs = 9 * 60;
    let ge = 18 * 60;
    daySchedules.forEach((s) => {
      gs = Math.min(gs, parseHHMM(s.start_time));
      ge = Math.max(ge, parseHHMM(s.end_time));
    });
    bookingsOnPickDay.forEach((b) => {
      const r = parseBookingSlotRange(b.time_slot);
      if (r) {
        gs = Math.min(gs, r.start);
        ge = Math.max(ge, r.end);
      }
    });
    gs = Math.max(0, Math.floor(gs / 60) * 60 - 60);
    ge = Math.min(24 * 60, Math.ceil(ge / 60) * 60 + 60);
    const span = Math.max(ge - gs, 120);
    const gh = (span / 60) * HOUR_PX;
    return {
      gridStartMin: gs,
      gridEndMin: ge,
      gridHeightPx: gh,
      minToPx: (min: number) => ((min - gs) / 60) * HOUR_PX,
    };
  }, [daySchedules, bookingsOnPickDay]);

  const hourTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let m = Math.ceil(gridStartMin / 60) * 60; m <= gridEndMin; m += 60) ticks.push(m);
    return ticks;
  }, [gridStartMin, gridEndMin]);

  const weekDays = useMemo(() => {
    const ws = pickDay.startOf('isoWeek');
    return Array.from({ length: 7 }, (_, i) => ws.add(i, 'day'));
  }, [pickDay]);

  const flashErr = useCallback((msg: string) => {
    setErr(msg);
    setOk('');
  }, []);

  const flashOk = useCallback((msg: string) => {
    setOk(msg);
    setErr('');
  }, []);

  const handleAdd = async () => {
    const okAdd = await addSlotSubmit(dow, addForm.start, addForm.end);
    if (okAdd) setAddOpen(false);
  };

  async function addSlotSubmit(dayOfWeek: number, startTime: string, endTime: string) {
    if (!timeValid(startTime) || !timeValid(endTime)) return false;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    if (start >= end) {
      flashErr('Время начала должно быть раньше окончания');
      return false;
    }
    setBusy(true);
    setErr('');
    try {
      await api.post('/schedule/expert/schedule', { dayOfWeek, startTime, endTime });
      flashOk('Слот добавлен');
      await loadSchedules();
      return true;
    } catch (e: any) {
      flashErr(e.response?.data?.error || 'Ошибка добавления слота');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function timeValid(t: string) {
    return !!t && t.length >= 4;
  }

  async function deleteSlot(id: number) {
    setErr('');
    try {
      await api.delete(`/schedule/expert/schedule/${id}`);
      flashOk('Слот удалён');
      await loadSchedules();
    } catch (e: any) {
      flashErr(e.response?.data?.error || 'Ошибка удаления');
    }
  }

  async function toggleSlot(id: number, isActive: boolean) {
    setErr('');
    try {
      await api.put(`/schedule/expert/schedule/${id}/toggle`, { isActive });
      flashOk(isActive ? 'Слот в записи' : 'Слот скрыт от клиентов');
      await loadSchedules();
    } catch (e: any) {
      flashErr(e.response?.data?.error || 'Ошибка');
    }
  }

  async function updateSlotTimes(id: number, startTime: string, endTime: string): Promise<boolean> {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    if (start >= end) {
      flashErr('Начало должно быть раньше окончания');
      return false;
    }
    setBusy(true);
    setErr('');
    try {
      await api.put(`/schedule/expert/schedule/${id}`, { startTime, endTime });
      flashOk('Время обновлено');
      await loadSchedules();
      return true;
    } catch (e: any) {
      flashErr(e.response?.data?.error || 'Ошибка сохранения');
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="ec-page-title">Календарь записей</div>
      <div className="ec-page-sub">
        Интервалы по дням недели (пн–вс): один шаблон повторяется каждую неделю. Время — МСК.
      </div>

      <div className="ec-planner">
        <aside className="ec-planner-side">
          <div className="ec-planner-side-date">{pickDay.locale('ru').format('D MMMM YYYY')}</div>
          <div className="ec-planner-side-dow">{pickDay.locale('ru').format('dddd')}</div>

          <div className="ec-planner-tabs">
            <button
              type="button"
              className="ec-planner-tab"
              onClick={() => {
                const t = dayjs();
                setPickDay(t);
                setCalMonth(t.startOf('month'));
                setPlannerTab('day');
              }}
            >
              Сегодня
            </button>
            <button
              type="button"
              className={`ec-planner-tab ${plannerTab === 'day' ? 'ec-planner-tab--on' : ''}`}
              onClick={() => setPlannerTab('day')}
            >
              День
            </button>
            <button
              type="button"
              className={`ec-planner-tab ${plannerTab === 'week' ? 'ec-planner-tab--on' : ''}`}
              onClick={() => setPlannerTab('week')}
            >
              Неделя
            </button>
          </div>

          <p className="ec-planner-side-hint">Один раз настраиваете день недели — он действует на все будущие недели.</p>

          <div className="ec-planner-mini-cal">{miniCalendar}</div>

          <div className="ec-planner-actions">
            <a className="ec-planner-primary-btn" href={publicUrl} target="_blank" rel="noreferrer">
              <LinkOutlined /> Страница записи
            </a>
            <button
              type="button"
              className="ec-planner-icon-btn"
              title="Копировать ссылку"
              onClick={() => {
                void navigator.clipboard.writeText(publicUrl);
                message.success('Ссылка скопирована');
              }}
            >
              <CopyOutlined />
            </button>
          </div>

          <button type="button" className="ec-planner-add-slot" disabled={busy} onClick={() => setAddOpen(true)}>
            + Добавить интервал
          </button>

          {err ? <div className="ec-planner-flash ec-planner-flash--err">{err}</div> : null}
          {ok ? <div className="ec-planner-flash ec-planner-flash--ok">{ok}</div> : null}
        </aside>

        <div className="ec-planner-main">
          <div className={`ec-planner-week-strip ${plannerTab === 'week' ? 'ec-planner-week-strip--week' : ''}`}>
            {weekDays.map((d) => (
              <button
                key={d.format('YYYY-MM-DD')}
                type="button"
                className={`ec-planner-wd ${d.isSame(pickDay, 'day') ? 'ec-planner-wd--active' : ''}`}
                onClick={() => {
                  setPickDay(d);
                  setCalMonth(d.startOf('month'));
                }}
              >
                <span className="ec-planner-wd-dow">{d.locale('ru').format('ddd')}</span>
                <span className="ec-planner-wd-num">{d.date()}</span>
              </button>
            ))}
          </div>

          <div className="ec-planner-grid-card">
            <div className="ec-planner-timeline">
              <div className="ec-planner-track-col">
                {hourTicks.map((m) => (
                  <div key={m} className="ec-planner-hour-label" style={{ top: minToPx(m) }}>
                    {`${String(Math.floor(m / 60)).padStart(2, '0')}:00`}
                  </div>
                ))}
              </div>
              <div className="ec-planner-track" style={{ height: gridHeightPx }}>
                {hourTicks.map((m) => (
                  <div key={`ln-${m}`} className="ec-planner-hour-line" style={{ top: minToPx(m) }} />
                ))}
                <div className="ec-planner-blocks">
                  {daySchedules.map((sch) => {
                    const sm = parseHHMM(sch.start_time);
                    const em = parseHHMM(sch.end_time);
                    const top = minToPx(sm);
                    const h = Math.max(minToPx(em) - top, 26);
                    return (
                      <button
                        key={sch.id}
                        type="button"
                        className={`ec-planner-block ec-planner-block--free ${sch.is_active ? '' : 'ec-planner-block--muted'}`}
                        style={{ top, height: h }}
                        onClick={() => setEditSchedule(sch)}
                      >
                        <span className="ec-planner-block-time">{fmtTime(sch.start_time)}</span>
                        <span className="ec-planner-block-title">
                          {sch.is_active ? `Свободно · ${svcTitle}` : 'Скрыто от клиентов'}
                        </span>
                        <span className="ec-planner-block-meta">{sch.slot_duration} мин</span>
                      </button>
                    );
                  })}
                  {bookingsOnPickDay.map((b) => {
                    const r = parseBookingSlotRange(b.time_slot);
                    if (!r) return null;
                    const top = minToPx(r.start);
                    const h = Math.max(minToPx(r.end) - top, 30);
                    return (
                      <button
                        key={`bk-${b.id}`}
                        type="button"
                        className={`ec-planner-block ec-planner-block--book ec-planner-block--${b.status}`}
                        style={{ top, height: h }}
                        onClick={() => setBookingFocus(b)}
                      >
                        <span className="ec-planner-block-time">{fmtTime(b.time_slot.split(/\s*-\s*/)[0] || '')}</span>
                        <span className="ec-planner-block-title">{b.client_name}</span>
                        <span className="ec-planner-block-meta">
                          {b.status === 'pending' ? 'Ожидает' : 'Подтверждено'} · {b.time_slot}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="ec-planner-bookings-panel">
            <div className="ec-cc-hdr">
              <span className="ec-cc-title">Заявки и записи</span>
            </div>
            <div className="ec-planner-bookings-scroll">
              {[...pendingBookings, ...confirmedBookings].slice(0, 24).map((b) => (
                <div key={b.id} className="ec-planner-booking-row">
                  <div className="ec-planner-br-name">{b.client_name}</div>
                  <div className="ec-planner-br-meta">{formatDate(b.date, b.time_slot)}</div>
                  <div className="ec-planner-br-status">{b.status}</div>
                  {b.status === 'pending' && (
                    <Space size="small" wrap className="ec-planner-br-actions">
                      <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => onBookingConfirm(b.id)}>
                        OK
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => {
                          const r = prompt('Причина отклонения (необязательно):');
                          if (r !== null) void onBookingReject(b.id, r || undefined);
                        }}
                      >
                        Нет
                      </Button>
                    </Space>
                  )}
                  {b.status === 'confirmed' && (
                    <Button size="small" danger onClick={() => onBookingCancel(b.id)}>
                      Отменить
                    </Button>
                  )}
                </div>
              ))}
              {!pendingBookings.length && !confirmedBookings.length && (
                <div className="ec-planner-empty-list">Пока нет записей</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={`Новый интервал · ${pickDay.locale('ru').format('dddd')}`}
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={() => void handleAdd()}
        confirmLoading={busy}
        okText="Сохранить"
      >
        <div className="ec-planner-time-fields">
          <div className="ec-planner-time-field-group">
            <span className="ec-planner-modal-label" id="ec-add-label-start">
              Начало
            </span>
            <PlannerTimeField labelledBy="ec-add-label-start" value={addForm.start} onChange={(v) => setAddForm((f) => ({ ...f, start: v }))} />
          </div>
          <div className="ec-planner-time-field-group">
            <span className="ec-planner-modal-label" id="ec-add-label-end">
              Окончание
            </span>
            <PlannerTimeField labelledBy="ec-add-label-end" value={addForm.end} onChange={(v) => setAddForm((f) => ({ ...f, end: v }))} />
          </div>
        </div>
      </Modal>

      <Modal
        title="Интервал расписания"
        open={!!editSchedule}
        onCancel={() => setEditSchedule(null)}
        footer={null}
        destroyOnClose
      >
        {editSchedule && (
          <div className="ec-planner-edit-modal">
            <div className="ec-planner-time-fields">
              <div className="ec-planner-time-field-group">
                <span className="ec-planner-modal-label" id="ec-edit-label-start">
                  Начало
                </span>
                <PlannerTimeField
                  labelledBy="ec-edit-label-start"
                  value={editTimes.start}
                  onChange={(v) => setEditTimes((t) => ({ ...t, start: v }))}
                />
              </div>
              <div className="ec-planner-time-field-group">
                <span className="ec-planner-modal-label" id="ec-edit-label-end">
                  Окончание
                </span>
                <PlannerTimeField
                  labelledBy="ec-edit-label-end"
                  value={editTimes.end}
                  onChange={(v) => setEditTimes((t) => ({ ...t, end: v }))}
                />
              </div>
            </div>
            <Checkbox
              checked={editVisible}
              onChange={(e) => setEditVisible(e.target.checked)}
              style={{ marginTop: 12 }}
            >
              Показывать клиентам при записи
            </Checkbox>
            <Space style={{ marginTop: 16 }} wrap>
              <Button
                type="primary"
                loading={busy}
                onClick={async () => {
                  const st = editTimes.start;
                  const en = editTimes.end;
                  if (!st || !en) {
                    flashErr('Укажите время');
                    return;
                  }
                  const timesOk = await updateSlotTimes(editSchedule.id, st, en);
                  if (!timesOk) return;
                  if (editVisible !== editSchedule.is_active) {
                    await toggleSlot(editSchedule.id, editVisible);
                  }
                  setEditSchedule(null);
                }}
              >
                Сохранить
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Удалить интервал?',
                    okText: 'Удалить',
                    cancelText: 'Отмена',
                    okButtonProps: { danger: true },
                    onOk: async () => {
                      await deleteSlot(editSchedule.id);
                      setEditSchedule(null);
                    },
                  });
                }}
              >
                Удалить
              </Button>
              <Button onClick={() => setEditSchedule(null)}>Закрыть</Button>
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title={bookingFocus?.client_name}
        open={!!bookingFocus}
        onCancel={() => setBookingFocus(null)}
        footer={null}
      >
        {bookingFocus && (
          <>
            <p style={{ marginBottom: 8 }}>{bookingFocus.client_email}</p>
            <p style={{ marginBottom: 16 }}>{formatDate(bookingFocus.date, bookingFocus.time_slot)}</p>
            {bookingFocus.client_message ? <p style={{ fontSize: 13, color: '#666' }}>{bookingFocus.client_message}</p> : null}
            <Space wrap style={{ marginTop: 16 }}>
              {bookingFocus.status === 'pending' && (
                <>
                  <Button type="primary" onClick={() => void onBookingConfirm(bookingFocus.id).then(() => setBookingFocus(null))}>
                    Подтвердить
                  </Button>
                  <Button
                    danger
                    onClick={() => {
                      const r = prompt('Причина?');
                      if (r !== null) void onBookingReject(bookingFocus.id, r || undefined).then(() => setBookingFocus(null));
                    }}
                  >
                    Отклонить
                  </Button>
                </>
              )}
              {bookingFocus.status === 'confirmed' && (
                <Button danger onClick={() => void onBookingCancel(bookingFocus.id).then(() => setBookingFocus(null))}>
                  Отменить запись
                </Button>
              )}
            </Space>
          </>
        )}
      </Modal>
    </>
  );
};

export default CalendarPlannerPanel;
