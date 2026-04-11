import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import PortfolioPage from './pages/PortfolioPage';
import ResolverPage from './pages/ResolverPage';
import MarketDetailPage from './pages/MarketDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/market/:id" element={<MarketDetailPage />} />
        <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminPage /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
        <Route path="/resolver" element={<ProtectedRoute role="RESOLVER"><ResolverPage /></ProtectedRoute>} />
        <Route path="/wallet" element={<Navigate to="/portfolio" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
