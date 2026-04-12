import { useState } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import MarketCard from '../components/MarketCard';
import { getMarkets, type Market } from '../api/markets';

const PAGE_SIZE = 18;

const categories = [
  'All', 'Politics', 'Crypto', 'Sports', 'Finance', 'Tech', 'Science',
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading } = useQuery({
    queryKey: ['markets', activeCategory, search],
    queryFn: () => getMarkets({
      status: 'ACTIVE',
      category: activeCategory === 'All' ? undefined : activeCategory,
      search: search || undefined,
      limit: 200,
    }),
    retry: false,
  });

  const allMarkets = data?.markets ?? [];
  const markets = allMarkets.slice(0, visibleCount);
  const hasMore = visibleCount < allMarkets.length;

  function changeCategory(cat: string) {
    setActiveCategory(cat);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex gap-8">
          {/* Left sidebar */}
          <div className="w-[180px] shrink-0">
            <div className="sticky top-20 space-y-0.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => changeCategory(cat)}
                  className={`w-full text-left px-3 py-3 rounded-lg text-sm border-none cursor-pointer transition-colors font-semibold
                    ${activeCategory === cat
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Right — market grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeCategory === 'All' ? 'All Markets' : activeCategory}
                {allMarkets.length > 0 && (
                  <span className="text-sm font-normal text-gray-400 ml-2">{allMarkets.length}</span>
                )}
              </h1>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
                  placeholder="Search..."
                  className="h-9 w-92 pl-8 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none transition-colors"
                />
              </div>
            </div>

            {isLoading ? (
              <p className="text-sm text-gray-400 text-center py-20">Loading markets...</p>
            ) : markets.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <Search size={24} className="text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">No markets found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  {markets.map((market: Market) => (
                    <MarketCard
                      key={market.id}
                      market={{
                        id: market.id,
                        title: market.title,
                        category: market.category,
                        status: market.status as 'ACTIVE' | 'CLOSED' | 'RESOLVED' | 'VOIDED',
                        closeDate: market.closeDate,
                        volume: market.volume ?? 0,
                        options: market.options.map((o) => ({
                          id: o.id,
                          label: o.label,
                          currentPrice: Number(o.currentPrice),
                        })),
                      }}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-8 pb-4">
                    <button
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="px-8 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50 shrink-0 active:scale-98 transition-transform duration-150"
                    >
                      Show more markets
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="py-8 text-center">
        <div className="flex items-center justify-center gap-2 opacity-30">
          <img src="/logo.png" alt="Odds" className="h-12" />
          <span className="text-xs text-gray-500">Prediction Market</span>
        </div>
      </footer>
    </div>
  );
}
