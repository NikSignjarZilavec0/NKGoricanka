import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/PublicLayout.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Public pages
import HomePage from './pages/HomePage.jsx';
import NewsListPage from './pages/NewsListPage.jsx';
import NewsDetailPage from './pages/NewsDetailPage.jsx';
import PlayersPage from './pages/PlayersPage.jsx';
import PlayerDetailPage from './pages/PlayerDetailPage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import MatchDetailPage from './pages/MatchDetailPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LiveControlPage from './pages/LiveControlPage.jsx';

// Admin pages
import LoginPage from './pages/admin/LoginPage.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminNews from './pages/admin/AdminNews.jsx';
import AdminPlayers from './pages/admin/AdminPlayers.jsx';
import AdminMatches from './pages/admin/AdminMatches.jsx';
import AdminClub from './pages/admin/AdminClub.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public site */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<NewsListPage />} />
          <Route path="/news/:slug" element={<NewsDetailPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerDetailPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Live match control (contributor panel, standalone) */}
        <Route path="/live/:id" element={<LiveControlPage />} />

        {/* Admin */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="players" element={<AdminPlayers />} />
          <Route path="matches" element={<AdminMatches />} />
          <Route path="club" element={<AdminClub />} />
        </Route>
      </Routes>
    </>
  );
}
