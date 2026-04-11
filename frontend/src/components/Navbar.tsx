import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Wallet, LogOut, Shield, Scale, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getBalance } from '../api/wallet';
import { getPortfolio } from '../api/orders';
import AuthModal from './AuthModal';
import NotificationBell from './NotificationBell';
import WalletModal from './WalletModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: getBalance,
    enabled: !!user,
    refetchInterval: 10000,
  });
  const balance = walletData ? Number(walletData.balance).toFixed(2) : '0.00';

  const { data: positions = [] } = useQuery({
    queryKey: ['portfolio'],
    queryFn: getPortfolio,
    enabled: !!user,
    refetchInterval: 10000,
  });
  const portfolioValue = positions.reduce((sum, p) => sum + p.quantity * Number(p.option?.currentPrice ?? 0), 0).toFixed(2);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center h-14 gap-4">
          <Link to="/" className="flex items-center gap-2 no-underline text-gray-900 shrink-0 active:scale-95 transition-transform duration-150">
            <img src="/logo.png" alt="Odds" className="h-18 active:scale-95" />
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/portfolio" className="text-center no-underline px-2 py-1 hover:bg-gray-50 rounded-lg transition-colors">
                  <p className="text-[11px] text-gray-500">Portfolio</p>
                  <p className="text-sm font-bold text-gray-900">${portfolioValue}</p>
                </Link>

                <button
                  onClick={() => setWalletOpen(true)}
                  className="text-center px-2 py-1 hover:bg-gray-50 rounded-lg transition-colors bg-transparent border-none cursor-pointer"
                >
                  <p className="text-[11px] text-gray-500">Balance</p>
                  <p className="text-sm font-bold text-gray-900">${balance}</p>
                </button>

                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="text-sm font-semibold text-white bg-teal-600 no-underline px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-1.5"
                  >
                    <Shield size={13} fill='white' />
                    Admin
                  </Link>
                )}

                {user.role === 'RESOLVER' && (
                  <Link
                    to="/resolver"
                    className="text-sm font-semibold text-white bg-teal-600 no-underline px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-1.5"
                  >
                    <Scale size={13} fill='white'/>
                    Resolve
                  </Link>
                )}

                <NotificationBell />

                <div className="w-px h-6 bg-gray-200" />

                {/* User dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 bg-transparent border-none cursor-pointer py-1 px-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-xs font-bold">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown size={12} className={`text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-11 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.displayName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/portfolio"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 no-underline hover:bg-gray-50 transition-colors"
                        >
                          <User size={14} className="text-gray-400" />
                          Portfolio
                        </Link>
                        <button
                          onClick={() => { setWalletOpen(true); setUserMenuOpen(false); }}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 bg-transparent border-none cursor-pointer w-full text-left hover:bg-gray-50 transition-colors"
                        >
                          <Wallet size={14} className="text-gray-400" />
                          Wallet
                        </button>
                        <button
                          onClick={logout}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 bg-transparent border-none cursor-pointer w-full text-left hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={14} />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAuthModal('login')}
                  className="text-sm font-medium text-gray-700 bg-transparent border-none cursor-pointer px-3 py-1.5"
                >
                  Log In
                </button>
                <button
                  onClick={() => setAuthModal('register')}
                  className="text-sm font-semibold text-white bg-teal-600 border-none cursor-pointer px-5 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
            <button className="p-2 bg-transparent border-none cursor-pointer text-gray-500 sm:hidden">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSwitch={() => setAuthModal(authModal === 'login' ? 'register' : 'login')}
        />
      )}

      {walletOpen && <WalletModal onClose={() => setWalletOpen(false)} />}
    </>
  );
}
