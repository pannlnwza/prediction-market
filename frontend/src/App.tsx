import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import WalletPage from './pages/WalletPage';
import PortfolioPage from './pages/PortfolioPage';
import ResolverPage from './pages/ResolverPage';
import MarketDetailPage from './pages/MarketDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/market/:id" element={<MarketDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/resolver" element={<ResolverPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
