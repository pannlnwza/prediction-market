import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { type MarketOption } from '../../api/markets';
import { placeOrder } from '../../api/orders';
import { getBalance } from '../../api/wallet';
interface TradeFormProps {
  marketId: string;
  options: MarketOption[];
  marketStatus: string;
}

function formatCredits(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  const [searchParams] = useSearchParams();
  const initialSide = searchParams.get('side') === 'no' ? 'no' : 'yes';
  const [activeTab, setActiveTab] = useState<'yes' | 'no'>(initialSide);
  const [amount, setAmount] = useState(0);
  const [customPrice, setCustomPrice] = useState('');

  const yesPrice = yesOption ? Number(yesOption.currentPrice) : 0.5;
  const noPrice = noOption ? Number(noOption.currentPrice) : 0.5;
  const defaultPrice = activeTab === 'yes' ? yesPrice : noPrice;
  const price = customPrice ? parseFloat(customPrice) : defaultPrice;
  const shares = price > 0 && price <= 0.99 ? Math.floor(amount / price) : 0;
  const actualCost = shares * price;
  const payout = shares * 1.0;
  const profit = payout - actualCost;
  const MAX_DIGITS = 6;

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
    if (!activeTab || shares <= 0) return;
    const selectedOption = activeTab === 'yes' ? yesOption : noOption;
    if (!selectedOption) return;
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
      <div className="px-5 pt-4 pb-3">
        <span className="text-[15px] font-bold text-gray-900">Buy</span>
      </div>

      {/* Yes / No toggle */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('yes'); setCustomPrice(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-colors
              ${activeTab === 'yes' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Yes {Math.round(yesPrice * 100)}¢
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('no'); setCustomPrice(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-colors
              ${activeTab === 'no' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            No {Math.round(noPrice * 100)}¢
          </button>
        </div>
      </div>

      {/* Share price */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Share price</span>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-400">$</span>
            <input
              type="number"
              min="0.01"
              max="0.99"
              step="0.01"
              value={customPrice || defaultPrice.toFixed(2)}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="w-18 h-8 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 text-right outline-none transition-colors"
            />
          </div>
        </div>
        {customPrice && parseFloat(customPrice) !== defaultPrice && (
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={() => setCustomPrice('')}
              className="text-[11px] text-teal-600 bg-transparent border-none cursor-pointer hover:underline p-0"
            >
              Reset to ${defaultPrice.toFixed(2)}
            </button>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="px-5 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Amount</span>
          <div className="flex items-center">
            <input
              type="text"
              inputMode="numeric"
              value={amount ? `$${amount.toLocaleString('en-US')}` : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, MAX_DIGITS);
                setAmount(parseInt(raw) || 0);
              }}
              placeholder="$0"
              className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none text-right w-[140px]"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {[1, 5, 10, 100].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => addAmount(val)}
              className="flex-1 py-2 rounded-lg text-[13px] font-medium border border-gray-200 bg-white text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              +${val}
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
        <div className="mx-5 mb-5 rounded-xl bg-gray-50 p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{shares} shares</p>
              <p className="text-xs text-gray-400 mt-0.5">@ {Math.round(price * 100)}¢ per share</p>
            </div>
            <p className="text-lg font-bold text-gray-900">${formatCredits(actualCost)}</p>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <p className="text-xs text-gray-500">Potential return</p>
            <div className="text-right">
              <p className="text-base font-bold text-green-600">${formatCredits(payout)}</p>
              <p className="text-[11px] text-green-500">+${formatCredits(profit)} profit</p>
            </div>
          </div>
        </div>
      )}

      {placeMutation.isError && (
        <p className="mx-5 mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-2 text-center">Failed. Check your balance.</p>
      )}
      {placeMutation.isSuccess && (
        <p className="mx-5 mb-3 text-sm text-green-600 bg-green-50 rounded-lg p-2 text-center">Order placed!</p>
      )}

      {/* Buy button */}
      <div className="px-5 pb-5">
        <button
          type="submit"
          disabled={shares <= 0 || placeMutation.isPending}
          className={`w-full h-12 text-white text-sm font-bold rounded-xl border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed
            bg-teal-600 hover:bg-teal-700`}
        >
          {placeMutation.isPending ? 'Placing...' : `Buy ${activeTab === 'yes' ? 'Yes' : 'No'}`}
        </button>
      </div>
    </form>
  );
}
