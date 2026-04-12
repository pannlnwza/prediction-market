import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getPortfolio, getOrders } from '../api/orders';
import { getBalance } from '../api/wallet';
import { formatCurrency } from '../utils/format';
import WalletModal from '../components/WalletModal';
import PositionsTab from '../components/portfolio/PositionsTab';
import OrdersTab from '../components/portfolio/OrdersTab';

type Tab = 'positions' | 'orders';

export default function PortfolioPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('positions');
  const [walletOpen, setWalletOpen] = useState(false);

  const { data: positions = [] } = useQuery({
    queryKey: ['portfolio'],
    queryFn: getPortfolio,
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
    enabled: !!user,
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: getBalance,
    enabled: !!user,
  });
  const cash = walletData ? Number(walletData.balance) : 0;

  const totalValue = positions.reduce((s, p) => s + p.quantity * Number(p.option?.currentPrice ?? 0), 0);
  const totalPnl = positions.reduce((s, p) => {
    return s + p.quantity * Number(p.option?.currentPrice ?? 0) - p.quantity * Number(p.avgPrice);
  }, 0);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Portfolio</h1>

        {/* Summary */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">Portfolio Value</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
          </div>
          <div className="flex-1 border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
            </p>
          </div>
          <div className="flex-1 border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <p className="text-xs text-gray-500 mb-1">Balance</p>
              <button
                onClick={() => setWalletOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 border-none rounded-xl cursor-pointer hover:bg-teal-700 transition-colors"
              >
                Deposit/Withdraw
              </button>
            </div>
            <button
              onClick={() => setWalletOpen(true)}
              className="text-2xl font-bold text-gray-900 bg-transparent border-none cursor-pointer p-0 text-left hover:text-teal-700 transition-colors"
            >
              {formatCurrency(cash)}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 mb-6">
          {(['positions', 'orders'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2.5 text-sm font-medium border-b-2 bg-transparent cursor-pointer transition-colors
                ${tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'orders' ? 'Order History' : 'Positions'}
            </button>
          ))}
        </div>

        {tab === 'positions' && <PositionsTab positions={positions} />}
        {tab === 'orders' && <OrdersTab orders={orders} />}

      </main>

      {walletOpen && <WalletModal onClose={() => setWalletOpen(false)} />}
    </div>
  );
}

