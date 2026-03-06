import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Button, Space, Typography, Checkbox, Input, DatePicker, Drawer
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

const EventsFilterPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [cities, setCities] = useState<City[]>([]);
    const [selectedOnline, setSelectedOnline] = useState<boolean[]>([true, false]);
    const [selectedCity, setSelectedCity] = useState<number | null>(null);
    const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

    // Drawer state (using antd Drawer instead of custom portal)
    const [drawerType, setDrawerType] = useState<MobileSelectType | null>(null);
    const [drawerSearch, setDrawerSearch] = useState('');

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
    }, []);

    useEffect(() => {
        // Read initial filters from search params
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
        } else {
            // Default if no format specified
            setSelectedOnline([true, false]);
        }

        if (city) setSelectedCity(Number(city));
        else setSelectedCity(null);

        if (types) setSelectedEventTypes(types.split(','));
        else setSelectedEventTypes([]);

        if (from || to) {
            setDateRange([
                from ? dayjs(from) : null,
                to ? dayjs(to) : null
            ]);
        } else {
            setDateRange([null, null]);
        }
    }, [searchParams]);

    const openDrawer = (type: MobileSelectType) => {
        setDrawerSearch('');
        setDrawerType(type);
    };

    const closeDrawer = () => {
        setDrawerType(null);
        setDrawerSearch('');
    };

    const handleOptionClick = (value: string | number) => {
        if (!drawerType) return;

        if (drawerType === 'city') {
            setSelectedCity(value === '' ? null : Number(value));
            closeDrawer();
            return;
        }

        const val = String(value);
        const exists = selectedEventTypes.includes(val);
        setSelectedEventTypes(prev =>
            exists ? prev.filter(t => t !== val) : [...prev, val]
        );
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

    const drawerConfig = useMemo(() => {
        if (!drawerType) return null;

        if (drawerType === 'city') {
            return {
                title: 'Выберите город',
                multiple: false,
                searchPlaceholder: 'Поиск города',
                options: [
                    { label: 'Все города', value: '' as string | number },
                    ...cities.map(c => ({ label: c.name, value: c.id as string | number }))
                ],
                selectedValues: [selectedCity || ''] as (string | number)[]
            };
        }

        return {
            title: 'Тип мероприятия',
            multiple: true,
            searchPlaceholder: 'Поиск типа',
            options: EVENT_TYPES.map(t => ({ label: t, value: t as string | number })),
            selectedValues: selectedEventTypes as (string | number)[]
        };
    }, [drawerType, cities, selectedCity, selectedEventTypes]);

    const searchValue = drawerSearch.trim().toLowerCase();
    const filteredOptions = drawerConfig
        ? drawerConfig.options.filter(o => o.label.toLowerCase().includes(searchValue))
        : [];

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
                            onClick={() => openDrawer('city')}
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
                        onClick={() => openDrawer('types')}
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

            {/* Bottom Sheet Drawer — антд компонент, который корректно работает на мобильных */}
            <Drawer
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 18, fontWeight: 600 }}>
                            {drawerConfig?.title}
                        </span>
                        <Button type="link" onClick={closeDrawer} style={{ color: '#6366f1', fontWeight: 500 }}>
                            Готово
                        </Button>
                    </div>
                }
                placement="bottom"
                open={drawerType !== null}
                onClose={closeDrawer}
                height="85vh"
                closable={false}
                styles={{
                    header: { borderBottom: '1px solid #f0f0f0', padding: '16px 16px' },
                    body: { padding: '16px 0' },
                    wrapper: { borderRadius: '20px 20px 0 0', overflow: 'hidden' }
                }}
                style={{ borderRadius: '20px 20px 0 0' }}
                destroyOnClose
            >
                <div style={{ padding: '0 16px' }}>
                    <Input
                        size="large"
                        prefix={<SearchOutlined />}
                        placeholder={drawerConfig?.searchPlaceholder || 'Поиск'}
                        value={drawerSearch}
                        onChange={e => setDrawerSearch(e.target.value)}
                        allowClear
                        style={{ marginBottom: 16, borderRadius: 12 }}
                    />
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {filteredOptions.map(option => {
                        const selected = drawerConfig?.selectedValues.some(
                            v => String(v) === String(option.value)
                        );
                        return (
                            <button
                                type="button"
                                key={String(option.value)}
                                onClick={() => handleOptionClick(option.value)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '14px 16px',
                                    border: 'none',
                                    borderBottom: '1px solid #f0f0f0',
                                    background: 'none',
                                    textAlign: 'left',
                                    fontSize: 16,
                                    cursor: 'pointer'
                                }}
                            >
                                {drawerConfig?.multiple && (
                                    <span style={{
                                        width: 20,
                                        height: 20,
                                        border: `2px solid ${selected ? '#6366f1' : '#ddd'}`,
                                        borderRadius: 4,
                                        marginRight: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 12,
                                        background: selected ? '#6366f1' : 'transparent',
                                        color: selected ? '#fff' : 'transparent'
                                    }}>
                                        {selected && <CheckOutlined />}
                                    </span>
                                )}
                                <span style={{
                                    color: selected ? '#6366f1' : '#333',
                                    fontWeight: selected ? 500 : 400
                                }}>
                                    {option.label}
                                </span>
                            </button>
                        );
                    })}
                    {filteredOptions.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                            Ничего не найдено
                        </div>
                    )}
                </div>
            </Drawer>
        </div>
    );
};

export default EventsFilterPage;
