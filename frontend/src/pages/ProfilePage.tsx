import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  message,
  Typography,
  Space,
  Avatar,
  Upload,
  Divider,
  List,
  Popconfirm,
  Tag,
  Progress
} from 'antd';
import { 
  UserOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UploadOutlined,
  LinkOutlined,
  ShareAltOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined
} from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import ProfileGallery from '../components/ProfileGallery';
import ExpertBenefitsCard from '../components/ExpertBenefitsCard';
import ProductModal from '../components/ProductModal';
import ShareProfileModal from '../components/ShareProfileModal';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Topic {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface Service {
  id: number;
  title: string;
  description: string;
  price?: number;
  duration?: number;
  service_type: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  price?: number;
  product_type: 'digital' | 'physical' | 'service';
  image_url?: string;
}

type MobileSelectType = 'city' | 'consultationTypes' | 'topics';

interface MobileSelectOption {
  label: string;
  value: string | number;
}

const CONSULTATION_TYPES = [
  'Онлайн',
  'Офлайн',
  'Выезд на дом',
  'Групповые сессии',
  'Индивидуальные сессии'
];

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceForm] = Form.useForm();
  const [productForm] = Form.useForm();
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tempAvatarUrl, setTempAvatarUrl] = useState<string | null>(null);
  const [lastUploadedAvatarUrl, setLastUploadedAvatarUrl] = useState<string | null>(null);
  const [productImageUploading, setProductImageUploading] = useState(false);
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [customSocials, setCustomSocials] = useState<Array<{id: number, name: string, url: string, created_at: string}>>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileSelectType, setMobileSelectType] = useState<MobileSelectType | null>(null);
  const [mobileSelectSearch, setMobileSelectSearch] = useState('');
  const selectedCity = Form.useWatch('city', form);
  const selectedConsultationTypes = Form.useWatch('consultationTypes', form) || [];
  const selectedTopics = Form.useWatch('topics', form) || [];
  const originalBodyOverflow = useRef<string | null>(null);
  const [mobileSelectClosing, setMobileSelectClosing] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchTopics();
    fetchCities();
    fetchCustomSocials();
    if (user?.userType === 'expert' || user?.userType === 'admin') {
      fetchServices();
      fetchProducts();
    }
  }, []);

  // Отслеживаем обновление user.avatarUrl и сбрасываем tempAvatarUrl когда они совпадают
  useEffect(() => {
    if (lastUploadedAvatarUrl && user?.avatarUrl) {
      // Нормализуем оба URL для сравнения
      const userAvatarNormalized = user.avatarUrl.startsWith('http') 
        ? user.avatarUrl 
        : `${window.location.origin}${user.avatarUrl.startsWith('/') ? '' : '/'}${user.avatarUrl}`;
      
      // Извлекаем путь из lastUploadedAvatarUrl для сравнения
      const lastUploadedPath = lastUploadedAvatarUrl.includes(window.location.origin)
        ? lastUploadedAvatarUrl.split(window.location.origin)[1]
        : lastUploadedAvatarUrl;
      
      // Если user.avatarUrl совпадает с последним загруженным, сбрасываем временные значения
      if (userAvatarNormalized === lastUploadedAvatarUrl || user.avatarUrl === lastUploadedPath) {
        // user.avatarUrl обновился корректно, можно убрать временные значения
        setTempAvatarUrl(null);
        setLastUploadedAvatarUrl(null);
      } else if (user.avatarUrl !== lastUploadedPath && lastUploadedAvatarUrl) {
        // Если user.avatarUrl не совпадает с последним загруженным (возможно старый), 
        // оставляем lastUploadedAvatarUrl чтобы показывался новый аватар
        // Не сбрасываем lastUploadedAvatarUrl, чтобы новый аватар продолжал отображаться
      }
    }
  }, [user?.avatarUrl, lastUploadedAvatarUrl]);

  useEffect(() => {
    if (user) {
      const topicsValue = user.topics 
        ? user.topics.map((t: any) => typeof t === 'object' ? t.id : t)
        : [];

      form.setFieldsValue({
        name: user.name,
        email: user.email,
        bio: user.bio,
        city: user.city,
        vkUrl: user.vkUrl,
        telegramUrl: user.telegramUrl,
        whatsapp: user.whatsapp,
        consultationTypes: Array.isArray(user.consultationTypes) ? user.consultationTypes : [],
        topics: topicsValue
      });
    }
  }, [user, form]);

  const isMobileSelectOpen = isMobile && mobileSelectType !== null;

  useEffect(() => {
    if (!isMobile) {
      if (originalBodyOverflow.current !== null) {
        document.body.style.overflow = originalBodyOverflow.current;
        originalBodyOverflow.current = null;
      }
      return;
    }

    if (isMobileSelectOpen) {
      if (originalBodyOverflow.current === null) {
        originalBodyOverflow.current = document.body.style.overflow;
      }
      document.body.style.overflow = 'hidden';
    } else if (originalBodyOverflow.current !== null) {
      document.body.style.overflow = originalBodyOverflow.current;
      originalBodyOverflow.current = null;
    }

    return () => {
      if (originalBodyOverflow.current !== null) {
        document.body.style.overflow = originalBodyOverflow.current;
        originalBodyOverflow.current = null;
      }
    };
  }, [isMobileSelectOpen, isMobile]);

  const openMobileSelect = (type: MobileSelectType) => {
    setMobileSelectClosing(false);
    setMobileSelectType(type);
    setMobileSelectSearch('');
  };

  const closeMobileSelect = () => {
    if (!mobileSelectType || mobileSelectClosing) {
      return;
    }
    setMobileSelectClosing(true);
    setTimeout(() => {
      setMobileSelectType(null);
      setMobileSelectClosing(false);
      setMobileSelectSearch('');
    }, 250);
  };

  const handleMobileOptionClick = (value: string | number) => {
    if (!mobileSelectType) return;

    if (mobileSelectType === 'city') {
      form.setFieldsValue({ city: value });
      closeMobileSelect();
      return;
    }

    if (mobileSelectType === 'consultationTypes') {
      const current: (string | number)[] = form.getFieldValue('consultationTypes') || [];
      const exists = current.some((item) => String(item) === String(value));
      const next = exists
        ? current.filter((item) => String(item) !== String(value))
        : [...current, value];
      form.setFieldsValue({ consultationTypes: next });
      return;
    }

    if (mobileSelectType === 'topics') {
      const current: (string | number)[] = form.getFieldValue('topics') || [];
      const exists = current.some((item) => String(item) === String(value));
      const next = exists
        ? current.filter((item) => String(item) !== String(value))
        : [...current, value];
      form.setFieldsValue({ topics: next });
    }
  };

  const selectedTopicLabels = useMemo(() => {
    if (!selectedTopics || selectedTopics.length === 0) {
      return [];
    }
    const topicMap = new Map(topics.map((topic) => [String(topic.id), topic.name]));
    return selectedTopics
      .map((topicId: string | number) => topicMap.get(String(topicId)))
      .filter((name): name is string => Boolean(name));
  }, [selectedTopics, topics]);

  const selectedConsultationTypesLabel = selectedConsultationTypes.length
    ? selectedConsultationTypes.join(', ')
    : '';
  const selectedTopicsLabel = selectedTopicLabels.length
    ? selectedTopicLabels.join(', ')
    : '';

  const mobileSelectConfig = useMemo<{
    title: string;
    multiple: boolean;
    searchPlaceholder: string;
    options: MobileSelectOption[];
    selectedValues: (string | number)[];
  } | null>(() => {
    if (!mobileSelectType) {
      return null;
    }

    if (mobileSelectType === 'city') {
      return {
        title: 'Выберите город',
        multiple: false,
        searchPlaceholder: 'Поиск города',
        options: cities.map<MobileSelectOption>((city) => ({ label: city.name, value: city.name })),
        selectedValues: selectedCity ? [selectedCity] : []
      };
    }

    if (mobileSelectType === 'consultationTypes') {
      return {
        title: 'Выберите типы консультаций',
        multiple: true,
        searchPlaceholder: 'Поиск по названию',
        options: CONSULTATION_TYPES.map<MobileSelectOption>((type) => ({ label: type, value: type })),
        selectedValues: selectedConsultationTypes
      };
    }

    return {
      title: 'Выберите тематики',
      multiple: true,
      searchPlaceholder: 'Поиск тематики',
      options: topics.map<MobileSelectOption>((topic) => ({ label: topic.name, value: topic.id })),
      selectedValues: selectedTopics
    };
  }, [mobileSelectType, cities, selectedCity, selectedConsultationTypes, selectedTopics, topics]);

  const renderMobileSelectOverlay = () => {
    if (!isMobile || !mobileSelectConfig || typeof document === 'undefined') {
      return null;
    }

    const searchValue = mobileSelectSearch.trim().toLowerCase();
    const filteredOptions = mobileSelectConfig.options.filter((option: { label: string }) =>
      option.label.toLowerCase().includes(searchValue)
    );

    return createPortal(
      <div className={`mobile-select-overlay ${mobileSelectClosing ? 'closing' : ''}`} onClick={closeMobileSelect}>
        <div className={`mobile-select-panel ${mobileSelectClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
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
            onChange={(e) => setMobileSelectSearch(e.target.value)}
            allowClear
            className="mobile-select-search"
          />
          <div className="mobile-select-options">
            {filteredOptions.map((option) => {
              const selected = mobileSelectConfig.selectedValues.some(
                (value: string | number) => String(value) === String(option.value)
              );
              return (
                <button
                  type="button"
                  key={option.value}
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
            {filteredOptions.length === 0 && (
              <div className="mobile-select-empty">Ничего не найдено</div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data);
    } catch (error) {
      console.error('Ошибка загрузки тематик:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await api.get('/cities');
      setCities(response.data);
    } catch (error) {
      console.error('Ошибка загрузки городов:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get(`/experts/${user?.id}`);
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Ошибка загрузки продуктов:', error);
    }
  };

  const fetchCustomSocials = async () => {
    try {
      const response = await api.get('/users/custom-socials');
      setCustomSocials(response.data);
    } catch (error) {
      console.error('Ошибка загрузки кастомных соцсетей:', error);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.put('/users/profile', values);
      updateUser(response.data);
      message.success('Профиль обновлен!');
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      message.error('Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSocial = async () => {
    if (!newSocialName.trim() || !newSocialUrl.trim()) {
      message.warning('Заполните все поля');
      return;
    }

    try {
      const response = await api.post('/users/custom-socials', {
        name: newSocialName,
        url: newSocialUrl
      });
      setCustomSocials([...customSocials, response.data]);
      setNewSocialName('');
      setNewSocialUrl('');
      setShowAddSocial(false);
      message.success('Соцсеть добавлена');
    } catch (error) {
      console.error('Ошибка добавления соцсети:', error);
      message.error('Ошибка добавления соцсети');
    }
  };

  const handleCancelSocial = () => {
    setNewSocialName('');
    setNewSocialUrl('');
    setShowAddSocial(false);
  };

  const handleDeleteSocial = async (socialId: number) => {
    try {
      await api.delete(`/users/custom-socials/${socialId}`);
      setCustomSocials(customSocials.filter(social => social.id !== socialId));
      message.success('Соцсеть удалена');
    } catch (error) {
      console.error('Ошибка удаления соцсети:', error);
      message.error('Ошибка удаления соцсети');
    }
  };

  const handleAddService = async (values: any) => {
    try {
      if (editingService) {
        await api.put(`/experts/services/${editingService.id}`, values);
        message.success('Услуга обновлена!');
        setEditingService(null);
      } else {
        await api.post('/experts/services', values);
        message.success('Услуга добавлена!');
      }
      serviceForm.resetFields();
      setShowServiceForm(false);
      fetchServices();
    } catch (error) {
      console.error('Ошибка сохранения услуги:', error);
      message.error('Ошибка сохранения услуги');
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowServiceForm(true);
    serviceForm.setFieldsValue({
      title: service.title,
      description: service.description,
      price: service.price,
      duration: service.duration,
      serviceType: service.service_type
    });
  };

  const handleDeleteService = async (serviceId: number) => {
    try {
      await api.delete(`/experts/services/${serviceId}`);
      message.success('Услуга удалена');
      fetchServices();
    } catch (error) {
      console.error('Ошибка удаления услуги:', error);
      message.error('Ошибка удаления услуги');
    }
  };

  const handleAddProduct = async (values: any) => {
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, values);
        message.success('Продукт обновлен!');
        setEditingProduct(null);
      } else {
        await api.post('/products', values);
        message.success('Продукт добавлен!');
      }
      productForm.resetFields();
      setShowProductForm(false);
      fetchProducts();
    } catch (error) {
      console.error('Ошибка сохранения продукта:', error);
      message.error('Ошибка сохранения продукта');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
    productForm.setFieldsValue({
      title: product.title,
      description: product.description,
      price: product.price,
      productType: product.product_type,
      imageUrl: product.image_url
    });
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await api.delete(`/products/${productId}`);
      message.success('Продукт удален');
      fetchProducts();
    } catch (error) {
      console.error('Ошибка удаления продукта:', error);
      message.error('Ошибка удаления продукта');
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setProductModalVisible(true);
  };

  const handleProductModalClose = () => {
    setProductModalVisible(false);
    setSelectedProduct(null);
  };

  const handleBuyProduct = async (product: Product) => {
    message.info('Функция покупки будет доступна в полной версии');
  };

  const handleAvatarUpload = async (file: File) => {
    // Создаем превью сразу после выбора файла
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempAvatarUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      const avatarUrl = uploadResponse.data.url;
      
      // Обновляем превью на реальный URL сразу - пользователь видит новый аватар во время загрузки
      // Формируем полный URL если это относительный путь
      const fullAvatarUrl = avatarUrl.startsWith('http') 
        ? avatarUrl 
        : `${window.location.origin}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
      setTempAvatarUrl(fullAvatarUrl);
      setLastUploadedAvatarUrl(fullAvatarUrl); // Сохраняем для проверки в useEffect
      
      const response = await api.put('/users/profile', { avatarUrl });
      // Важно: обновляем пользователя с правильным avatarUrl
      const updatedUser = { ...response.data, avatarUrl };
      updateUser(updatedUser);
      setUploadProgress(100);
      message.success('Аватар успешно загружен!');
      
      // Сбрасываем только прогресс, tempAvatarUrl будет сброшен в useEffect когда user.avatarUrl обновится
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      message.error('Ошибка загрузки аватара');
      setTempAvatarUrl(null);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleProductImageUpload = async (file: File) => {
    setProductImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = uploadResponse.data.url;
      productForm.setFieldsValue({ imageUrl });
      message.success('Изображение загружено!');
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      message.error('Ошибка загрузки изображения');
    } finally {
      setProductImageUploading(false);
    }
    return false;
  };

  return (
    <>
    <div className="container" style={{ maxWidth: 800 }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              <Avatar
                size={100}
                src={
                  tempAvatarUrl || 
                  lastUploadedAvatarUrl || 
                  user?.avatarUrl || 
                  '/emp.jpg'
                }
                icon={!tempAvatarUrl && !lastUploadedAvatarUrl && !user?.avatarUrl && <UserOutlined />}
                style={{ backgroundColor: '#6366f1' }}
              />
              {uploading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '50%'
                }}>
                  <Progress
                    type="circle"
                    percent={uploadProgress}
                    size={80}
                    strokeColor="#6366f1"
                    format={(percent) => `${percent}%`}
                  />
                </div>
              )}
            </div>
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleAvatarUpload}
                disabled={uploading}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  {uploading ? 'Загрузка...' : 'Загрузить аватар'}
                </Button>
              </Upload>
              {uploading && uploadProgress > 0 && (
                <div style={{ marginTop: 8, maxWidth: 200, margin: '8px auto 0' }}>
                  <Progress
                    percent={uploadProgress}
                    strokeColor="#6366f1"
                    showInfo={true}
                  />
                </div>
              )}
            </div>
            <Title level={3}>{user?.name}</Title>
            <Text type="secondary">{user?.email}</Text>
            
            {/* Кнопка "Поделиться профилем" */}
            <div style={{ marginTop: 16 }}>
              <Button
                icon={<ShareAltOutlined />}
                onClick={() => setShareModalVisible(true)}
                style={{
                  borderColor: '#6366f1',
                  color: '#6366f1'
                }}
              >
                Поделиться профилем
              </Button>
            </div>
            
            {user?.bio && (
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>О себе:</Text>
                <Text>{user.bio}</Text>
              </div>
            )}
            
            {user?.topics && user.topics.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Тематики:</Text>
                <Space wrap>
                  {user.topics.map((topic: any) => (
                    <Tag key={topic.id} color="purple">
                      {typeof topic === 'object' ? topic.name : topic}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
            
            {user?.consultationTypes && user.consultationTypes.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Типы консультаций:</Text>
                <Space wrap>
                  {user.consultationTypes.map((type: string, index: number) => (
                    <Tag key={index} color="blue">
                      {type}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>

          {user?.userType === 'client' && (
            <>
              <Divider />
              <ExpertBenefitsCard />
            </>
          )}

          <Divider />

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              name="name"
              label="Имя"
              rules={[{ required: true, message: 'Введите имя' }]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
            >
              <Input size="large" disabled />
            </Form.Item>

            <Form.Item
              name="bio"
              label="О себе"
            >
              <TextArea rows={4} placeholder="Поделитесь информацией, которая поможет пользователям почувствовать вашу энергию и понять, чем вы можете быть им полезны." />
            </Form.Item>

            {isMobile ? (
              <Form.Item label="Город" required>
                <Form.Item
                  name="city"
                  rules={[{ required: true, message: 'Выберите город' }]}
                  noStyle
                >
                  <Input style={{ display: 'none' }} />
                </Form.Item>
                <Input
                  size="large"
                  placeholder="Выберите город"
                  value={selectedCity || ''}
                  readOnly
                  onClick={() => openMobileSelect('city')}
                />
              </Form.Item>
            ) : (
              <Form.Item
                name="city"
                label="Город"
              >
                <Select
                  size="large"
                  placeholder="Выберите город"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={cities.map(city => ({ label: city.name, value: city.name }))}
                />
              </Form.Item>
            )}

            <Divider orientation="left">
              <Text strong>Социальные сети</Text>
            </Divider>

            <Form.Item name="vkUrl" label="ВКонтакте">
              <Input
                size="large"
                placeholder="https://vk.com/username"
                prefix={<LinkOutlined />}
              />
            </Form.Item>

            <Form.Item name="telegramUrl" label="Telegram">
              <Input
                size="large"
                placeholder="https://t.me/username"
                prefix={<LinkOutlined />}
              />
            </Form.Item>

            <Form.Item name="whatsapp" label="WhatsApp">
              <Input
                size="large"
                placeholder="+7 (999) 123-45-67"
                prefix={<LinkOutlined />}
              />
            </Form.Item>

            {customSocials.length > 0 && (
              <Form.Item label="Дополнительные соцсети">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {customSocials.map((social) => (
                    <div key={social.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text strong>{social.name}:</Text>
                      <Text copyable={{ text: social.url }}>{social.url}</Text>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteSocial(social.id)}
                      />
                    </div>
                  ))}
                </Space>
              </Form.Item>
            )}

            {showAddSocial ? (
              <Form.Item label="Добавить соцсеть">
                <Space style={{ width: '100%' }}>
                  <Input
                    placeholder="Название"
                    value={newSocialName}
                    onChange={(e) => setNewSocialName(e.target.value)}
                  />
                  <Input
                    placeholder="URL"
                    value={newSocialUrl}
                    onChange={(e) => setNewSocialUrl(e.target.value)}
                  />
                  <Button onClick={handleAddSocial}>Добавить</Button>
                  <Button onClick={handleCancelSocial}>Отмена</Button>
                </Space>
              </Form.Item>
            ) : (
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => setShowAddSocial(true)}
                  icon={<PlusOutlined />}
                >
                  Добавить соцсеть
                </Button>
              </Form.Item>
            )}

            {(user?.userType === 'expert' || user?.userType === 'admin') && (
              <>
                <Divider />
                
                {isMobile ? (
                  <Form.Item label="Типы консультаций">
                    <Form.Item name="consultationTypes" noStyle>
                      <Input style={{ display: 'none' }} />
                    </Form.Item>
                    <Input
                      size="large"
                      placeholder="Выберите типы консультаций"
                      value={selectedConsultationTypesLabel}
                      readOnly
                      onClick={() => openMobileSelect('consultationTypes')}
                    />
                  </Form.Item>
                ) : (
                  <Form.Item
                    name="consultationTypes"
                    label="Типы консультаций"
                  >
                    <Select
                      mode="multiple"
                      size="large"
                      placeholder="Выберите типы консультаций"
                      options={CONSULTATION_TYPES.map(t => ({ label: t, value: t }))}
                    />
                  </Form.Item>
                )}

                {isMobile ? (
                  <Form.Item label="Тематики">
                    <Form.Item name="topics" noStyle>
                      <Input style={{ display: 'none' }} />
                    </Form.Item>
                    <Input
                      size="large"
                      placeholder="Выберите тематики"
                      value={selectedTopicsLabel}
                      readOnly
                      onClick={() => openMobileSelect('topics')}
                    />
                  </Form.Item>
                ) : (
                  <Form.Item
                    name="topics"
                    label="Тематики"
                  >
                    <Select
                      mode="multiple"
                      size="large"
                      placeholder="Выберите тематики"
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={topics.map(t => ({ label: t.name, value: t.id }))}
                      maxTagCount="responsive"
                    />
                  </Form.Item>
                )}
              </>
            )}

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} size="large" block>
                Сохранить изменения
              </Button>
            </Form.Item>
          </Form>

          {(user?.userType === 'expert' || user?.userType === 'admin') && (
            <>
              <Divider />
              
              <div>
                <ProfileGallery userId={user.id} isOwner={true} />
              </div>
              
              <Divider />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Title level={4} style={{ margin: 0 }}>Мои услуги</Title>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setShowServiceForm(!showServiceForm)}
                  >
                    Добавить услугу
                  </Button>
                </div>

                {showServiceForm && (
                  <Card style={{ marginBottom: 16 }}>
                    <Form
                      form={serviceForm}
                      layout="vertical"
                      onFinish={handleAddService}
                    >
                      <Form.Item
                        name="title"
                        label="Название"
                        rules={[{ required: true, message: 'Введите название услуги' }]}
                      >
                        <Input placeholder="Например: Консультация по таро" />
                      </Form.Item>

                      <Form.Item
                        name="description"
                        label="Описание"
                        rules={[{ required: true, message: 'Введите описание услуги' }]}
                      >
                        <TextArea rows={5} placeholder="Опишите вашу услугу..." />
                      </Form.Item>

                      <Space 
                        style={{ width: '100%' }} 
                        size="middle"
                        direction={isMobile ? 'vertical' : 'horizontal'}
                      >
                        <Form.Item name="price" label="Цена (₽)" style={{ width: isMobile ? '100%' : 'auto' }}>
                          <Input type="number" placeholder="3000" />
                        </Form.Item>

                        <Form.Item name="duration" label="Длительность (мин)" style={{ width: isMobile ? '100%' : 'auto' }}>
                          <Input type="number" placeholder="60" />
                        </Form.Item>

                        <Form.Item
                          name="serviceType"
                          label="Тип"
                          rules={[{ required: true, message: 'Выберите тип' }]}
                          style={{ width: isMobile ? '100%' : 'auto' }}
                        >
                          <Select style={{ width: isMobile ? '100%' : 150 }} placeholder="Тип">
                            <Select.Option value="online">Онлайн</Select.Option>
                            <Select.Option value="offline">Офлайн</Select.Option>
                            <Select.Option value="both">Оба</Select.Option>
                          </Select>
                        </Form.Item>
                      </Space>

                      <Form.Item>
                        <Space>
                          <Button type="primary" htmlType="submit">
                            {editingService ? 'Сохранить' : 'Добавить'}
                          </Button>
                          <Button onClick={() => {
                            setShowServiceForm(false);
                            setEditingService(null);
                            serviceForm.resetFields();
                          }}>
                            Отмена
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Card>
                )}

                <List
                  dataSource={services}
                  locale={{ emptyText: 'Нет добавленных услуг' }}
                  renderItem={(service) => (
                    <List.Item
                      actions={[
                        <Button
                          key="edit"
                          icon={<EditOutlined />}
                          onClick={() => handleEditService(service)}
                        >
                          Редактировать
                        </Button>,
                        <Popconfirm
                          key="delete"
                          title="Удалить услугу?"
                          description="Это действие нельзя отменить"
                          onConfirm={() => handleDeleteService(service.id)}
                          okText="Да"
                          cancelText="Нет"
                        >
                          <Button danger icon={<DeleteOutlined />}>
                            Удалить
                          </Button>
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            {service.title}
                            <Tag color={
                              service.service_type === 'online' ? 'blue' :
                              service.service_type === 'offline' ? 'green' : 'purple'
                            }>
                              {service.service_type === 'online' ? 'Онлайн' :
                               service.service_type === 'offline' ? 'Офлайн' : 'Оба'}
                            </Tag>
                          </Space>
                        }
                        description={
                          <>
                            <div>{service.description}</div>
                            <Space style={{ marginTop: 8 }}>
                              {service.price && <Text strong>{service.price} ₽</Text>}
                              {service.duration && <Text type="secondary">{service.duration} мин</Text>}
                            </Space>
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>

              <Divider />
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>Готовые продукты</Title>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setShowProductForm(!showProductForm)}
                    >
                      Добавить продукт
                    </Button>
                  </div>

                  {showProductForm && (
                    <Card style={{ marginBottom: 16 }}>
                      <Form
                        form={productForm}
                        layout="vertical"
                        onFinish={handleAddProduct}
                      >
                        <Form.Item
                          name="title"
                          label="Название"
                          rules={[{ required: true, message: 'Введите название продукта' }]}
                        >
                          <Input placeholder="Например: Готовая раскладка таро" />
                        </Form.Item>

                        <Form.Item
                          name="description"
                          label="Описание"
                          rules={[{ required: true, message: 'Введите описание продукта' }]}
                          extra="Используйте Enter для переноса строк. Переносы будут сохранены в описании."
                        >
                          <TextArea 
                            rows={4} 
                            placeholder="Опишите ваш продукт...&#10;Можно использовать переносы строк&#10;для лучшего форматирования текста" 
                          />
                        </Form.Item>

                        <Space style={{ width: '100%' }} size="middle">
                          <Form.Item name="price" label="Цена (₽)">
                            <Input type="number" placeholder="1500" />
                          </Form.Item>

                          <Form.Item
                            name="productType"
                            label="Тип"
                            rules={[{ required: true, message: 'Выберите тип' }]}
                          >
                            <Select style={{ width: 150 }} placeholder="Тип">
                              <Select.Option value="digital">Цифровой</Select.Option>
                              <Select.Option value="physical">Физический</Select.Option>
                              <Select.Option value="service">Услуга</Select.Option>
                            </Select>
                          </Form.Item>
                        </Space>

                        <Form.Item name="imageUrl" label="Изображение продукта">
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Upload
                              name="image"
                              listType="picture-card"
                              showUploadList={false}
                              beforeUpload={handleProductImageUpload}
                              accept="image/*"
                            >
                              <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>
                                  {productImageUploading ? 'Загрузка...' : 'Загрузить фото'}
                                </div>
                              </div>
                            </Upload>
                            {productForm.getFieldValue('imageUrl') && (
                              <div style={{ textAlign: 'center' }}>
                                <img 
                                  src={productForm.getFieldValue('imageUrl')} 
                                  alt="Предварительный просмотр"
                                  style={{ 
                                    maxWidth: 200, 
                                    maxHeight: 200, 
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    border: '1px solid #d9d9d9'
                                  }}
                                />
                                <div style={{ marginTop: 8 }}>
                                  <Button 
                                    size="small" 
                                    onClick={() => {
                                      productForm.setFieldsValue({ imageUrl: '' });
                                    }}
                                  >
                                    Удалить
                                  </Button>
                                </div>
                              </div>
                            )}
                            <Input 
                              placeholder="Или введите URL изображения" 
                              style={{ marginTop: 8 }}
                            />
                          </Space>
                        </Form.Item>

                        <Form.Item>
                          <Space>
                            <Button type="primary" htmlType="submit">
                              {editingProduct ? 'Сохранить' : 'Добавить'}
                            </Button>
                            <Button onClick={() => {
                              setShowProductForm(false);
                              setEditingProduct(null);
                              productForm.resetFields();
                            }}>
                              Отмена
                            </Button>
                          </Space>
                        </Form.Item>
                      </Form>
                    </Card>
                  )}

                  <List
                    dataSource={products}
                    locale={{ emptyText: 'Нет добавленных продуктов' }}
                    renderItem={(product) => (
                      <List.Item
                        actions={[
                          <Button
                            key="view"
                            onClick={() => handleProductClick(product)}
                          >
                            Просмотр
                          </Button>,
                          <Button
                            key="edit"
                            icon={<EditOutlined />}
                            onClick={() => handleEditProduct(product)}
                          >
                            Редактировать
                          </Button>,
                          <Popconfirm
                            key="delete"
                            title="Удалить продукт?"
                            description="Это действие нельзя отменить"
                            onConfirm={() => handleDeleteProduct(product.id)}
                            okText="Да"
                            cancelText="Нет"
                          >
                            <Button danger icon={<DeleteOutlined />}>
                              Удалить
                            </Button>
                          </Popconfirm>
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              {product.title}
                              <Tag color={
                                product.product_type === 'digital' ? 'blue' :
                                product.product_type === 'physical' ? 'green' : 'purple'
                              }>
                                {product.product_type === 'digital' ? 'Цифровой' :
                                 product.product_type === 'physical' ? 'Физический' : 'Услуга'}
                              </Tag>
                            </Space>
                          }
                          description={
                            <>
                              <div 
                                style={{ 
                                  whiteSpace: 'pre-wrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 4,
                                  WebkitBoxOrient: 'vertical',
                                  lineHeight: '1.4',
                                  maxHeight: '5.6em'
                                }}
                              >
                                {product.description}
                              </div>
                              <div style={{ marginTop: 8 }}>
                                {product.price && (
                                  <div style={{ marginBottom: 8 }}>
                                    <Text strong>{product.price} ₽</Text>
                                  </div>
                                )}
                                <div style={{ marginBottom: 8 }}>
                                  <Tag color={
                                    product.product_type === 'digital' ? 'blue' :
                                    product.product_type === 'physical' ? 'green' : 'purple'
                                  }>
                                    {product.product_type === 'digital' ? 'Цифровой' :
                                     product.product_type === 'physical' ? 'Физический' : 'Услуга'}
                                  </Tag>
                                </div>
                                {product.image_url && (
                                  <div>
                                    <img 
                                      src={product.image_url} 
                                      alt={product.title}
                                      style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                                    />
                                  </div>
                                )}
                              </div>
                            </>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
            </>
          )}
        </Space>
      </Card>
    </div>
    
    {renderMobileSelectOverlay()}
    
    <ProductModal
      product={selectedProduct}
      visible={productModalVisible}
      onClose={handleProductModalClose}
      onBuy={handleBuyProduct}
    />
    
    {user && (
      <ShareProfileModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        expert={{
          id: user.id,
          name: user.name,
          slug: user.slug,
          avatar_url: user.avatarUrl,
          bio: user.bio,
          city: user.city,
          topics: user.topics || [],
          telegram_url: user.telegramUrl,
          whatsapp: user.whatsapp,
          customSocials: customSocials
        }}
      />
    )}
    </>
  );
};

export default ProfilePage;
