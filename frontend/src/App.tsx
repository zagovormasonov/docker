import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout';
import './App.css';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ExpertsPage = lazy(() => import('./pages/ExpertsPage'));
const ExpertProfilePage = lazy(() => import('./pages/ExpertProfilePage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ChatsPage = lazy(() => import('./pages/ChatsPage'));
const CreateArticlePage = lazy(() => import('./pages/CreateArticlePage'));
const MyArticlesPage = lazy(() => import('./pages/MyArticlesPage'));
const MyEventsPage = lazy(() => import('./pages/MyEventsPage'));
const ArchivedArticlesPage = lazy(() => import('./pages/ArchivedArticlesPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventPage = lazy(() => import('./pages/EventPage'));
const CreateEventPage = lazy(() => import('./pages/CreateEventPage'));
const EventsFilterPage = lazy(() => import('./pages/EventsFilterPage'));
const ModerationPage = lazy(() => import('./pages/ModerationPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminLogsPage = lazy(() => import('./pages/AdminLogsPage'));
const OfertaPage = lazy(() => import('./pages/OfertaPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const UserAgreementPage = lazy(() => import('./pages/UserAgreementPage'));
const BecomeExpertPage = lazy(() => import('./pages/BecomeExpertPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const ExpertLandingPage = lazy(() => import('./pages/ExpertLandingPage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));
const ExpertDashboardPage = lazy(() => import('./pages/ExpertDashboardPage'));
const LoyaltyPage = lazy(() => import('./pages/LoyaltyPage'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      }}
    >
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="app-route-loading">Загрузка...</div>}>
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
                  <Route path="events/filters" element={<EventsFilterPage />} />
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
                  <Route path="my-events" element={<ProtectedRoute><MyEventsPage /></ProtectedRoute>} />
                  <Route path="archived-articles" element={<ProtectedRoute><ArchivedArticlesPage /></ProtectedRoute>} />
                  <Route path="moderation" element={<ProtectedRoute><ModerationPage /></ProtectedRoute>} />
                  <Route path="admin-panel" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                  <Route path="admin-logs" element={<ProtectedRoute><AdminLogsPage /></ProtectedRoute>} />
                  <Route path="offer" element={<OfertaPage />} />
                  <Route path="privacy" element={<PrivacyPage />} />
                  <Route path="user-agreement" element={<UserAgreementPage />} />
                  <Route path="terms" element={<UserAgreementPage />} />
                  <Route path="become-expert" element={<BecomeExpertPage />} />
                  <Route path="loyalty" element={<LoyaltyPage />} />
                  <Route path="payment-success" element={<PaymentSuccessPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
