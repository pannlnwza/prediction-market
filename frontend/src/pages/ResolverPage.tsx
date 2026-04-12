import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/admin/Pagination';
import ResolutionModal from '../components/ResolutionModal';
import { getMarkets, type Market } from '../api/markets';

const PAGE_SIZE = 15;

export default function ResolverPage() {
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['resolver-markets'],
    queryFn: () => getMarkets({ limit: 100 }),
    enabled: !!user && user.role === 'RESOLVER',
  });
  const allMarkets = data?.markets ?? [];
  const assignedMarkets = allMarkets.filter(
    (m) => m.resolverId === user?.id && (m.status === 'ACTIVE' || m.status === 'CLOSED'),
  );

  return (
    <div className="min-h-screen bg-white">

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Resolve Markets</h1>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-12">Loading...</p>
        ) : assignedMarkets.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No markets assigned to you for resolution.</p>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-800 text-sm font-semibold">
                  <th className="py-3 w-[45%]">Market</th>
                  <th className="px-5 py-3 w-[15%]">Status</th>
                  <th className="px-5 py-3 w-[20%]">Close Date</th>
                  <th className="px-5 py-3 text-right w-[20%]">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignedMarkets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((market) => (
                  <tr key={market.id} className="border-t border-gray-100 transition-colors">
                    <td className="py-3 font-medium text-gray-900 truncate">{market.title}</td>
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
            <Pagination current={page} total={Math.ceil(assignedMarkets.length / PAGE_SIZE)} onChange={setPage} />
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
