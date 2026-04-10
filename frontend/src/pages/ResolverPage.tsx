import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getMarkets, type Market } from '../api/markets';
import { resolveMarket } from '../api/resolutions';

export default function ResolverPage() {
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['resolver-markets'],
    queryFn: () => getMarkets({ limit: 100 }),
    enabled: !!user && user.role === 'RESOLVER',
  });
  const allMarkets = data?.markets ?? [];
  const assignedMarkets = allMarkets.filter(
    (m) => m.resolverId === user?.id && (m.status === 'ACTIVE' || m.status === 'CLOSED'),
  );

  if (!user || user.role !== 'RESOLVER') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
          <p className="text-sm text-gray-500">
            {!user ? 'Please log in to access this page.' : 'You do not have resolver permissions.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Resolve Markets</h1>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-12">Loading...</p>
        ) : assignedMarkets.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No markets assigned to you for resolution.</p>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-2.5">Market</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Close Date</th>
                  <th className="px-5 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignedMarkets.map((market) => (
                  <tr key={market.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{market.title}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        market.status === 'CLOSED' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                      }`}>
                        {market.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(market.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelectedMarket(market)}
                        className="px-4 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg border-none cursor-pointer hover:bg-teal-700 transition-colors"
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Resolution Modal */}
      {selectedMarket && (
        <ResolutionModal
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
        />
      )}
    </div>
  );
}

function ResolutionModal({ market, onClose }: { market: Market; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [winningOptionId, setWinningOptionId] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [resolved, setResolved] = useState(false);

  const mutation = useMutation({
    mutationFn: () => resolveMarket(market.id, { winningOptionId, evidenceUrl, notes }),
    onSuccess: () => {
      setResolved(true);
      queryClient.invalidateQueries({ queryKey: ['resolver-markets'] });
    },
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Resolve Market</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {resolved ? (
            <div className="text-center py-6">
              <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Resolved</h3>
              <p className="text-sm text-gray-500 mb-5">Payouts have been triggered.</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-gray-800 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900 mb-4">{market.title}</p>

              <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
                {/* Winner */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">Winning Outcome</label>
                  <div className="flex gap-2">
                    {market.options.map((opt) => {
                      const isYes = opt.label === 'YES' || opt.label === 'Yes';
                      const selected = winningOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setWinningOptionId(opt.id)}
                          className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 cursor-pointer transition-all
                            ${selected
                              ? isYes ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700'
                              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                            }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Evidence */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Evidence URL</label>
                  <input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://source.com/article"
                    className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-teal-400 transition-colors"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reasoning for your verdict..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-teal-400 transition-colors resize-none"
                  />
                </div>

                {mutation.isError && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg text-center">Resolution failed.</p>
                )}

                <button
                  type="submit"
                  disabled={!winningOptionId || mutation.isPending}
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {mutation.isPending ? 'Submitting...' : 'Submit Resolution'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
