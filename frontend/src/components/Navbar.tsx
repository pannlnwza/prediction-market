import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Wallet, LogOut, Shield, BarChart3, Scale } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getBalance } from '../api/wallet';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);

  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: getBalance,
    enabled: !!user,
    refetchInterval: 10000,
  });

  const balance = walletData ? Number(walletData.balance).toFixed(2) : '—';

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        {/* Top bar */}
        <div className="max-w-[1400px] mx-auto px-6 flex items-center h-14 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline text-gray-900 shrink-0 active:scale-90 transition-transform duration-150">
            <span className="text-lg font-extrabold tracking-tight">Odds</span>
          </Link>

          <div className="flex-1" />

          {/* Right */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/portfolio"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 no-underline hover:text-gray-900 transition-colors px-2 py-1.5"
                >
                  <BarChart3 size={14} />
                  Portfolio
                </Link>

                {user.role === 'RESOLVER' && (
                  <Link
                    to="/resolver"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 no-underline hover:text-gray-900 transition-colors px-2 py-1.5"
                  >
                    <Scale size={14} />
                    Resolve
                  </Link>
                )}

                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 no-underline hover:text-gray-900 transition-colors px-2 py-1.5"
                  >
                    <Shield size={14} />
                    Admin
                  </Link>
                )}

                <Link
                  to="/wallet"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 no-underline hover:text-gray-900 transition-colors px-2 py-1.5"
                >
                  <Wallet size={14} />
                  <span className="font-semibold text-teal-700">${balance}</span>
                </Link>

                <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-600 font-medium hidden sm:block">
                  {user.displayName}
                </span>
                <button
                  onClick={logout}
                  className="p-1.5 text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors"
                  title="Log out"
                >
                  <LogOut size={15} />
                </button>
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
    </>
  );
}
