import React, { useState, useEffect, useMemo } from 'react';
import {
  Tabs, Tag, Button, Space, Typography, message,
  Avatar, Progress, Upload, Form
} from 'antd';
import {
  UserOutlined, EditOutlined,
  ShareAltOutlined,
  SettingOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  CloseOutlined
} from '@ant-design/icons';
import {
  MapPin, Share2, ExternalLink, Image as ImageIcon, RussianRuble, Settings, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import ProfileGallery from '../components/ProfileGallery';
import ArtworkGallery from '../components/ArtworkGallery';
import ShareProfileModal from '../components/ShareProfileModal';
import ExpertBenefitsCard from '../components/ExpertBenefitsCard';
import '../styles/Profile.css';

import ServiceManager from '../components/profile/ServiceManager';
import ProductManager from '../components/profile/ProductManager';
import ProfileEditForm from '../components/profile/ProfileEditForm';
import ExpertStatusSection from '../components/profile/ExpertStatusSection';

const { Text } = Typography;

type MobileSelectType = 'city' | 'consultationTypes' | 'topics';

const CONSULTATION_TYPES = [
  'Онлайн', 'Офлайн', 'Выезд на дом',
  'Групповые сессии', 'Индивидуальные сессии'
];

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [topics, setTopics] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [photosCount, setPhotosCount] = useState(0);
  const [artworksCount, setArtworksCount] = useState(0);
  const [tabsOrder, setTabsOrder] = useState(['photos', 'gallery']);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [customSocials, setCustomSocials] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastUploadedAvatarUrl, setLastUploadedAvatarUrl] = useState<string | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [mobileSelectType, setMobileSelectType] = useState<MobileSelectType | null>(null);
  const [mobileSelectClosing, setMobileSelectClosing] = useState(false);

  const selectedCity = Form.useWatch('city', form);
  const selectedConsultationTypes = Form.useWatch('consultationTypes', form) || [];
  const selectedTopics = Form.useWatch('topics', form) || [];

  const isExpert = user?.userType === 'expert' || user?.userType === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        const [t, c, s] = await Promise.all([
          api.get('/topics'), api.get('/cities'), api.get('/users/custom-socials')
        ]);
        setTopics(t.data); setCities(c.data); setCustomSocials(s.data);
        if (isExpert && user?.id) {
          const [sv, pr] = await Promise.all([
            api.get(`/experts/${user.id}`), api.get('/products')
          ]);
          setServices(sv.data.services || []); setProducts(pr.data);
        }
      } catch (e) { console.error(e); }
    };
    load();
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [user?.id, user?.userType]);

  useEffect(() => {
    if (!user) return;
    const tv = user.topics?.map((t: any) => typeof t === 'object' ? t.id : t) || [];
    form.setFieldsValue({
      name: user.name, email: user.email, bio: user.bio, city: user.city,
      vkUrl: user.vkUrl, telegramUrl: user.telegramUrl, whatsapp: user.whatsapp,
      consultationTypes: Array.isArray(user.consultationTypes) ? user.consultationTypes : [],
      topics: tv
    });
    if (user.tabsOrder) {
      try {
        const o = typeof user.tabsOrder === 'string' ? JSON.parse(user.tabsOrder) : user.tabsOrder;
        if (Array.isArray(o)) setTabsOrder(o);
      } catch (e) {}
    }
  }, [user, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const r = await api.put('/users/profile', values);
      updateUser(r.data);
      message.success('Профиль обновлён');
    } catch (e) { message.error('Ошибка сохранения'); }
    finally { setLoading(false); }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploading(true); setUploadProgress(0);
    try {
      const fd = new FormData(); fd.append('avatar', file);
      const r = await api.post('/users/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / (p.total || 1)))
      });
      setLastUploadedAvatarUrl(r.data.avatarUrl);
      updateUser({ ...user, avatarUrl: r.data.avatarUrl });
      message.success('Аватар обновлён');
    } catch (e) { message.error('Ошибка загрузки'); }
    finally { setUploading(false); }
    return false;
  };

  const topicLabels = useMemo(() => {
    const m = new Map(topics.map(t => [String(t.id), t.name]));
    return selectedTopics.map((id: any) => m.get(String(id))).filter(Boolean);
  }, [selectedTopics, topics]);

  const openMobileSelect = (type: MobileSelectType) => { setMobileSelectClosing(false); setMobileSelectType(type); };
  const closeMobileSelect = () => { setMobileSelectClosing(true); setTimeout(() => { setMobileSelectType(null); setMobileSelectClosing(false); }, 250); };
  const handleMobileOption = (value: any) => {
    if (!mobileSelectType) return;
    if (mobileSelectType === 'city') { form.setFieldsValue({ city: value }); closeMobileSelect(); return; }
    const cur = form.getFieldValue(mobileSelectType) || [];
    const has = cur.some((v: any) => String(v) === String(value));
    form.setFieldsValue({ [mobileSelectType]: has ? cur.filter((v: any) => String(v) !== String(value)) : [...cur, value] });
  };

  const mobileOverlay = () => {
    if (!isMobile || !mobileSelectType) return null;
    let opts: any[] = [], title = '';
    if (mobileSelectType === 'city') { title = 'Город'; opts = cities.map(c => ({ label: c.name, value: c.name })); }
    else if (mobileSelectType === 'topics') { title = 'Тематики'; opts = topics.map(t => ({ label: t.name, value: t.id })); }
    else { title = 'Консультации'; opts = CONSULTATION_TYPES.map(t => ({ label: t, value: t })); }
    return createPortal(
      <div className={`mobile-select-overlay ${mobileSelectClosing ? 'closing' : ''}`} onClick={closeMobileSelect}>
        <div className="mobile-select-panel" onClick={e => e.stopPropagation()}>
          <div className="mobile-select-header">
            <Text strong>{title}</Text>
            <Button type="text" onClick={closeMobileSelect} icon={<CloseOutlined />} />
          </div>
          <div className="mobile-select-options">
            {opts.map(o => <div key={o.value} className="mobile-select-option" onClick={() => handleMobileOption(o.value)}>{o.label}</div>)}
          </div>
        </div>
      </div>, document.body
    );
  };

  // Получаем все user topics как объекты
  const userTopics = useMemo(() => {
    if (!user?.topics) return [];
    return user.topics.map((t: any) => {
      if (typeof t === 'object') return t;
      const found = topics.find(tp => tp.id === t);
      return found || { id: t, name: String(t) };
    });
  }, [user?.topics, topics]);

  return (
    <>
      <div className="profile-container">
        {/* === HEADER === */}
        <div className="profile-header-card">
          <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 8 }}>
            <button className="header-action-btn" onClick={() => setIsEditMode(!isEditMode)} title={isEditMode ? 'Просмотр' : 'Настройки'}>
              {isEditMode ? <Eye size={18} color="#86868b" /> : <Settings size={18} color="#86868b" />}
            </button>
            <button className="header-action-btn" onClick={() => setShareModalVisible(true)}>
              <Share2 size={18} color="#86868b" />
            </button>
          </div>

          <div className="profile-avatar-wrapper">
            <Upload accept="image/*" showUploadList={false} beforeUpload={handleAvatarUpload} disabled={uploading}>
              <div style={{ position: 'relative', cursor: 'pointer' }}>
                <Avatar
                  size={140}
                  src={lastUploadedAvatarUrl || user?.avatarUrl || '/emp.jpg'}
                  icon={!user?.avatarUrl && <UserOutlined />}
                  className="profile-avatar"
                />
                {uploading && (
                  <div className="avatar-upload-overlay">
                    <Progress type="circle" percent={uploadProgress} size={100} strokeColor="#fff" format={p => `${p}%`} />
                  </div>
                )}
                {!uploading && (
                  <div className="avatar-edit-overlay">
                    <EditOutlined style={{ fontSize: 16, color: '#1d1d1f' }} />
                  </div>
                )}
              </div>
            </Upload>
          </div>

          <h1 className="profile-name">{user?.name}</h1>
          {user?.city && <div className="profile-location"><MapPin size={16} /><span>{user.city}</span></div>}
          {user?.bio && <div className="profile-bio">{user.bio}</div>}

          <div className="profile-stats">
            <div className="stat-item"><span className="stat-value">{photosCount}</span><span className="stat-label">Фото</span></div>
            <div className="stat-item"><span className="stat-value">{artworksCount}</span><span className="stat-label">Галерея</span></div>
            {isExpert && (
              <>
                <div className="stat-item"><span className="stat-value">{services.length}</span><span className="stat-label">Услуги</span></div>
                <div className="stat-item"><span className="stat-value">{products.length}</span><span className="stat-label">Продукты</span></div>
              </>
            )}
          </div>
        </div>

        {/* === CONTENT === */}
        <div className="profile-tabs-wrapper">
          {!isEditMode ? (
            <>
              {/* Контакты и тематики */}
              {(user?.vkUrl || user?.telegramUrl || user?.whatsapp || customSocials.length > 0 || userTopics.length > 0) && (
                <div className="section-card">
                  <h2 className="section-title"><ExternalLink size={20} /> Информация</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {user?.vkUrl && <a href={user.vkUrl.startsWith('http') ? user.vkUrl : `https://${user.vkUrl}`} target="_blank" rel="noopener noreferrer" className="premium-social-link"><span>ВКонтакте</span></a>}
                    {user?.telegramUrl && <a href={user.telegramUrl.startsWith('http') ? user.telegramUrl : `https://t.me/${user.telegramUrl.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="premium-social-link"><span>Telegram</span></a>}
                    {user?.whatsapp && <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="premium-social-link"><span>WhatsApp</span></a>}
                    {customSocials.map((s, i) => <a key={i} href={s.url.startsWith('http') ? s.url : `https://${s.url}`} target="_blank" rel="noopener noreferrer" className="premium-social-link"><span>{s.name}</span></a>)}
                  </div>
                  {userTopics.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <Space wrap>
                        {userTopics.map((t: any) => (
                          <Tag key={t.id} style={{ borderRadius: 20, padding: '4px 12px', border: 'none', background: '#f5f5f7', color: '#1d1d1f', fontSize: 13 }}>
                            {t.name}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  )}
                </div>
              )}

              {/* Галерея */}
              <div className="section-card" style={{ padding: 24 }}>
                <Tabs
                  className="custom-tabs"
                  items={tabsOrder.map(key => {
                    if (key === 'photos') return {
                      key: 'photos',
                      label: <span><ImageIcon size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Фото ({photosCount})</span>,
                      children: <ProfileGallery userId={user?.id} isOwner={true} onItemsCountChange={setPhotosCount} />
                    };
                    return {
                      key: 'gallery',
                      label: <span><ImageIcon size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Галерея ({artworksCount})</span>,
                      children: <ArtworkGallery userId={user?.id} isOwner={true} onItemsCountChange={setArtworksCount} />
                    };
                  })}
                />
              </div>

              {/* Услуги */}
              {isExpert && services.length > 0 && (
                <div className="section-card">
                  <h2 className="section-title"><RussianRuble size={20} /> Услуги</h2>
                  <div className="premium-grid">
                    {services.map((s: any) => (
                      <div key={s.id} className="premium-item-card">
                        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{s.title}</h3>
                        <div style={{ color: '#86868b', fontSize: 14, marginBottom: 12, height: '3.2em', overflow: 'hidden' }}>{s.description}</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{s.price ? `${s.price} ₽` : 'По запросу'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Продукты */}
              {products.length > 0 && (
                <div className="section-card">
                  <h2 className="section-title"><ImageIcon size={20} /> Продукты</h2>
                  <div className="premium-grid">
                    {products.map((p: any) => (
                      <div key={p.id} className="premium-item-card" style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
                        {p.image_url && (
                          <div style={{ width: '100%', height: 160, overflow: 'hidden' }}>
                            <img src={p.image_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ padding: 20 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{p.title}</h3>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{p.price ? `${p.price} ₽` : 'Бесплатно'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Предложение стать экспертом */}
              {user?.userType === 'client' && <ExpertBenefitsCard />}
            </>
          ) : (
            /* === РЕЖИМ НАСТРОЕК === */
            <div className="settings-dashboard">
              {isExpert && <ExpertStatusSection user={user} />}

              <ProfileEditForm
                user={user} form={form} cities={cities} topics={topics}
                customSocials={customSocials} onSocialsUpdate={setCustomSocials}
                onFinish={onFinish} loading={loading} isMobile={isMobile}
                openMobileSelect={openMobileSelect}
                selectedCity={selectedCity}
                selectedTopicsLabel={topicLabels.join(', ')}
                selectedConsultationTypesLabel={selectedConsultationTypes.join(', ')}
              />

              {isExpert && (
                <>
                  <ServiceManager user={user} services={services} onServicesUpdate={setServices} isMobile={isMobile} />
                  <ProductManager products={products} onProductsUpdate={setProducts} isMobile={isMobile} />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {mobileOverlay()}

      {user && (
        <ShareProfileModal
          visible={shareModalVisible}
          onClose={() => setShareModalVisible(false)}
          expert={{
            id: user.id, name: user.name, slug: user.slug,
            avatar_url: user.avatarUrl, bio: user.bio, city: user.city,
            topics: user.topics || [], telegram_url: user.telegramUrl,
            whatsapp: user.whatsapp, customSocials
          }}
        />
      )}
    </>
  );
};

export default ProfilePage;
