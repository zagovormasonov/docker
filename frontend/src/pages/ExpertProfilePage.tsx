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
  Modal
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
  ShareAltOutlined,
  RadiusBottomrightOutlined
} from '@ant-design/icons';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import ProfileGallery from '../components/ProfileGallery';
import ProductModal from '../components/ProductModal';
import ClientBookingCalendar from '../components/ClientBookingCalendar';
import ShareProfileModal from '../components/ShareProfileModal';
import '../components/ServiceDescription.css';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { LucideBadgeRussianRuble, RussianRuble, RussianRubleIcon } from 'lucide-react';

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
}

const ExpertProfilePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [customSocials, setCustomSocials] = useState<Array<{id: number, name: string, url: string, created_at: string}>>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Проверяем авторизацию пользователя
    if (!user) {
      setShowAuthModal(true);
      setLoading(false);
      return;
    }

    fetchExpert();
    fetchArticles();
    fetchFavoriteStatus();
    fetchCustomSocials();
  }, [id, user]);

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
      console.log('Custom socials loaded:', response.data);
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

  const [servicePreview, setServicePreview] = useState<{ visible: boolean; service: Service | null }>({ visible: false, service: null });

  const handleContactExpert = async () => {
    if (!user) {
      message.warning('Необходимо войти в систему');
      navigate('/login');
      return;
    }

    // Проверяем, что пользователь не пытается создать чат с самим собой
    if (user.id === expert?.id) {
      message.warning('Нельзя создать чат с самим собой');
      return;
    }

    try {
      const response = await api.post('/chats/create', { otherUserId: expert?.id });
      navigate(`/chats/${response.data.id}`);
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      message.error('Ошибка создания чата');
    }
  };

  const handleBuyService = async (service: Service) => {
    if (!user) {
      message.warning('Необходимо войти в систему');
      navigate('/login');
      return;
    }

    try {
      // Создаем или находим чат с экспертом
      const response = await api.post('/chats/create', { otherUserId: expert?.id });
      const chatId = response.data.id;
      
      // Отправляем сообщение об услуге
      const serviceMessage = `🛒 Хочу заказать услугу: "${service.title}"${service.price ? ` (${service.price} ₽)` : ''}${service.duration ? `, длительность: ${service.duration} мин` : ''}. ${service.description}`;
      
      await api.post(`/chats/${chatId}/messages`, {
        content: serviceMessage
      });
      
      // Переходим в чат
      navigate(`/chats/${chatId}`);
      message.success('Сообщение об услуге отправлено в чат!');
    } catch (error) {
      console.error('Ошибка заказа услуги:', error);
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
    if (!user) {
      message.warning('Необходимо войти в систему');
      navigate('/login');
      return;
    }

    try {
      // Создаем или находим чат с экспертом
      const response = await api.post('/chats/create', { otherUserId: expert?.id });
      const chatId = response.data.id;
      
      // Отправляем сообщение о продукте
      const productMessage = `🛍️ Хочу купить продукт: "${product.title}"${product.price ? ` (${product.price} ₽)` : ''}. ${product.description}`;
      
      await api.post(`/chats/${chatId}/messages`, {
        content: productMessage
      });
      
      // Переходим в чат
      navigate(`/chats/${chatId}`);
      message.success('Сообщение о продукте отправлено в чат!');
    } catch (error) {
      console.error('Ошибка покупки продукта:', error);
      message.error('Ошибка покупки продукта');
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      message.warning('Необходимо войти в систему');
      navigate('/login');
      return;
    }

    if (!id) return;

    try {
      const response = await api.post(`/expert-interactions/${id}/favorite`);
      setIsFavorited(response.data.favorited);
      message.success(response.data.favorited ? 'Эксперт добавлен в избранное' : 'Эксперт удален из избранного');
    } catch (error) {
      console.error('Ошибка изменения избранного:', error);
      message.error('Ошибка изменения избранного');
    }
  };

  const handleShare = () => {
    console.log('Opening share modal with customSocials:', customSocials);
    setShareModalVisible(true);
  };

  // Модальное окно для незарегистрированных пользователей
  if (showAuthModal) {
    return (
      <div className="container" style={{ padding: '50px 24px' }}>
        <Card style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ fontSize: 48 }}>🔒</div>
            <Title level={3}>Требуется авторизация</Title>
            <Text style={{ fontSize: 16, color: '#666' }}>
              Зарегистрируйтесь, чтобы иметь возможность пользоваться базовым функционалом, 
              просматривать профили экспертов и записываться на консультации
            </Text>
            <Space size="middle">
              <Button 
                type="primary" 
                size="large"
                onClick={() => navigate('/register')}
              >
                Зарегистрироваться
              </Button>
              <Button 
                size="large"
                onClick={() => navigate('/login')}
              >
                Войти
              </Button>
            </Space>
            <Button 
              type="text"
              onClick={() => navigate('/experts')}
            >
              Вернуться к списку экспертов
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!expert) {
    return <div className="container">Эксперт не найден</div>;
  }

  return (
    <>
    <div className="container">
      <Card>
        {/* Кнопка поделиться в правом верхнем углу */}
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            onClick={handleShare}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #d9d9d9',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
            title="Поделиться профилем"
          />
        </div>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Аватар и основная информация */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Avatar
              size={120}
              src={expert.avatar_url || '/emp.jpg'}
              icon={!expert.avatar_url && <UserOutlined />}
              style={{ 
                backgroundColor: '#6366f1',
                border: '4px solid #6366f1',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            />
            
            <div style={{ textAlign: 'center', width: '100%' }}>
              <Title level={2} style={{ marginBottom: 8 }}>{expert.name}</Title>
              
              {expert.city && (
                <Space style={{ marginBottom: 16 }}>
                  <EnvironmentOutlined />
                  <Text type="secondary">{expert.city}</Text>
                </Space>
              )}
            </div>
          </div>

          {/* Описание эксперта */}
          {expert.bio && (
            <div style={{ width: '100%' }}>
              <Paragraph style={{ fontSize: 16, color: '#86868b', marginBottom: 16, textAlign: 'center' }}>
                {expert.bio}
              </Paragraph>
            </div>
          )}

          {/* Кнопки действий */}
          {user?.id !== expert.id && (
            <div style={{ width: '100%' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<MessageOutlined />}
                  onClick={handleContactExpert}
                  style={{ width: '100%' }}
                >
                  Связаться с экспертом
                </Button>
                <Button
                  size="large"
                  icon={isFavorited ? <StarFilled /> : <StarOutlined />}
                  onClick={toggleFavorite}
                  style={{
                    color: isFavorited ? '#faad14' : '#8c8c8c',
                    borderColor: isFavorited ? '#faad14' : '#d9d9d9',
                    width: '100%'
                  }}
                >
                  {isFavorited ? 'В избранном' : 'Добавить в избранное'}
                </Button>
              </Space>
            </div>
          )}

          {/* Типы консультаций */}
          {expert.consultation_types && (() => {
            try {
              const types = JSON.parse(expert.consultation_types);
              if (types.length > 0) {
                return (
                  <>
                    <Divider />
                    <div>
                      <Title level={4}><InfoCircleOutlined /> Типы консультаций</Title>
                      <Space wrap>
                        {types.map((type: string, idx: number) => (
                          <Tag key={idx} color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                            {type}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </>
                );
              }
            } catch (e) {
              return null;
            }
            return null;
          })()}

          {/* Социальные сети */}
          {(expert.telegram_url || expert.whatsapp) && (
            <>
              <Divider />
              <div>
                <Title level={4}><LinkOutlined /> Контакты и социальные сети</Title>
                <Space direction="vertical" size="small">
                  {expert.telegram_url && (
                    <a href={expert.telegram_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src="/tg.png" alt="Telegram" style={{ width: 20, height: 20 }} />
                      Telegram: {expert.telegram_url}
                    </a>
                  )}
                  {expert.whatsapp && (
                    <Text style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src="/wp.png" alt="WhatsApp" style={{ width: 20, height: 20 }} />
                      WhatsApp: {expert.whatsapp}
                    </Text>
                  )}
                  
                  {/* Отображение кастомных соцсетей */}
                  {customSocials.map((social, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      padding: 8,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 6,
                      marginTop: 8
                    }}>
                      <Text style={{ fontSize: 16, fontWeight: 500 }}>{social.name}:</Text>
                      <a href={social.url} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>
                        {social.url}
                      </a>
                    </div>
                  ))}
                  {/* Кнопка добавления новой соцсети - только для владельца профиля */}
                  {user?.id === expert.id && (
                    <Button 
                      type="dashed" 
                      icon={<PlusOutlined />}
                      style={{ 
                        marginTop: 8,
                        borderStyle: 'dashed',
                        borderColor: '#d9d9d9',
                        color: '#8c8c8c'
                      }}
                      onClick={() => {
                        // Здесь можно добавить модальное окно для добавления новой соцсети
                        message.info('Функция добавления соцсетей в разработке');
                      }}
                    >
                      Добавить соцсеть
                    </Button>
                  )}
                </Space>
              </div>
            </>
          )}

          {expert.topics && expert.topics.length > 0 && (
            <>
              <Divider />
              <div>
                <Title level={4}>Тематики</Title>
                <Space wrap>
                  {expert.topics
                    .filter((topic, index, self) => 
                      self.findIndex(t => t.id === topic.id) === index
                    )
                    .map((topic) => (
                    <Tag key={topic.id} color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>
                      {topic.name}
                    </Tag>
                  ))}
                </Space>
              </div>
            </>
          )}

          {/* Галерея фотографий */}
          <Divider />
          <div>
            <ProfileGallery userId={expert.id} isOwner={user?.id === expert.id} />
          </div>

          {expert.services && expert.services.length > 0 && (
            <>
              <Divider />
              <div>
                <Title level={4}>Услуги</Title>
                <List
                  dataSource={expert.services}
                  renderItem={(service) => (
                    <List.Item>
                      <Card style={{ width: '100%', cursor: 'pointer' }} size="small" hoverable onClick={() => setServicePreview({ visible: true, service })}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <Title level={5}>{service.title}</Title>
                            <div className="service-description" style={{ color: '#595959' }}>
                              {(() => {
                                const text = stripHtml(service.description);
                                return text.length > 100 ? `${text.slice(0, 100)}…` : text;
                              })()}
                            </div>
                            
                            <div>
                              {service.price && (
                                <div style={{ marginBottom: 8 }}>
                                  <Space>
                                    <LucideBadgeRussianRuble />
                                    <Text>{service.price} ₽</Text>
                                  </Space>
                                </div>
                              )}
                              {service.duration && (
                                <div style={{ marginBottom: 8 }}>
                                  <Space>
                                    <ClockCircleOutlined />
                                    <Text>{service.duration} мин</Text>
                                  </Space>
                                </div>
                              )}
                              <div>
                                <Tag color={
                                  service.service_type === 'online' ? 'blue' :
                                  service.service_type === 'offline' ? 'green' : 'purple'
                                }>
                                  {service.service_type === 'online' ? 'Онлайн' :
                                   service.service_type === 'offline' ? 'Офлайн' : 'Онлайн/Офлайн'}
                                </Tag>
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleBuyService(service)}
                            style={{ marginLeft: 16, minWidth: 80 }}
                          >
                            Купить
                          </Button>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              </div>
            </>
          )}

          {/* Модалка полного описания услуги */}
          <Modal
            title={servicePreview.service?.title}
            open={servicePreview.visible}
            onCancel={() => setServicePreview({ visible: false, service: null })}
            footer={null}
            width={800}
          >
            <div
              className="service-description"
              dangerouslySetInnerHTML={{ __html: servicePreview.service?.description || '' }}
            />
          </Modal>

          {expert.products && expert.products.length > 0 && (
            <>
              <Divider />
              <div>
                <Title level={4}>Готовые продукты</Title>
                <List
                  dataSource={expert.products}
                  renderItem={(product) => (
                    <List.Item>
                      <Card 
                        style={{ width: '100%', cursor: 'pointer' }} 
                        size="small"
                        hoverable
                        onClick={() => handleProductClick(product)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <Title level={5}>{product.title}</Title>
                            <Paragraph 
                              type="secondary"
                              ellipsis={{ 
                                rows: 4, 
                                expandable: false,
                                symbol: '...'
                              }}
                              style={{ 
                                marginBottom: 8,
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {product.description}
                            </Paragraph>
                            
                            <div>
                              {product.price && (
                                <div style={{ marginBottom: 8 }}>
                                  <Space>
                                    <LucideBadgeRussianRuble />
                                    <Text>{product.price} ₽</Text>
                                  </Space>
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
                            </div>
                            
                            {product.image_url && (
                              <div style={{ marginTop: 8 }}>
                                <img 
                                  src={product.image_url} 
                                  alt={product.title}
                                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                                />
                              </div>
                            )}
                          </div>
                          
                          <Button
                            type="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyProduct(product);
                            }}
                            style={{ marginLeft: 16, minWidth: 80 }}
                          >
                            Купить
                          </Button>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              </div>
            </>
          )}

          {/* Календарь записей */}
          {user && user.id !== expert.id && (
            <>
              <Divider />
              <div>
                <ClientBookingCalendar 
                  expertId={expert.id} 
                  expertName={expert.name}
                  onBookingComplete={() => {
                    message.success('Запись создана! Эксперт получит уведомление.');
                  }}
                />
              </div>
            </>
          )}

          {/* Статьи эксперта */}
          <Divider />
          <div>
            <Title level={4}><FileTextOutlined /> Статьи эксперта</Title>
            {loadingArticles ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : articles.length === 0 ? (
              <Empty description="Эксперт пока не опубликовал ни одной статьи" />
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
                dataSource={articles}
                renderItem={(article) => (
                  <List.Item>
                    <Card
                      hoverable
                      onClick={() => navigate(`/articles/${article.id}`)}
                      cover={
                        <div style={{ height: 200, overflow: 'hidden' }}>
                          <img
                            src={article.cover_image || '/art.jpg'}
                            alt={article.title}
                            style={{ width: '100%', height: 200, objectFit: 'cover' }}
                          />
                        </div>
                      }
                    >
                      <Card.Meta
                        title={
                          <div 
                            style={{ 
                              fontSize: 16, 
                              fontWeight: 600,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {article.title}
                          </div>
                        }
                        description={
                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Text type="secondary" ellipsis>
                              {stripHtml(article.content).substring(0, 100)}...
                            </Text>
                            <Space split="•">
                              <Space size={4}>
                                <HeartOutlined />
                                <Text type="secondary">{article.likes_count || 0}</Text>
                              </Space>
                              <Space size={4}>
                                <EyeOutlined />
                                <Text type="secondary">{article.views}</Text>
                              </Space>
                              <Text type="secondary">
                                {dayjs(article.created_at).format('DD MMM YYYY')}
                              </Text>
                            </Space>
                          </Space>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </div>
        </Space>
      </Card>
    </div>
    
    <ProductModal
      product={selectedProduct}
      visible={productModalVisible}
      onClose={handleProductModalClose}
      onBuy={handleBuyProduct}
    />
    
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
    </>
  );
};

export default ExpertProfilePage;
