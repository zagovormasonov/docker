import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    List,
    Button,
    Space,
    Typography,
    Tag,
    Popconfirm,
    message,
    Empty,
    Spin,
    Row,
    Col,
    Divider
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    PlusOutlined,
    CalendarOutlined,
    EnvironmentOutlined,
    GlobalOutlined
} from '@ant-design/icons';
import api from '../api/axios';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

const { Title, Text } = Typography;

interface Event {
    id: number;
    title: string;
    description: string;
    cover_image: string;
    event_type: string;
    is_online: boolean;
    city_name: string;
    event_date: string;
    moderation_status?: string;
    is_published: boolean;
}

const MyEventsPage = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await api.get('/events/my/events');
            setEvents(response.data || []);
        } catch (error) {
            console.error('Ошибка загрузки событий:', error);
            message.error('Ошибка загрузки событий');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/events/${id}`);
            message.success('Событие успешно удалено!');
            fetchEvents();
        } catch (error: any) {
            console.error('Ошибка удаления события:', error);
            message.error(error.response?.data?.error || 'Ошибка удаления события');
        }
    };

    const getEventTypeColor = (type: string) => {
        const colors: { [key: string]: string } = {
            'Ретрит': 'purple',
            'Мастер-класс': 'blue',
            'Тренинг': 'cyan',
            'Семинар': 'green',
            'Сатсанг': 'gold',
            'Йога и медитация': 'magenta',
            'Фестиваль': 'volcano',
            'Конференция': 'orange',
            'Выставка': 'geekblue',
            'Концерт': 'red',
            'Экскурсия': 'lime',
            'Благотворительное мероприятие': 'pink',
            'Ярмарка': 'orange'
        };
        return colors[type] || 'default';
    };

    return (
        <div className="container" style={{ maxWidth: 900, padding: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2}>Мои события</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/events/create')}
                    size="large"
                >
                    Создать событие
                </Button>
            </div>

            {events.length === 0 && !loading ? (
                <Card>
                    <Empty description="У вас пока нет событий">
                        <Button type="primary" onClick={() => navigate('/events/create')}>
                            Создать первое событие
                        </Button>
                    </Empty>
                </Card>
            ) : loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Row gutter={[16, 16]}>
                    {events.map((event) => (
                        <Col xs={24} sm={24} md={12} lg={12} xl={12} key={event.id}>
                            <Card
                                hoverable
                                cover={
                                    <div style={{ paddingBottom: '100%', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                                        onClick={() => navigate(`/events/${event.id}`)}>
                                        <img
                                            src={event.cover_image || '/eve.jpg'}
                                            alt={event.title}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    </div>
                                }
                                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                            >
                                <Space direction="vertical" size={12} style={{ width: '100%', flex: 1 }}>
                                    {/* Тип и статус */}
                                    <div>
                                        <Space wrap>
                                            <Tag color={getEventTypeColor(event.event_type)}>
                                                {event.event_type}
                                            </Tag>
                                            {event.moderation_status === 'pending' && (
                                                <Tag color="blue">🔄 На модерации</Tag>
                                            )}
                                            {event.moderation_status === 'approved' && (
                                                <Tag color="green">✓ Одобрено</Tag>
                                            )}
                                            {event.moderation_status === 'rejected' && (
                                                <Tag color="red">✗ Отклонено</Tag>
                                            )}
                                        </Space>
                                    </div>

                                    {/* Заголовок */}
                                    <Title
                                        level={4}
                                        style={{ margin: 0, cursor: 'pointer' }}
                                        onClick={() => navigate(`/events/${event.id}`)}
                                    >
                                        {event.title}
                                    </Title>

                                    {/* Информация о событии */}
                                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                        <Space size={8}>
                                            <CalendarOutlined style={{ color: '#6366f1' }} />
                                            <Text type="secondary">
                                                {dayjs(event.event_date).format('DD MMMM YYYY, HH:mm')}
                                            </Text>
                                        </Space>
                                        <Space size={8}>
                                            {event.is_online ? (
                                                <>
                                                    <GlobalOutlined style={{ color: '#52c41a' }} />
                                                    <Text type="secondary">Онлайн</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <EnvironmentOutlined style={{ color: '#1890ff' }} />
                                                    <Text type="secondary">{event.city_name || 'Город не указан'}</Text>
                                                </>
                                            )}
                                        </Space>
                                    </Space>

                                    <Divider style={{ margin: '8px 0' }} />

                                    {/* Кнопки действий */}
                                    <Space wrap style={{ marginTop: 'auto', width: '100%' }}>
                                        <Button
                                            icon={<EyeOutlined />}
                                            onClick={() => navigate(`/events/${event.id}`)}
                                            size="small"
                                        >
                                            Просмотр
                                        </Button>
                                        <Button
                                            icon={<EditOutlined />}
                                            onClick={() => navigate(`/events/edit/${event.id}`)}
                                            type="primary"
                                            size="small"
                                        >
                                            Редактировать
                                        </Button>
                                        <Popconfirm
                                            title="Удалить событие?"
                                            description="Это действие нельзя отменить"
                                            onConfirm={() => handleDelete(event.id)}
                                            okText="Да"
                                            cancelText="Нет"
                                        >
                                            <Button danger icon={<DeleteOutlined />} size="small">
                                                Удалить
                                            </Button>
                                        </Popconfirm>
                                    </Space>
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default MyEventsPage;
