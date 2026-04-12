import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { type Market } from '../api/markets';
import { resolveMarket } from '../api/resolutions';

interface ResolutionModalProps {
  market: Market;
  onClose: () => void;
}

export default function ResolutionModal({ market, onClose }: ResolutionModalProps) {
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
              <h3 className="text-lg font-bold text-gray-900 mb-1">Resolved</h3>
              <p className="text-sm text-gray-500 mb-5">Payouts have been triggered.</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-teal-700 transition-colors"
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
                          className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 cursor-pointer transition-all
                            ${selected
                              ? isYes ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
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
                    className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors"
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
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors resize-none"
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
