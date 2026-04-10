import { useState } from 'react';
import { X, Percent } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitch: () => void;
}

export default function AuthModal({ mode, onClose, onSwitch }: AuthModalProps) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative bg-white rounded-2xl w-full max-w-sm mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg font-bold text-gray-900">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="h-11 px-4 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 px-4 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-11 px-4 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white"
            />

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-lg bg-teal-600 text-white font-semibold text-sm border-none cursor-pointer hover:bg-teal-700 transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? '...' : mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={onSwitch}
              className="text-teal-600 font-medium bg-transparent border-none cursor-pointer hover:underline"
            >
              {mode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
