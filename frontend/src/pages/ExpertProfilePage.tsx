import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Avatar,
  Typography,
  Space,
  Tag,
  Button,
  List,
  Divider,
  Spin,
  message,
  Empty,
  Modal,
  Tabs
} from 'antd';
import {
  UserOutlined,
  EnvironmentOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  PhoneOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  HeartOutlined,
  FileTextOutlined,
  StarOutlined,
  StarFilled,
  PlusOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import {
  MapPin,
  MessageSquare,
  Star,
  Share2,
  ExternalLink,
  Users,
  Image as ImageIcon,
  BookOpen,
  RussianRuble
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import ProfileGallery from '../components/ProfileGallery';
import ArtworkGallery from '../components/ArtworkGallery';
import ProductModal from '../components/ProductModal';
import ClientBookingCalendar from '../components/ClientBookingCalendar';
import ShareProfileModal from '../components/ShareProfileModal';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import '../styles/Profile.css';

dayjs.locale('ru');

const { Title, Text, Paragraph } = Typography;

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

interface Article {
  id: number;
  title: string;
  content: string;
  cover_image?: string;
  views: number;
  likes_count: number;
  created_at: string;
}

interface ExpertProfile {
  id: number;
  name: string;
  email: string;
  slug?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  vk_url?: string;
  telegram_url?: string;
  instagram_url?: string;
  whatsapp?: string;
  consultation_types?: string;
  topics: Array<{ id: number; name: string }>;
  services: Service[];
  products: Product[];
  created_at: string;
  tabs_order?: string;
}

const ExpertProfilePage = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [customSocials, setCustomSocials] = useState<Array<{ id: number, name: string, url: string, created_at: string }>>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');
  const [tabsOrder, setTabsOrder] = useState<string[]>(['photos', 'gallery']);
  const [servicePreview, setServicePreview] = useState<{ visible: boolean; service: Service | null }>({ visible: false, service: null });

  const isOwner = user && expert && String(user.id) === String(expert.id);

  const [photosCount, setPhotosCount] = useState<number>(0);
  const [artworksCount, setArtworksCount] = useState<number>(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setShowAuthModal(true);
      setLoading(false);
      return;
    }
    fetchExpert();
    fetchArticles();
    fetchFavoriteStatus();
    fetchCustomSocials();
  }, [id, user, authLoading]);

  const fetchFavoriteStatus = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/expert-interactions/${id}/status`);
      setIsFavorited(response.data.favorited);
    } catch (error) {
      console.error('Ошибка загрузки статуса избранного:', error);
    }
  };

  const fetchExpert = async () => {
    try {
      const response = await api.get(`/experts/${id}`);
      setExpert(response.data);
      if (response.data.galleryCount !== undefined) setPhotosCount(response.data.galleryCount);
      if (response.data.artworksCount !== undefined) setArtworksCount(response.data.artworksCount);
      if (response.data.tabs_order) {
        try {
          const order = typeof response.data.tabs_order === 'string' ? JSON.parse(response.data.tabs_order) : response.data.tabs_order;
          if (Array.isArray(order) && order.length > 0) setTabsOrder(order);
        } catch (e) {
          console.error('Ошибка парсинга tabs_order:', e);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      message.error('Ошибка загрузки профиля эксперта');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    setLoadingArticles(true);
    try {
      const response = await api.get(`/articles/author/${id}`);
      setArticles(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статей:', error);
    } finally {
      setLoadingArticles(false);
    }
  };

  const fetchCustomSocials = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/users/custom-socials/${id}`);
      setCustomSocials(response.data);
    } catch (error) {
      console.error('Ошибка загрузки кастомных соцсетей:', error);
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleContactExpert = async () => {
    if (!user) { navigate('/login'); return; }
    if (isOwner) { message.warning('Нельзя создать чат с самим собой'); return; }
    try {
      const response = await api.post('/chats/create', { otherUserId: expert?.id });
      navigate(`/chats/${response.data.id}`);
    } catch (error) {
      message.error('Ошибка создания чата');
    }
  };

  const handleBuyService = async (service: Service) => {
    if (!user) { navigate('/login'); return; }
    try {
      const response = await api.post('/chats/create', { otherUserId: expert?.id });
      const chatId = response.data.id;
      const serviceMessage = `🛒 Хочу заказать услугу: "${service.title}"${service.price ? ` (${service.price} ₽)` : ''}.`;
      await api.post(`/chats/${chatId}/messages`, { content: serviceMessage });
      navigate(`/chats/${chatId}`);
      message.success('Сообщение отправлено!');
    } catch (error) {
      message.error('Ошибка заказа услуги');
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
    if (!user) { navigate('/login'); return; }
    try {
      const response = await api.post('/chats/create', { otherUserId: expert?.id });
      const chatId = response.data.id;
      const productMessage = `🛍️ Хочу купить продукт: "${product.title}"${product.price ? ` (${product.price} ₽)` : ''}.`;
      await api.post(`/chats/${chatId}/messages`, { content: productMessage });
      navigate(`/chats/${chatId}`);
      message.success('Сообщение отправлено!');
    } catch (error) {
      message.error('Ошибка покупки продукта');
    }
  };

  const toggleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    if (!id) return;
    try {
      const response = await api.post(`/expert-interactions/${id}/favorite`);
      setIsFavorited(response.data.favorited);
      message.success(response.data.favorited ? 'Добавлено в избранное' : 'Удалено из избранного');
    } catch (error) {
      message.error('Ошибка изменения избранного');
    }
  };

  const handleShare = () => setShareModalVisible(true);

  if (showAuthModal) {
    return (
      <div className="container" style={{ padding: '50px 24px' }}>
        <Card style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', borderRadius: 24 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ fontSize: 48 }}>🔒</div>
            <Title level={3}>Требуется авторизация</Title>
            <Text style={{ fontSize: 16, color: '#666' }}>Зарегистрируйтесь, чтобы просматривать профили экспертов</Text>
            <Space size="middle">
              <Button type="primary" size="large" onClick={() => navigate('/register')} shape="round">Регистрация</Button>
              <Button size="large" onClick={() => navigate('/login')} shape="round">Войти</Button>
            </Space>
          </Space>
        </Card>
      </div>
    );
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!expert) return <div className="container" style={{ textAlign: 'center', padding: 50 }}>Эксперт не найден</div>;

  return (
    <>
      <div className="profile-container">
        <div className="profile-header-card">
          <button
            className="share-btn-top"
            style={{
              position: 'absolute', top: 24, right: 24, padding: 10,
              background: 'rgba(0,0,0,0.03)', borderRadius: '50%', border: 'none', cursor: 'pointer'
            }}
            onClick={handleShare}
          >
            <Share2 size={20} color="#86868b" />
          </button>

          <div className="profile-avatar-wrapper">
            <Avatar size={140} src={expert.avatar_url || '/emp.jpg'} icon={!expert.avatar_url && <UserOutlined />} className="profile-avatar" />
          </div>

          <h1 className="profile-name">{expert.name}</h1>

          {expert.city && (
            <div className="profile-location">
              <MapPin size={16} />
              <span>{expert.city}</span>
            </div>
          )}

          {expert.bio && <div className="profile-bio">{expert.bio}</div>}

          <div className="profile-stats">
            <div className="stat-item"><span className="stat-value">{photosCount}</span><span className="stat-label">Фото</span></div>
            <div className="stat-item"><span className="stat-value">{artworksCount}</span><span className="stat-label">Картины</span></div>
            <div className="stat-item"><span className="stat-value">{articles.length}</span><span className="stat-label">Статьи</span></div>
          </div>

          {!isOwner && (
            <div className="profile-actions">
              <Button type="primary" className="btn-premium btn-primary-premium" icon={<MessageSquare size={20} />} onClick={handleContactExpert}>Написать</Button>
              <Button className="btn-premium btn-secondary-premium" icon={isFavorited ? <Star size={20} fill="#FFD700" color="#FFD700" /> : <Star size={20} />} onClick={toggleFavorite}>
                {isFavorited ? 'В избранном' : 'В избранное'}
              </Button>
            </div>
          )}
        </div>

        <div className="profile-tabs-wrapper">
          {(expert.vk_url || expert.telegram_url || expert.whatsapp || customSocials.length > 0 || (expert.topics && expert.topics.length > 0)) && (
            <div className="section-card">
              <h2 className="section-title"><ExternalLink size={20} /> Информация</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {expert.vk_url && <a href={expert.vk_url.startsWith('http') ? expert.vk_url : `https://${expert.vk_url}`} target="_blank" rel="noopener noreferrer" className="premium-social-link"><span>ВКонтакте</span></a>}
                {expert.telegram_url && <a href={expert.telegram_url.startsWith('http') ? expert.telegram_url : `https://t.me/${expert.telegram_url.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="premium-social-link"><span>Telegram</span></a>}
                {expert.whatsapp && <a href={`https://wa.me/${expert.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="premium-social-link"><span>WhatsApp</span></a>}
                {customSocials.map((social, index) => <a key={index} href={social.url.startsWith('http') ? social.url : `https://${social.url}`} target="_blank" rel="noopener noreferrer" className="premium-social-link"><span>{social.name}</span></a>)}
              </div>

              {expert.topics && expert.topics.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <Space wrap>
                    {expert.topics.filter((topic, index, self) => self.findIndex(t => t.id === topic.id) === index).map((topic) => (
                      <Tag key={topic.id} style={{ borderRadius: 20, padding: '4px 12px', border: 'none', background: '#f5f5f7', color: '#1d1d1f', fontSize: 13 }}>{topic.name}</Tag>
                    ))}
                  </Space>
                </div>
              )}
            </div>
          )}

          <div className="section-card" style={{ padding: '24px' }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className="custom-tabs"
              items={tabsOrder.map(key => {
                if (key === 'photos') {
                  return {
                    key: 'photos',
                    label: <span><ImageIcon size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Фото ({photosCount})</span>,
                    children: <ProfileGallery userId={expert.id} isOwner={isOwner} onItemsCountChange={setPhotosCount} />
                  };
                } else {
                  return {
                    key: 'gallery',
                    label: <span><ImageIcon size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Галерея ({artworksCount})</span>,
                    children: <ArtworkGallery userId={expert.id} isOwner={isOwner} onItemsCountChange={setArtworksCount} />
                  };
                }
              })}
            />
          </div>

          {articles.length > 0 && (
            <div className="section-card">
              <h2 className="section-title"><BookOpen size={20} /> Статьи</h2>
              <List
                grid={{ gutter: 16, xs: 1, sm: 2 }}
                dataSource={articles}
                renderItem={(article) => (
                  <List.Item>
                    <Card hoverable cover={article.cover_image && <img alt={article.title} src={article.cover_image} style={{ height: 160, objectFit: 'cover' }} />} onClick={() => navigate(`/articles/${article.id}`)} className="premium-item-card">
                      <Card.Meta title={article.title} description={dayjs(article.created_at).format('D MMMM YYYY')} />
                    </Card>
                  </List.Item>
                )}
              />
            </div>
          )}

          {expert.services && expert.services.length > 0 && (
            <div className="section-card">
              <h2 className="section-title"><RussianRuble size={20} /> Услуги</h2>
              <div className="premium-grid">
                {expert.services.map((service) => (
                  <div key={service.id} className="premium-item-card" onClick={() => setServicePreview({ visible: true, service })} style={{ cursor: 'pointer' }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{service.title}</h3>
                    <div style={{ color: '#86868b', fontSize: 14, marginBottom: 12, height: '3.2em', overflow: 'hidden' }}>{stripHtml(service.description)}</div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{service.price ? `${service.price} ₽` : 'По запросу'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user && !isOwner && (
            <div className="section-card">
              <h2 className="section-title"><ClockCircleOutlined /> Запись на консультацию</h2>
              <ClientBookingCalendar expertId={expert.id} expertName={expert.name} onBookingComplete={() => message.success('Запись создана!')} />
            </div>
          )}
        </div>
      </div>

      {expert && (
        <ShareProfileModal
          visible={shareModalVisible}
          onClose={() => setShareModalVisible(false)}
          expert={{
            ...expert,
            customSocials: customSocials
          }}
        />
      )}

      <Modal
        title={servicePreview.service?.title}
        open={servicePreview.visible}
        onCancel={() => setServicePreview({ visible: false, service: null })}
        footer={[
          <Button key="close" onClick={() => setServicePreview({ visible: false, service: null })}>Закрыть</Button>,
          <Button key="buy" type="primary" onClick={() => { if (servicePreview.service) { handleBuyService(servicePreview.service); setServicePreview({ visible: false, service: null }); } }}>Заказать</Button>
        ]}
      >
        {servicePreview.service && <div dangerouslySetInnerHTML={{ __html: servicePreview.service.description }} />}
      </Modal>

      <ProductModal visible={productModalVisible} onClose={handleProductModalClose} product={selectedProduct} onBuy={handleBuyProduct} />
    </>
  );
};

export default ExpertProfilePage;
