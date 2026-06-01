import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Space, Tag, Popconfirm, Typography, Select, Upload, message, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import { compressImageToWebp } from '../../utils/imageCompression';

const { Text } = Typography;
const { TextArea } = Input;

const FORMAT_OPTIONS = [
  { value: 'audio', label: '🎧 Аудио', emoji: '🎧', badge: '🎧 Аудио', bg: '#eae8fb' },
  { value: 'video', label: '🎬 Видео / запись', emoji: '🎬', badge: '🎬 Запись эфира', bg: '#e2f7f0' },
  { value: 'text', label: '📄 PDF / текст', emoji: '📄', badge: '📄 PDF-гайд', bg: '#fdf2e0' },
  { value: 'bundle', label: '📦 Пакет / курс', emoji: '🏆', badge: '📦 Пакет курса', bg: '#eae8fb' }
];

const CATEGORY_OPTIONS = [
  { value: 'soul', label: 'Душа и путь' },
  { value: 'money', label: 'Деньги и рост' },
  { value: 'heal', label: 'Тело и исцеление' },
  { value: 'chan', label: 'Ченнелинг' },
  { value: 'med', label: 'Медитации' },
  { value: 'rel', label: 'Отношения' }
];

const TAG_STYLE_OPTIONS = [
  { value: '#eae8fb', label: 'Фиолетовый' },
  { value: '#e2f7f0', label: 'Зелёный' },
  { value: '#fdf2e0', label: 'Тёплый' }
];

