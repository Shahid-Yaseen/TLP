import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LaunchCenter from './pages/LaunchCenter';
import UpcomingLaunches from './pages/UpcomingLaunches';
import PreviousLaunches from './pages/PreviousLaunches';
import Homepage from './pages/Homepage';
import AboutUs from './pages/AboutUs';
import News from './pages/News';
import ArticleDetail from './pages/ArticleDetail';
import AstronautsList from './pages/spacebase/AstronautsList';
import AstronautProfile from './pages/spacebase/AstronautProfile';
import RocketsList from './pages/spacebase/RocketsList';
import EnginesList from './pages/spacebase/EnginesList';
import SpacecraftList from './pages/spacebase/SpacecraftList';
import FacilitiesList from './pages/spacebase/FacilitiesList';
import PadsList from './pages/spacebase/PadsList';
import AgenciesList from './pages/spacebase/AgenciesList';
import LaunchDetail from './pages/LaunchDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import EmailVerification from './pages/EmailVerification';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/launches/upcoming" replace />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/launches" element={<Navigate to="/launches/upcoming" replace />} />
        <Route path="/launches/upcoming" element={<UpcomingLaunches />} />
        <Route path="/launches/previous" element={<PreviousLaunches />} />
        <Route path="/launches/:id" element={<LaunchDetail />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<ArticleDetail />} />
        <Route path="/spacebase/astronauts" element={<AstronautsList />} />
        <Route path="/spacebase/astronauts/:id" element={<AstronautProfile />} />
        <Route path="/spacebase/rockets" element={<RocketsList />} />
        <Route path="/spacebase/engines" element={<EnginesList />} />
        <Route path="/spacebase/spacecraft" element={<SpacecraftList />} />
        <Route path="/spacebase/facilities" element={<FacilitiesList />} />
        <Route path="/spacebase/pads" element={<PadsList />} />
        <Route path="/spacebase/agencies" element={<AgenciesList />} />
        
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email/:token" element={<EmailVerification />} />
        
        {/* Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        
        {/* Placeholder routes for other pages */}
        <Route path="/briefing" element={<div className="min-h-screen bg-black text-white p-8">Mission Briefing (YouTube, Leaflet, etc.)</div>} />
        <Route path="/tlpedia" element={<div className="min-h-screen bg-black text-white p-8">TLPedia (search/faceted results)</div>} />
        <Route path="/navigator" element={<div className="min-h-screen bg-black text-white p-8">Earth Navigator (Cesium.js demo)</div>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
