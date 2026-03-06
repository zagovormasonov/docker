import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
    Button, Space, Typography, Checkbox, Input, Select, DatePicker, Divider
} from 'antd';
import {
    SearchOutlined, GlobalOutlined, HomeOutlined, CheckOutlined, CloseOutlined,
    EnvironmentOutlined, FilterOutlined, LeftOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/axios';
import { EVENT_TYPES } from './EventsPage';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface City {
    id: number;
    name: string;
}

type MobileSelectType = 'city' | 'types';

interface MobileSelectOption {
    label: string;
    value: string | number;
}

const EventsFilterPage = () => {
    const navigate = useNavigate();
    const [cities, setCities] = useState<City[]>([]);
    const [selectedOnline, setSelectedOnline] = useState<boolean[]>([true, false]);
    const [selectedCity, setSelectedCity] = useState<number | null>(null);
    const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

    // Mobile select state
    const [mobileSelectType, setMobileSelectType] = useState<MobileSelectType | null>(null);
    const [mobileSelectSearch, setMobileSelectSearch] = useState('');
    const [mobileSelectClosing, setMobileSelectClosing] = useState(false);
    const originalBodyOverflow = useRef<string | null>(null);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await api.get('/cities');
                setCities(response.data);
            } catch (error) {
                console.error('Ошибка загрузки городов:', error);
            }
        };
        fetchCities();

        // Read initial filters from search params
        const searchParams = new URLSearchParams(window.location.search);
        const online = searchParams.get('online');
        const offline = searchParams.get('offline');
        const city = searchParams.get('cityId');
        const types = searchParams.get('types');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        if (online || offline) {
            const newOnline: boolean[] = [];
            if (online === 'true') newOnline.push(true);
            if (offline === 'true') newOnline.push(false);
            setSelectedOnline(newOnline);
        }
        if (city) setSelectedCity(Number(city));
        if (types) setSelectedEventTypes(types.split(','));
        if (from || to) {
            setDateRange([
                from ? dayjs(from) : null,
                to ? dayjs(to) : null
            ]);
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const openMobileSelect = (type: MobileSelectType) => {
        setMobileSelectClosing(false);
        setMobileSelectType(type);
        setMobileSelectSearch('');
        document.body.style.overflow = 'hidden';
    };

    const closeMobileSelect = () => {
        setMobileSelectClosing(true);
        setTimeout(() => {
            setMobileSelectType(null);
            setMobileSelectClosing(false);
            setMobileSelectSearch('');
            document.body.style.overflow = 'auto';
        }, 250);
    };

    const handleMobileOptionClick = (value: string | number) => {
        if (mobileSelectType === 'city') {
            setSelectedCity(value === '' ? null : Number(value));
            closeMobileSelect();
        } else {
            const val = String(value);
            const exists = selectedEventTypes.includes(val);
            setSelectedEventTypes(prev =>
                exists ? prev.filter(t => t !== val) : [...prev, val]
            );
        }
    };

    const handleApply = () => {
        const params = new URLSearchParams();
        if (selectedOnline.includes(true)) params.append('online', 'true');
        if (selectedOnline.includes(false)) params.append('offline', 'true');
        if (selectedCity) params.append('cityId', selectedCity.toString());
        if (selectedEventTypes.length > 0) params.append('types', selectedEventTypes.join(','));
        if (dateRange[0]) params.append('from', dateRange[0].toISOString());
        if (dateRange[1]) params.append('to', dateRange[1].toISOString());

        navigate(`/events?${params.toString()}`);
    };

    const handleReset = () => {
        setSelectedOnline([true, false]);
        setSelectedCity(null);
        setSelectedEventTypes([]);
        setDateRange([null, null]);
    };

    const mobileSelectConfig = useMemo(() => {
        if (!mobileSelectType) return null;

        if (mobileSelectType === 'city') {
            return {
                title: 'Выберите город',
                multiple: false,
                searchPlaceholder: 'Поиск города',
                options: [
                    { label: 'Все города', value: '' },
                    ...cities.map(c => ({ label: c.name, value: c.id }))
                ],
                selectedValues: [selectedCity || '']
            };
        }

        return {
            title: 'Тип мероприятия',
            multiple: true,
            searchPlaceholder: 'Поиск типа',
            options: EVENT_TYPES.map(t => ({ label: t, value: t })),
            selectedValues: selectedEventTypes
        };
    }, [mobileSelectType, cities, selectedCity, selectedEventTypes]);

    const renderMobileSelectOverlay = () => {
        if (!mobileSelectConfig) return null;

        const searchValue = mobileSelectSearch.trim().toLowerCase();
        const filteredOptions = mobileSelectConfig.options.filter(o =>
            o.label.toLowerCase().includes(searchValue)
        );

        return createPortal(
            <div className={`mobile-select-overlay ${mobileSelectClosing ? 'closing' : ''}`} onClick={closeMobileSelect}>
                <div className={`mobile-select-panel ${mobileSelectClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="mobile-select-header">
                        <button type="button" className="mobile-select-close" onClick={closeMobileSelect}>
                            <CloseOutlined />
                        </button>
                        <span className="mobile-select-title">{mobileSelectConfig.title}</span>
                        <button type="button" className="mobile-select-ready" onClick={closeMobileSelect}>
                            Готово
                        </button>
                    </div>
                    <Input
                        size="large"
                        prefix={<SearchOutlined />}
                        placeholder={mobileSelectConfig.searchPlaceholder}
                        value={mobileSelectSearch}
                        onChange={e => setMobileSelectSearch(e.target.value)}
                        allowClear
                        className="mobile-select-search"
                    />
                    <div className="mobile-select-options">
                        {filteredOptions.map(option => {
                            const selected = mobileSelectConfig.selectedValues.some(v => String(v) === String(option.value));
                            return (
                                <button
                                    type="button"
                                    key={String(option.value)}
                                    className={`mobile-select-option ${selected ? 'selected' : ''} ${mobileSelectConfig.multiple ? 'multi' : ''}`}
                                    onClick={() => handleMobileOptionClick(option.value)}
                                >
                                    {mobileSelectConfig.multiple && (
                                        <span className={`mobile-select-checkbox ${selected ? 'checked' : ''}`}>
                                            {selected && <CheckOutlined />}
                                        </span>
                                    )}
                                    <span className="mobile-select-label">{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    const selectedCityName = cities.find(c => c.id === selectedCity)?.name || 'Все города';
    const selectedTypesLabel = selectedEventTypes.length ? selectedEventTypes.join(', ') : 'Выберите типы';

    return (
        <div style={{ padding: '16px', minHeight: '100vh', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 12 }}>
                <Button
                    type="text"
                    icon={<LeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ padding: 0, width: 32, height: 32 }}
                />
                <Title level={3} style={{ margin: 0 }}>Фильтры</Title>
            </div>

            <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <div>
                    <Text strong>Формат:</Text>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Checkbox
                            checked={selectedOnline.includes(true)}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedOnline(prev =>
                                    checked ? [...prev.filter(v => v === false), true] : prev.filter(v => v !== true)
                                );
                            }}
                        >
                            <Space><GlobalOutlined /> Онлайн</Space>
                        </Checkbox>
                        <Checkbox
                            checked={selectedOnline.includes(false)}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedOnline(prev =>
                                    checked ? [...prev.filter(v => v === true), false] : prev.filter(v => v !== false)
                                );
                            }}
                        >
                            <Space><HomeOutlined /> Офлайн</Space>
                        </Checkbox>
                    </div>
                </div>

                {selectedOnline.includes(false) && (
                    <div>
                        <Text strong>Город:</Text>
                        <Input
                            size="large"
                            prefix={<EnvironmentOutlined />}
                            placeholder="Выберите город"
                            value={selectedCityName}
                            readOnly
                            onClick={() => openMobileSelect('city')}
                            style={{ marginTop: 8 }}
                        />
                    </div>
                )}

                <div>
                    <Text strong>Тип мероприятия:</Text>
                    <Input
                        size="large"
                        prefix={<FilterOutlined />}
                        placeholder="Выберите типы"
                        value={selectedTypesLabel}
                        readOnly
                        onClick={() => openMobileSelect('types')}
                        style={{ marginTop: 8 }}
                    />
                </div>

                <div>
                    <Text strong>Период:</Text>
                    <RangePicker
                        size="large"
                        style={{ width: '100%', marginTop: 8 }}
                        value={dateRange}
                        onChange={(dates) => setDateRange(dates as any)}
                        format="DD.MM.YYYY"
                    />
                </div>

                <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                    <Button size="large" onClick={handleReset} style={{ flex: 1, borderRadius: 12 }}>
                        Сбросить
                    </Button>
                    <Button size="large" type="primary" onClick={handleApply} style={{ flex: 1, borderRadius: 12 }}>
                        Применить
                    </Button>
                </div>
            </Space>

            {renderMobileSelectOverlay()}

            <style>{`
        .mobile-select-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 2000;
          display: flex;
          align-items: flex-end;
          transition: opacity 0.3s;
        }
        .mobile-select-overlay.closing {
          opacity: 0;
        }
        .mobile-select-panel {
          width: 100%;
          background: white;
          border-radius: 20px 20px 0 0;
          padding: 20px 16px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          animation: slide-up 0.3s ease-out;
        }
        .mobile-select-panel.closing {
          animation: slide-down 0.3s ease-in forwards;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes slide-down {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        .mobile-select-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .mobile-select-title {
          font-size: 18px;
          font-weight: 600;
        }
        .mobile-select-close, .mobile-select-ready {
          border: none;
          background: none;
          font-size: 16px;
          color: #6366f1;
          cursor: pointer;
        }
        .mobile-select-search {
          margin-bottom: 16px;
          border-radius: 12px;
        }
        .mobile-select-options {
          overflow-y: auto;
          flex: 1;
        }
        .mobile-select-option {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 14px 0;
          border: none;
          border-bottom: 1px solid #f0f0f0;
          background: none;
          text-align: left;
          font-size: 16px;
        }
        .mobile-select-option.selected .mobile-select-label {
          color: #6366f1;
          font-weight: 500;
        }
        .mobile-select-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #ddd;
          border-radius: 4px;
          margin-right: 12px;
          display: flex;
          align-items: center;
          justifyContent: center;
          font-size: 12px;
        }
        .mobile-select-checkbox.checked {
          background: #6366f1;
          border-color: #6366f1;
          color: white;
        }
      `}</style>
        </div>
    );
};

export default EventsFilterPage;