interface ProductManagerProps {
  products: any[];
  onProductsUpdate: (products: any[]) => void;
  isMobile: boolean;
  autoOpenCreate?: boolean;
  autoEditProductId?: number | null;
  onAutoOpenHandled?: () => void;
  onAutoEditHandled?: () => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  onProductsUpdate,
  isMobile,
  autoOpenCreate,
  autoEditProductId,
  onAutoOpenHandled,
  onAutoEditHandled
}) => {
  const [form] = Form.useForm();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const openCreateForm = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      productType: 'digital',
      productFormat: 'text',
      categoryKeys: ['soul'],
      thumbBg: '#eae8fb',
      emoji: '📄',
      badge: '📄 PDF-гайд',
      buttonLabel: 'Открыть'
    });
    setShowForm(true);
  };

  const handleEdit = (p: any) => {
    setEditing(p);
    form.setFieldsValue({
      title: p.title,
      description: p.description,
      price: p.price,
      productType: p.product_type,
      imageUrl: p.image_url,
      productFormat: p.product_format || 'text',
      categoryKeys: (p.category_key || 'soul').split(' ').filter(Boolean),
      isNew: Boolean(p.is_new),
      thumbBg: p.thumb_bg || '#eae8fb',
      emoji: p.emoji || '📄',
      badge: p.badge || '',
      tagLabel: p.tag_label || '',
      metaDetail: p.meta_detail || '',
      isFeatured: Boolean(p.is_featured),
      hitLabel: p.hit_label || '',
      buttonLabel: p.button_label || 'Открыть'
    });
    setShowForm(true);
  };

  useEffect(() => {
    if (!autoOpenCreate) return;
    openCreateForm();
    onAutoOpenHandled?.();
  }, [autoOpenCreate]);

  useEffect(() => {
    if (!autoEditProductId) return;
    const product = products.find((p) => Number(p.id) === Number(autoEditProductId));
    if (!product) return;
    handleEdit(product);
    onAutoEditHandled?.();
  }, [autoEditProductId, products]);

  const applyFormatDefaults = (format: string) => {
    const option = FORMAT_OPTIONS.find((item) => item.value === format);
    if (!option) return;
    form.setFieldsValue({
      productFormat: option.value,
      emoji: option.emoji,
      badge: option.badge,
      thumbBg: option.bg
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      onProductsUpdate(products.filter(p => p.id !== id));
      message.success('Удалено');
    } catch (error) {
      console.error('Error deleting product:', error);
      message.error('Ошибка');
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const optimizedFile = await compressImageToWebp(file);
      const fd = new FormData();
      fd.append('image', optimizedFile);
      const r = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      form.setFieldsValue({ imageUrl: r.data.url });
      message.success('Фото загружено');
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Ошибка загрузки');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const onFinish = async (values: any) => {
    try {
      // Отправляем данные в формате, который ожидает бэкенд
      const payload = {
        title: values.title,
        description: values.description,
        price: values.price ? Number(values.price) : null,
        productType: values.productType,
        imageUrl: values.imageUrl || null,
        productFormat: values.productFormat || 'text',
        categoryKey: Array.isArray(values.categoryKeys) ? values.categoryKeys.join(' ') : values.categoryKeys || 'soul',
        isNew: Boolean(values.isNew),
        thumbBg: values.thumbBg || '#eae8fb',
        emoji: values.emoji || '📄',
        badge: values.badge || null,
        tagLabel: values.tagLabel || null,
        metaDetail: values.metaDetail || null,
        isFeatured: Boolean(values.isFeatured),
        hitLabel: values.hitLabel || null,
        buttonLabel: values.buttonLabel || 'Открыть'
      };

      if (editing) {
        const r = await api.put(`/products/${editing.id}`, payload);
        onProductsUpdate(products.map(p => p.id === editing.id ? r.data : p));
        message.success('Обновлено');
      } else {
        const r = await api.post('/products', payload);
        onProductsUpdate([...products, r.data]);
        message.success('Добавлено');
      }
      setShowForm(false);
      setEditing(null);
      form.resetFields();
    } catch (error: any) {
      console.error('Error saving product:', error);
      const errMsg = error?.response?.data?.errors?.[0]?.msg || error?.response?.data?.error || 'Ошибка сохранения';
      message.error(errMsg);
    }
  };

  return (
    <div className="section-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="section-title" style={{ margin: 0 }}>🛍️ Готовые продукты</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ borderRadius: 12, background: '#1d1d1f', border: 'none' }}
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditing(null);
              form.resetFields();
            } else {
              openCreateForm();
            }
          }}
        >
          {showForm ? 'Отмена' : 'Добавить'}
        </Button>
      </div>

      {showForm && (
        <div style={{ padding: 24, background: '#f5f5f7', borderRadius: 20, marginBottom: 20 }}>
          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="title"
              label="Название"
              rules={[{ required: true, message: 'Минимум 3 символа' }, { min: 3, message: 'Минимум 3 символа' }]}
            >
              <Input size="large" placeholder="Название продукта" style={{ borderRadius: 12 }} />
            </Form.Item>

            <Form.Item
              name="description"
              label="Описание"
              rules={[{ required: true, message: 'Минимум 10 символов' }, { min: 10, message: 'Минимум 10 символов' }]}
              extra="Используйте Enter для переноса строк"
            >
              <TextArea rows={4} placeholder="Подробное описание продукта..." style={{ borderRadius: 12 }} />
            </Form.Item>

            <Space wrap size="middle">
              <Form.Item name="price" label="Цена (₽)">
                <Input type="number" size="large" placeholder="1500" style={{ borderRadius: 12, width: 140 }} />
              </Form.Item>

              <Form.Item
                name="productType"
                label="Тип продукта"
                rules={[{ required: true, message: 'Выберите тип' }]}
              >
                <Select style={{ width: 160 }} size="large" placeholder="Выберите тип">
                  <Select.Option value="digital">Цифровой</Select.Option>
                  <Select.Option value="physical">Физический</Select.Option>
                  <Select.Option value="service">Услуга</Select.Option>
                </Select>
              </Form.Item>
            </Space>

            <div style={{ margin: '4px 0 16px', fontWeight: 600 }}>Характеристики для раздела «Цифровые продукты»</div>

            <Space wrap size="middle" align="start">
              <Form.Item
                name="productFormat"
                label="Формат"
                rules={[{ required: true, message: 'Выберите формат' }]}
              >
                <Select
                  style={{ width: 190 }}
                  size="large"
                  placeholder="Формат"
                  onChange={applyFormatDefaults}
                  options={FORMAT_OPTIONS.map(({ value, label }) => ({ value, label }))}
                />
              </Form.Item>

              <Form.Item
                name="categoryKeys"
                label="Темы"
                rules={[{ required: true, message: 'Выберите хотя бы одну тему' }]}
              >
                <Select
                  mode="multiple"
                  style={{ minWidth: 260 }}
                  size="large"
                  placeholder="Темы продукта"
                  options={CATEGORY_OPTIONS}
                />
              </Form.Item>

              <Form.Item name="tagLabel" label="Метка темы">
                <Input size="large" placeholder="Медитации / Деньги · Рост" style={{ borderRadius: 12, width: 220 }} />
              </Form.Item>
            </Space>

            <Space wrap size="middle" align="start">
              <Form.Item name="metaDetail" label="Длительность / состав">
                <Input size="large" placeholder="7 треков / 2.5 часа / 42 стр." style={{ borderRadius: 12, width: 230 }} />
              </Form.Item>

              <Form.Item name="badge" label="Бейдж формата">
                <Input size="large" placeholder="🎧 Аудио" style={{ borderRadius: 12, width: 180 }} />
              </Form.Item>

              <Form.Item name="emoji" label="Иконка">
                <Input size="large" placeholder="🎧" maxLength={8} style={{ borderRadius: 12, width: 100 }} />
              </Form.Item>

              <Form.Item name="thumbBg" label="Цвет карточки">
                <Select style={{ width: 150 }} size="large" options={TAG_STYLE_OPTIONS} />
              </Form.Item>
            </Space>

            <Space wrap size="middle" align="start">
              <Form.Item name="buttonLabel" label="Текст кнопки">
                <Input size="large" placeholder="Открыть" style={{ borderRadius: 12, width: 150 }} />
              </Form.Item>

              <Form.Item name="hitLabel" label="Лейбл хита">
                <Input size="large" placeholder="Хит" style={{ borderRadius: 12, width: 130 }} />
              </Form.Item>

              <Form.Item name="isNew" valuePropName="checked" style={{ paddingTop: 34 }}>
                <Checkbox>Новинка</Checkbox>
              </Form.Item>

              <Form.Item name="isFeatured" valuePropName="checked" style={{ paddingTop: 34 }}>
                <Checkbox>Выделить карточку</Checkbox>
              </Form.Item>
            </Space>

            <Form.Item name="imageUrl" label="Изображение">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Upload
                  showUploadList={false}
                  beforeUpload={handleImageUpload}
                  accept="image/*"
                >
                  <Button icon={<PlusOutlined />} loading={uploading} style={{ borderRadius: 12 }}>
                    Загрузить фото
                  </Button>
                </Upload>
                {form.getFieldValue('imageUrl') && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={form.getFieldValue('imageUrl')}
                      alt="Preview"
                      loading="lazy"
                      decoding="async"
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12 }}
                    />
                    <Button
                      size="small"
                      type="text"
                      danger
                      onClick={() => form.setFieldsValue({ imageUrl: '' })}
                      style={{ display: 'block', marginTop: 4 }}
                    >
                      Удалить фото
                    </Button>
                  </div>
                )}
              </Space>
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              style={{ borderRadius: 12, background: '#1d1d1f', border: 'none', marginTop: 8 }}
            >
              {editing ? 'Сохранить изменения' : 'Создать продукт'}
            </Button>
          </Form>
        </div>
      )}

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#86868b' }}>
          Нет добавленных продуктов
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map(p => (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', background: '#f5f5f7', borderRadius: 16
            }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1, minWidth: 0 }}>
                {p.image_url && (
                  <img src={p.image_url} alt={p.title} loading="lazy" decoding="async"
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{p.title}</div>
                  <Space size="small">
                    {p.price && <Text type="secondary">{p.price} ₽</Text>}
                    <Tag color={p.product_type === 'digital' ? 'blue' : p.product_type === 'physical' ? 'green' : 'purple'} style={{ borderRadius: 10 }}>
                      {p.product_type === 'digital' ? 'Цифровой' : p.product_type === 'physical' ? 'Физический' : 'Услуга'}
                    </Tag>
                    {p.product_format && <Tag style={{ borderRadius: 10 }}>{p.product_format}</Tag>}
                    {p.is_new && <Tag color="gold" style={{ borderRadius: 10 }}>Новинка</Tag>}
                  </Space>
                  {(p.tag_label || p.meta_detail) && (
                    <div style={{ fontSize: 12, color: '#86868b', marginTop: 4 }}>
                      {[p.tag_label, p.meta_detail].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              </div>
              <Space>
                <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(p)} />
                <Popconfirm title="Удалить продукт?" onConfirm={() => handleDelete(p.id)} okText="Да" cancelText="Нет">
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductManager;
