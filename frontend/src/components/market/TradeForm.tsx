import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { type MarketOption } from '../../api/markets';
import { placeOrder } from '../../api/orders';
import { getBalance } from '../../api/wallet';
import { formatCurrency } from './StatusBadge';

interface TradeFormProps {
  marketId: string;
  options: MarketOption[];
  marketStatus: string;
}

export function TradeForm({ marketId, options, marketStatus }: TradeFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const yesOption = options.find((o) => o.label === 'YES' || o.label === 'Yes');
  const noOption = options.find((o) => o.label === 'NO' || o.label === 'No');

  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: getBalance,
    enabled: !!user,
  });
  const walletBalance = walletData ? Math.floor(Number(walletData.balance)) : 0;

  const [activeTab, setActiveTab] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState(0);

  const selectedOption = activeTab === 'yes' ? yesOption : noOption;
  const price = selectedOption ? Number(selectedOption.currentPrice) : 0.5;
  const yesPrice = yesOption ? Number(yesOption.currentPrice) : 0.5;
  const noPrice = noOption ? Number(noOption.currentPrice) : 0.5;
  const shares = price > 0 ? Math.floor(amount / price) : 0;
  const actualCost = shares * price;
  const payout = shares * 1.0;
  const profit = payout - actualCost;
  const MAX_DIGITS = 6; // max 999,999

  function formatWithCommas(n: number): string {
    return n.toLocaleString('en-US');
  }

  const placeMutation = useMutation({
    mutationFn: placeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-book', marketId] });
      queryClient.invalidateQueries({ queryKey: ['my-orders', marketId] });
      queryClient.invalidateQueries({ queryKey: ['my-position', marketId] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['market', marketId] });
      setAmount(0);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOption || shares <= 0) return;
    placeMutation.mutate({ marketId, optionId: selectedOption.id, price, quantity: shares });
  }

  function addAmount(val: number) {
    setAmount((prev) => {
      const next = Math.max(0, prev + val);
      return next.toString().length <= MAX_DIGITS ? next : prev;
    });
  }

  if (!user) {
    return (
      <div className="border border-gray-200 rounded-2xl p-6 text-center">
        <p className="text-sm text-gray-500 mb-1">Log in to trade</p>
        <p className="text-xs text-gray-400">Create an account to start trading</p>
      </div>
    );
  }

  if (marketStatus !== 'ACTIVE') {
    return (
      <div className="border border-gray-200 rounded-2xl p-6 text-center">
        <p className="text-sm text-gray-500">This market is closed.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <span className="text-[15px] font-bold text-gray-900">Buy</span>
      </div>

      {/* Yes / No toggle */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('yes')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-colors
              ${activeTab === 'yes' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Yes {Math.round(yesPrice * 100)}¢
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('no')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-colors
              ${activeTab === 'no' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            No {Math.round(noPrice * 100)}¢
          </button>
        </div>
      </div>

      {/* Amount */}
      <div className="px-5 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Amount</span>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={amount ? `$${formatWithCommas(amount)}` : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, MAX_DIGITS);
                setAmount(parseInt(raw) || 0);
              }}
              placeholder="$0"
              className="text-3xl font-bold text-gray-900 bg-transparent border-none outline-none text-right w-[160px]"
            />
          </div>
        </div>

        {/* Quick add buttons */}
        <div className="flex gap-2">
          {[1, 5, 10, 100].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => addAmount(val)}
              className="flex-1 py-2 rounded-lg text-[13px] font-medium border border-gray-200 bg-white text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              +${formatWithCommas(val)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const max = walletBalance.toString().length <= MAX_DIGITS ? walletBalance : parseInt('9'.repeat(MAX_DIGITS));
              setAmount(max);
            }}
            className="px-3 py-2 rounded-lg text-[13px] font-medium border border-gray-200 bg-white text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            Max
          </button>
        </div>
      </div>

      {/* Summary */}
      {shares > 0 && (
        <div className="mx-5 mb-4 rounded-xl bg-gray-50 p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>{shares} shares @ {formatCurrency(price)}</span>
            <span className="text-gray-900 font-medium">{formatCurrency(actualCost)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Potential return</span>
            <span className="text-green-600 font-semibold">{formatCurrency(payout)} (+{formatCurrency(profit)})</span>
          </div>
        </div>
      )}

      {placeMutation.isError && (
        <p className="mx-5 mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-2 text-center">Failed. Check your balance.</p>
      )}
      {placeMutation.isSuccess && (
        <p className="mx-5 mb-3 text-sm text-green-600 bg-green-50 rounded-lg p-2 text-center">Order placed!</p>
      )}

      {/* Trade button */}
      <div className="px-5 pb-5">
        <button
          type="submit"
          disabled={shares <= 0 || placeMutation.isPending}
          className="w-full h-12 bg-teal-600 text-white text-base font-bold rounded-xl border-none cursor-pointer hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {placeMutation.isPending ? 'Placing...' : 'Trade'}
        </button>
      </div>
    </form>
  );
}
