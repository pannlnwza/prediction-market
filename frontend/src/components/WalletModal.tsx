import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getBalance, deposit, withdraw } from '../api/wallet';
import Modal from './Modal';

interface WalletModalProps {
  onClose: () => void;
  initialTab?: 'deposit' | 'withdraw';
}

export default function WalletModal({ onClose, initialTab = 'deposit' }: WalletModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'deposit' | 'withdraw'>(initialTab);
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

  return (
    <Modal title="Wallet" onClose={onClose}>
      {/* Balance */}
      <div className="text-center mb-5">
        <p className="text-xs text-gray-500 mb-1">Available Balance</p>
        {isLoading ? (
          <p className="text-3xl font-bold text-gray-300">-</p>
        ) : (
          <p className="text-4xl font-extrabold text-gray-900">${balance}</p>
        )}
      </div>

      {message && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm text-center font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex mb-4 border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => { setTab('deposit'); setMessage(null); }}
          className={`flex-1 py-2.5 text-sm font-semibold border-none cursor-pointer transition-colors ${
            tab === 'deposit' ? 'bg-gray-100' : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => { setTab('withdraw'); setMessage(null); }}
          className={`flex-1 py-2.5 text-sm font-semibold border-none cursor-pointer transition-colors ${
            tab === 'withdraw' ? 'bg-gray-100' : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Withdraw
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Quick amounts */}
        <div className="flex gap-2 mb-3">
          {[10, 50, 100, 500].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setAmount((prev) => {
                const current = parseFloat(prev) || 0;
                return (current + val).toString();
              })}
              className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              +${val}
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
            className="flex-1 h-11 px-4 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none transition-colors"
            required
          />
          <button
            type="submit"
            disabled={isPending || !amount}
            className="h-11 px-6 rounded-lg text-sm font-semibold text-white border-none cursor-pointer transition-colors disabled:opacity-40 bg-teal-600 hover:bg-teal-700"
          >
            {isPending ? '...' : tab === 'deposit' ? 'Deposit' : 'Withdraw'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
