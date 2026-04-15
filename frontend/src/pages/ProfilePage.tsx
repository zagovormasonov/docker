import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Tabs, Tag, Button, Space, Typography, message, 
  Avatar, Progress, Upload, Divider, Form 
} from 'antd';
import { 
  UserOutlined, EditOutlined, ShareAltOutlined as Share2, 
  SettingOutlined as Settings, EyeOutlined as Eye,
  EnvironmentOutlined as MapPin, LinkOutlined as ExternalLink,
  PictureOutlined as ImageIcon,
  CloseOutlined, 
  SearchOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { DropResult } from 'react-beautiful-dnd';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import ProfileGallery from '../components/ProfileGallery';
import ArtworkGallery from '../components/ArtworkGallery';
import ProductModal from '../components/ProductModal';
import ShareProfileModal from '../components/ShareProfileModal';
import '../styles/Profile.css';

// Импорт новых вынесенных компонентов
import ServiceManager from '../components/profile/ServiceManager';
import ProductManager from '../components/profile/ProductManager';
import ProfileEditForm from '../components/profile/ProfileEditForm';
import ExpertStatusSection from '../components/profile/ExpertStatusSection';

const { Text } = Typography;

type MobileSelectType = 'city' | 'consultationTypes' | 'topics';

interface Topic {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
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
  
  // States
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [photosCount, setPhotosCount] = useState<number>(0);
  const [artworksCount, setArtworksCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState('photos');
  const [tabsOrder, setTabsOrder] = useState<string[]>(['photos', 'gallery']);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [customSocials, setCustomSocials] = useState<any[]>([]);
  
  // Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastUploadedAvatarUrl, setLastUploadedAvatarUrl] = useState<string | null>(null);
  
  // UI States
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [mobileSelectType, setMobileSelectType] = useState<MobileSelectType | null>(null);
  const [mobileSelectSearch, setMobileSelectSearch] = useState('');
  const [mobileSelectClosing, setMobileSelectClosing] = useState(false);

  // Watches
  const selectedCity = Form.useWatch('city', form);
  const selectedConsultationTypes = Form.useWatch('consultationTypes', form) || [];
  const selectedTopics = Form.useWatch('topics', form) || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsRes, citiesRes, socialsRes] = await Promise.all([
          api.get('/topics'),
          api.get('/cities'),
          api.get('/users/custom-socials')
        ]);
        setTopics(topicsRes.data);
        setCities(citiesRes.data);
        setCustomSocials(socialsRes.data);
        
        if (user?.userType === 'expert' || user?.userType === 'admin') {
          const [servicesRes, productsRes] = await Promise.all([
            api.get(`/experts/${user?.id}`),
            api.get('/products')
          ]);
          setServices(servicesRes.data.services || []);
          setProducts(productsRes.data);
        }
      } catch (e) {
        console.error('Data loading error:', e);
      }
    };

    fetchData();
    
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [user?.id, user?.userType]);

  useEffect(() => {
    if (user) {
      const topicsValue = user.topics ? user.topics.map((t: any) => typeof t === 'object' ? t.id : t) : [];
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
      if (user.tabsOrder) {
        try {
          const order = typeof user.tabsOrder === 'string' ? JSON.parse(user.tabsOrder) : user.tabsOrder;
          if (Array.isArray(order)) setTabsOrder(order);
        } catch (e) { console.error(e); }
      }
    }
  }, [user, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await api.put('/users/profile', values);
      updateUser(res.data);
      message.success('Профиль обновлен');
    } catch (e) {
      message.error('Ошибка сохранения');
    } finally { setLoading(false); }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / (p.total || 1)))
      });
      setLastUploadedAvatarUrl(res.data.avatarUrl);
      updateUser({ ...user, avatarUrl: res.data.avatarUrl });
      message.success('Аватар обновлен');
    } catch (e) { message.error('Ошибка загрузки'); }
    finally { setUploading(false); }
    return false;
  };

  const selectedTopicLabels = useMemo(() => {
    const topicMap = new Map(topics.map(t => [String(t.id), t.name]));
    return selectedTopics.map((id: any) => topicMap.get(String(id))).filter(Boolean);
  }, [selectedTopics, topics]);

  const selectedConsultationTypesLabel = selectedConsultationTypes.join(', ');
  const selectedTopicsLabel = selectedTopicLabels.join(', ');

  const openMobileSelect = (type: MobileSelectType) => { setMobileSelectClosing(false); setMobileSelectType(type); setMobileSelectSearch(''); };
  const closeMobileSelect = () => { setMobileSelectClosing(true); setTimeout(() => { setMobileSelectType(null); setMobileSelectClosing(false); }, 250); };

  const handleMobileOptionClick = (value: string | number) => {
    if (!mobileSelectType) return;
    if (mobileSelectType === 'city') { form.setFieldsValue({ city: value }); closeMobileSelect(); return; }
    const current = form.getFieldValue(mobileSelectType) || [];
    const exists = current.some((v: any) => String(v) === String(value));
    const next = exists ? current.filter((v: any) => String(v) !== String(value)) : [...current, value];
    form.setFieldsValue({ [mobileSelectType]: next });
  };

  const renderMobileSelectOverlay = () => {
    if (!isMobile || !mobileSelectType) return null;
    let options: any[] = [];
    let title = '';
    if (mobileSelectType === 'city') { title = "Город"; options = cities.map(c => ({ label: c.name, value: c.name })); }
    else if (mobileSelectType === 'topics') { title = "Тематики"; options = topics.map(t => ({ label: t.name, value: t.id })); }
    else { title = "Консультации"; options = CONSULTATION_TYPES.map(t => ({ label: t, value: t })); }
    
    return createPortal(
      <div className={`mobile-select-overlay ${mobileSelectClosing ? 'closing' : ''}`} onClick={closeMobileSelect}>
        <div className="mobile-select-panel" onClick={e => e.stopPropagation()}>
          <div className="mobile-select-header">
            <Text strong>{title}</Text>
            <Button type="text" onClick={closeMobileSelect} icon={<CloseOutlined />} />
          </div>
          <div className="mobile-select-options">
            {options.map(opt => (
              <div key={opt.value} className="mobile-select-option" onClick={() => handleMobileOptionClick(opt.value)}>
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="profile-container">
        <div className="profile-header-card">
          <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 12 }}>
            <Button shape="circle" icon={isEditMode ? <Eye /> : <Settings />} onClick={() => setIsEditMode(!isEditMode)} className="glass-btn" />
            <Button shape="circle" icon={<Share2 />} onClick={() => setShareModalVisible(true)} className="glass-btn" />
          </div>

          <div className="profile-avatar-wrapper">
            <Upload accept="image/*" showUploadList={false} beforeUpload={handleAvatarUpload} disabled={uploading}>
              <div className="avatar-interaction">
                <Avatar size={140} src={lastUploadedAvatarUrl || user?.avatarUrl || '/emp.jpg'} className="premium-avatar-shadow" />
                <div className="avatar-edit-badge"><EditOutlined /></div>
                {uploading && <Progress percent={uploadProgress} type="circle" size={140} className="avatar-upload-progress" />}
              </div>
            </Upload>
          </div>

          <h1 className="profile-name">{user?.name}</h1>
          {user?.city && <div className="profile-location"><MapPin style={{ fontSize: 16 }} /> {user.city}</div>}
          {user?.bio && <div className="profile-bio">{user.bio}</div>}

          <div className="profile-stats">
            <div className="stat-item"><span className="stat-value">{photosCount}</span>Фото</div>
            <div className="stat-item"><span className="stat-value">{artworksCount}</span>Галерея</div>
            {(user?.userType === 'expert' || user?.userType === 'admin') && (
              <>
                <div className="stat-item"><span className="stat-value">{services.length}</span>Услуги</div>
                <div className="stat-item"><span className="stat-value">{products.length}</span>Продукты</div>
              </>
            )}
          </div>
        </div>

        <div className="profile-tabs-wrapper">
          {!isEditMode ? (
            <div className="view-mode-layout animated fadeIn">
              <div className="section-card shadow-sm" style={{ padding: '24px' }}>
                <Space wrap size="middle">
                  {user?.vkUrl && <a href={user.vkUrl} className="social-pill">ВКонтакте</a>}
                  {user?.telegramUrl && <a href={user.telegramUrl} className="social-pill">Telegram</a>}
                  {user?.whatsapp && <a href={`https://wa.me/${user.whatsapp}`} className="social-pill">WhatsApp</a>}
                  {customSocials.map(s => <a key={s.id} href={s.url} className="social-pill">{s.name}</a>)}
                </Space>
                {selectedTopicLabels.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <Space wrap>{selectedTopicLabels.map(l => <Tag key={l} className="premium-tag">{l}</Tag>)}</Space>
                  </div>
                )}
              </div>

              <div className="section-card no-padding overflow-hidden">
                <Tabs centered items={[
                  { key: 'photos', label: `Фото (${photosCount})`, children: <ProfileGallery userId={user?.id} isOwner={true} onItemsCountChange={setPhotosCount} /> },
                  { key: 'gallery', label: `Работы (${artworksCount})`, children: <ArtworkGallery userId={user?.id} isOwner={true} onItemsCountChange={setArtworksCount} /> }
                ]} />
              </div>
            </div>
          ) : (
            <div className="settings-dashboard animated fadeIn">
              <ExpertStatusSection user={user} />
              <div className="settings-grid">
                <div className="settings-panel">
                  <ProfileEditForm 
                    user={user} form={form} cities={cities} topics={topics}
                    customSocials={customSocials} onSocialsUpdate={setCustomSocials}
                    onFinish={onFinish} loading={loading} isMobile={isMobile}
                    openMobileSelect={openMobileSelect} selectedCity={selectedCity}
                    selectedTopicsLabel={selectedTopicsLabel}
                    selectedConsultationTypesLabel={selectedConsultationTypesLabel}
                  />
                </div>
                {(user?.userType === 'expert' || user?.userType === 'admin') && (
                  <div className="settings-panel">
                    <ServiceManager user={user} services={services} onServicesUpdate={setServices} isMobile={isMobile} />
                    <Divider />
                    <ProductManager products={products} onProductsUpdate={setProducts} isMobile={isMobile} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {renderMobileSelectOverlay()}
      <ShareProfileModal visible={shareModalVisible} onClose={() => setShareModalVisible(false)} expert={user} />
    </>
  );
};

export default ProfilePage;
