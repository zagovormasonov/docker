import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ExpertsPage from './pages/ExpertsPage';
import ExpertProfilePage from './pages/ExpertProfilePage';
import ArticlePage from './pages/ArticlePage';
import ProfilePage from './pages/ProfilePage';
import ChatsPage from './pages/ChatsPage';
import CreateArticlePage from './pages/CreateArticlePage';
import MyArticlesPage from './pages/MyArticlesPage';
import ArchivedArticlesPage from './pages/ArchivedArticlesPage';
import FavoritesPage from './pages/FavoritesPage';
import EventsPage from './pages/EventsPage';
import EventPage from './pages/EventPage';
import CreateEventPage from './pages/CreateEventPage';
import ModerationPage from './pages/ModerationPage';
import AdminPanel from './pages/AdminPanel';
import AdminLogsPage from './pages/AdminLogsPage';
import OfertaPage from './pages/OfertaPage';
import PrivacyPage from './pages/PrivacyPage';
import UserAgreementPage from './pages/UserAgreementPage';
import BecomeExpertPage from './pages/BecomeExpertPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import ExpertLandingPage from './pages/ExpertLandingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import ExpertDashboardPage from './pages/ExpertDashboardPage';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import './App.css';
import './styles/dark-theme.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return <div>Загрузка...</div>;
  }
  
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const AppContent = () => {
  const { isDark } = useTheme();

  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          colorBgBase: isDark ? '#0f172a' : '#fafafa',
          colorTextBase: isDark ? '#f8fafc' : '#1d1d1f',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      }}
    >
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/expert-landing" element={<ExpertLandingPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="experts" element={<ExpertsPage />} />
                <Route path="experts/:id" element={<ExpertProfilePage />} />
                <Route path="articles/:id" element={<ArticlePage />} />
                
                <Route path="events" element={<EventsPage />} />
                <Route path="events/:id" element={<EventPage />} />
                <Route path="events/create" element={<ProtectedRoute><CreateEventPage /></ProtectedRoute>} />
                <Route path="events/edit/:id" element={<ProtectedRoute><CreateEventPage /></ProtectedRoute>} />
                
                <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
                <Route path="my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
                <Route path="expert-dashboard" element={<ProtectedRoute><ExpertDashboardPage /></ProtectedRoute>} />
                <Route path="chats" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
                <Route path="chats/:chatId" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
                <Route path="create-article" element={<ProtectedRoute><CreateArticlePage /></ProtectedRoute>} />
                <Route path="edit-article/:id" element={<ProtectedRoute><CreateArticlePage /></ProtectedRoute>} />
                <Route path="my-articles" element={<ProtectedRoute><MyArticlesPage /></ProtectedRoute>} />
                <Route path="archived-articles" element={<ProtectedRoute><ArchivedArticlesPage /></ProtectedRoute>} />
                <Route path="moderation" element={<ProtectedRoute><ModerationPage /></ProtectedRoute>} />
                <Route path="admin-panel" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                <Route path="admin-logs" element={<ProtectedRoute><AdminLogsPage /></ProtectedRoute>} />
                <Route path="offer" element={<OfertaPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="user-agreement" element={<UserAgreementPage />} />
                <Route path="become-expert" element={<BecomeExpertPage />} />
                <Route path="payment-success" element={<PaymentSuccessPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
