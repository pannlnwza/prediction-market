import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getPortfolio, getOrders, cancelOrder, type Position, type Order } from '../api/orders';

function formatCurrency(val: number) { return `$${val.toFixed(2)}`; }

export default function PortfolioPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: positions = [], isLoading: posLoad } = useQuery({
    queryKey: ['portfolio'],
    queryFn: getPortfolio,
    enabled: !!user,
  });

  const { data: orders = [], isLoading: ordLoad } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
          <p className="text-sm text-gray-500">Please log in to view your portfolio.</p>
        </div>
      </div>
    );
  }

  const totalValue = positions.reduce((s, p) => s + p.quantity * Number(p.option?.currentPrice ?? 0), 0);
  const totalPnl = positions.reduce((s, p) => {
    return s + p.quantity * Number(p.option?.currentPrice ?? 0) - p.quantity * Number(p.avgPrice);
  }, 0);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Portfolio</h1>

        {/* Summary */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
          </div>
          <div className="flex-1 border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
            </p>
          </div>
        </div>

        {/* Positions */}
        <h2 className="text-base font-bold text-gray-900 mb-3">Positions</h2>
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-8">
          {posLoad ? (
            <p className="text-sm text-gray-400 text-center py-10">Loading...</p>
          ) : positions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No positions yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-2.5">Market</th>
                  <th className="px-5 py-2.5">Option</th>
                  <th className="px-5 py-2.5 text-right">Shares</th>
                  <th className="px-5 py-2.5 text-right">Avg Price</th>
                  <th className="px-5 py-2.5 text-right">Current</th>
                  <th className="px-5 py-2.5 text-right">Value</th>
                  <th className="px-5 py-2.5 text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => {
                  const avg = Number(pos.avgPrice);
                  const cur = Number(pos.option?.currentPrice ?? 0);
                  const value = pos.quantity * cur;
                  const pnl = value - pos.quantity * avg;
                  return (
                    <tr key={pos.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <Link to={`/market/${pos.marketId}`} className="text-gray-900 font-medium no-underline hover:text-teal-700">
                          {pos.market?.title ?? '—'}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold ${pos.option?.label === 'YES' ? 'text-green-600' : 'text-red-500'}`}>
                          {pos.option?.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-900 font-medium">{pos.quantity}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(avg)}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(cur)}</td>
                      <td className="px-5 py-3 text-right text-gray-900 font-medium">{formatCurrency(value)}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Orders */}
        <h2 className="text-base font-bold text-gray-900 mb-3">Order History</h2>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {ordLoad ? (
            <p className="text-sm text-gray-400 text-center py-10">Loading...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No orders yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-2.5">Market</th>
                  <th className="px-5 py-2.5">Option</th>
                  <th className="px-5 py-2.5 text-right">Price</th>
                  <th className="px-5 py-2.5 text-right">Qty</th>
                  <th className="px-5 py-2.5 text-right">Filled</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/market/${order.marketId}`} className="text-gray-900 font-medium no-underline hover:text-teal-700">
                        {order.market?.title ?? '—'}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold ${order.option?.label === 'YES' ? 'text-green-600' : 'text-red-500'}`}>
                        {order.option?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(Number(order.price))}</td>
                    <td className="px-5 py-3 text-right text-gray-900">{order.quantity}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{order.filledQuantity}/{order.quantity}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        order.status === 'FILLED' ? 'bg-green-50 text-green-700' :
                        order.status === 'OPEN' ? 'bg-blue-50 text-blue-700' :
                        order.status === 'PARTIALLY_FILLED' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {order.status === 'OPEN' && (
                        <button
                          onClick={() => cancelMutation.mutate(order.id)}
                          className="text-xs text-red-500 bg-transparent border-none cursor-pointer hover:text-red-700"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
