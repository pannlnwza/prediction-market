import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getBalance, deposit, withdraw } from '../api/wallet';

export default function WalletPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
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
      setAmount('');
    },
    onError: () => setMessage({ type: 'error', text: 'Deposit failed.' }),
  });

  const withdrawMutation = useMutation({
    mutationFn: withdraw,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      setMessage({ type: 'success', text: 'Withdrawal successful!' });
      setAmount('');
    },
    onError: () => setMessage({ type: 'error', text: 'Withdrawal failed. Insufficient balance?' }),
  });

  const balance = walletData ? Number(walletData.balance).toFixed(2) : '0.00';
  const isPending = depositMutation.isPending || withdrawMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setMessage(null);
    if (tab === 'deposit') depositMutation.mutate(value);
    else withdrawMutation.mutate(value);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
          <p className="text-sm text-gray-500">Please log in to access your wallet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-[500px] mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Wallet</h1>

        {/* Balance */}
        <div className="border border-gray-200 rounded-xl p-6 mb-6 text-center">
          <p className="text-xs text-gray-500 mb-1">Available Balance</p>
          {isLoading ? (
            <p className="text-4xl font-bold text-gray-300">—</p>
          ) : (
            <p className="text-5xl font-extrabold text-gray-900">${balance}</p>
          )}
        </div>

        {/* Toast */}
        {message && (
          <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm text-center font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Deposit / Withdraw */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setTab('deposit'); setMessage(null); }}
              className={`flex-1 py-3 text-sm font-semibold border-none cursor-pointer transition-colors ${
                tab === 'deposit' ? 'bg-white text-gray-900 border-b-2 border-b-teal-600' : 'bg-gray-50 text-gray-500'
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => { setTab('withdraw'); setMessage(null); }}
              className={`flex-1 py-3 text-sm font-semibold border-none cursor-pointer transition-colors ${
                tab === 'withdraw' ? 'bg-white text-gray-900 border-b-2 border-b-teal-600' : 'bg-gray-50 text-gray-500'
              }`}
            >
              Withdraw
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5">
            <div className="flex gap-2 mb-3">
              {[10, 50, 100, 500].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                    amount === val.toString()
                      ? 'bg-teal-50 border-teal-300 text-teal-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ${val}
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
                className="flex-1 h-11 px-4 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-teal-400 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={isPending || !amount}
                className={`h-11 px-6 rounded-lg text-sm font-semibold text-white border-none cursor-pointer transition-colors disabled:opacity-40 ${
                  tab === 'deposit' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isPending ? '...' : tab === 'deposit' ? 'Deposit' : 'Withdraw'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
