import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { getBalance, deposit, withdraw } from '../api/wallet';

function AmountAction({
  label,
  icon,
  variant,
  onSubmit,
  isPending,
}: {
  label: string;
  icon: React.ReactNode;
  variant: 'up' | 'down';
  onSubmit: (amount: number) => void;
  isPending: boolean;
}) {
  const [amount, setAmount] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (value > 0) {
      onSubmit(value);
      setAmount('');
    }
  }

  const presets = [10, 50, 100, 500];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      {/* Presets */}
      <div className="flex gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p.toString())}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors
              ${amount === p.toString()
                ? 'bg-teal-50 border-teal-400 text-teal-700'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
          >
            ${p}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="flex-1 h-11 px-4 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-teal-400 transition-colors"
          required
        />
        <button
          type="submit"
          disabled={isPending || !amount}
          className={`h-11 px-6 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed
            ${variant === 'up' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {isPending ? '...' : label}
        </button>
      </div>
    </form>
  );
}

export default function WalletPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: walletData, isLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: getBalance,
    enabled: !!user,
  });

  const depositMutation = useMutation({
    mutationFn: deposit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      setMessage({ type: 'success', text: 'Deposit successful!' });
    },
    onError: () => setMessage({ type: 'error', text: 'Deposit failed. Please try again.' }),
  });

  const withdrawMutation = useMutation({
    mutationFn: withdraw,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      setMessage({ type: 'success', text: 'Withdrawal successful!' });
    },
    onError: () => setMessage({ type: 'error', text: 'Withdrawal failed. Insufficient balance?' }),
  });

  const balance = walletData ? Number(walletData.balance).toFixed(2) : '0.00';

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-5 py-20 text-center">
          <p className="text-sm text-gray-500">Please log in to access your wallet.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-md mx-auto px-5 py-12">
        {/* Balance card */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-5 text-center relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-transparent to-green-50 pointer-events-none" />

          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Wallet size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-500">Your Balance</span>
            </div>
            {isLoading ? (
              <p className="text-4xl font-bold text-gray-400">--</p>
            ) : (
              <div className="flex items-center justify-center gap-1">
                <span className="text-gray-400 text-2xl">$</span>
                <span className="text-5xl font-bold text-gray-900 tracking-tight">{balance}</span>
              </div>
            )}
            <div className="flex items-center justify-center gap-1 mt-2">
              <Sparkles size={12} className="text-amber-500" />
              <span className="text-[11px] text-gray-500">Platform Credits</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <AmountAction
            label="Deposit"
            icon={<ArrowDownToLine size={14} className="text-green-600" />}
            variant="up"
            onSubmit={(amount) => {
              setMessage(null);
              depositMutation.mutate(amount);
            }}
            isPending={depositMutation.isPending}
          />

          <div className="border-t border-gray-200" />

          <AmountAction
            label="Withdraw"
            icon={<ArrowUpFromLine size={14} className="text-red-600" />}
            variant="down"
            onSubmit={(amount) => {
              setMessage(null);
              withdrawMutation.mutate(amount);
            }}
            isPending={withdrawMutation.isPending}
          />

          {message && (
            <p className={`text-sm text-center px-3 py-2 rounded-lg ${
              message.type === 'success' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
            }`}>
              {message.text}
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
