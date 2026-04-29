import { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Typography, Button, Select, DatePicker, Statistic, Row, Col, message, Spin } from 'antd';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined
} from '@ant-design/icons';
import api from '../api/axios';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('ru');
dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AdminLog {
  id: number;
  admin_id: number;
  admin_name: string;
  action_type: string;
  entity_type: string;
  entity_id: number;
  entity_title: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface LogStats {
  actionStats: Array<{ action_type: string; count: string }>;
  entityStats: Array<{ entity_type: string; count: string }>;
  topAdmins: Array<{ admin_id: number; admin_name: string; actions_count: string }>;
  recentActivity: Array<{ date: string; actions_count: string }>;
}

const AdminLogsPage = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    actionType: undefined,
    entityType: undefined,
    limit: 50,
    offset: 0
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.actionType) params.append('actionType', filters.actionType);
      if (filters.entityType) params.append('entityType', filters.entityType);
      params.append('limit', filters.limit.toString());
      params.append('offset', filters.offset.toString());

      const response = await api.get(`/admin/logs?${params.toString()}`);
      setLogs(response.data.logs || []);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      console.error('Ошибка загрузки логов:', error);
      message.error('Ошибка загрузки логов');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/logs/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'approve':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'reject':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'delete':
        return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
      case 'update':
        return <EditOutlined style={{ color: '#1890ff' }} />;
      case 'create':
        return <PlusOutlined style={{ color: '#52c41a' }} />;
      default:
        return null;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'approve':
        return 'green';
      case 'reject':
        return 'red';
      case 'delete':
        return 'red';
      case 'update':
        return 'blue';
      case 'create':
        return 'green';
      case 'ban':
        return 'red';
      case 'unban':
        return 'green';
      default:
        return 'default';
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case 'article':
        return 'blue';
      case 'event':
        return 'purple';
      case 'user':
        return 'orange';
      case 'comment':
        return 'cyan';
      default:
        return 'default';
    }
  };

  const getActionText = (actionType: string) => {
    const translations: Record<string, string> = {
      approve: 'Одобрение',
      reject: 'Отклонение',
      delete: 'Удаление',
      update: 'Обновление',
      create: 'Создание',
      ban: 'Бан',
      unban: 'Разбан'
    };
    return translations[actionType] || actionType;
  };

  const getEntityText = (entityType: string) => {
    const translations: Record<string, string> = {
      article: 'Статья',
      event: 'Событие',
      user: 'Пользователь',
      comment: 'Комментарий'
    };
    return translations[entityType] || entityType;
  };

  const columns = [
    {
      title: 'Время',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(date).format('DD.MM.YYYY HH:mm')}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(date).fromNow()}
          </Text>
        </Space>
      )
    },
    {
      title: 'Администратор',
      dataIndex: 'admin_name',
      key: 'admin_name',
      width: 150,
      render: (name: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{name}</Text>
        </Space>
      )
    },
    {
      title: 'Действие',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 130,
      render: (actionType: string) => (
        <Tag icon={getActionIcon(actionType)} color={getActionColor(actionType)}>
          {getActionText(actionType)}
        </Tag>
      )
    },
    {
      title: 'Тип',
      dataIndex: 'entity_type',
      key: 'entity_type',
      width: 120,
      render: (entityType: string) => (
        <Tag color={getEntityColor(entityType)}>
          {getEntityText(entityType)}
        </Tag>
      )
    },
    {
      title: 'Объект',
      dataIndex: 'entity_title',
      key: 'entity_title',
      render: (title: string, record: AdminLog) => (
        <Space direction="vertical" size={0}>
          <Text>{title || 'Без названия'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ID: {record.entity_id}
          </Text>
        </Space>
      )
    },
    {
      title: 'Детали',
      dataIndex: 'details',
      key: 'details',
      width: 200,
      render: (details: any) => {
        if (!details) return null;
        if (details.reason) {
          return (
            <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: details.reason }}>
              Причина: {details.reason}
            </Text>
          );
        }
        return null;
      }
    },
    {
      title: 'IP-адрес',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
      render: (ip: string) => <Text type="secondary" code>{ip || 'Неизвестен'}</Text>
    }
  ];

  return (
    <div className="container" style={{ maxWidth: 1400, padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>📊 Логи административных действий</Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchLogs();
              fetchStats();
            }}
            type="primary"
          >
            Обновить
          </Button>
        </div>

        {/* Статистика */}
        {stats && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Всего действий"
                  value={total}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Одобрено"
                  value={stats.actionStats.find(s => s.action_type === 'approve')?.count || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Отклонено"
                  value={stats.actionStats.find(s => s.action_type === 'reject')?.count || 0}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Удалено"
                  value={stats.actionStats.find(s => s.action_type === 'delete')?.count || 0}
                  prefix={<DeleteOutlined />}
                  valueStyle={{ color: '#ff7a45' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Фильтры */}
        <Card>
          <Space wrap>
            <Select
              placeholder="Тип действия"
              allowClear
              style={{ width: 200 }}
              value={filters.actionType}
              onChange={(value) => setFilters({ ...filters, actionType: value, offset: 0 })}
            >
              <Option value="approve">Одобрение</Option>
              <Option value="reject">Отклонение</Option>
              <Option value="delete">Удаление</Option>
              <Option value="update">Обновление</Option>
              <Option value="create">Создание</Option>
              <Option value="ban">Бан</Option>
              <Option value="unban">Разбан</Option>
            </Select>

            <Select
              placeholder="Тип объекта"
              allowClear
              style={{ width: 200 }}
              value={filters.entityType}
              onChange={(value) => setFilters({ ...filters, entityType: value, offset: 0 })}
            >
              <Option value="article">Статьи</Option>
              <Option value="event">События</Option>
              <Option value="user">Пользователи</Option>
              <Option value="comment">Комментарии</Option>
            </Select>

            <Button
              onClick={() => {
                setFilters({ actionType: undefined, entityType: undefined, limit: 50, offset: 0 });
              }}
            >
              Сбросить фильтры
            </Button>
          </Space>
        </Card>

        {/* Таблица логов */}
        <Card>
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            loading={loading}
            pagination={{
              total: total,
              pageSize: filters.limit,
              current: Math.floor(filters.offset / filters.limit) + 1,
              onChange: (page, pageSize) => {
                setFilters({
                  ...filters,
                  limit: pageSize || 50,
                  offset: ((page - 1) * (pageSize || 50))
                });
              },
              showSizeChanger: true,
              showTotal: (total) => `Всего ${total} записей`
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default AdminLogsPage;

