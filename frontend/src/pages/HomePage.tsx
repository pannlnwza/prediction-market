import { useState } from 'react';
import { Search, SlidersHorizontal, Bookmark, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import MarketCard from '../components/MarketCard';
import FeaturedMarket from '../components/FeaturedMarket';
import Footer from '../components/Footer';
import { getMarkets, type Market as ApiMarket } from '../api/markets';
import { mockMarkets, type Market as MockMarket } from '../data/mockMarkets';

const quickTopics = ['Oil Prices', 'Champions League Winner'];

const filterTabs = [
  'All', 'Trump', 'Iran', 'UCL', 'Oscars', 'Oil', 'NFL Free Agency',
  'Midterms', 'Epstein', 'Primaries', 'Tweet Markets', 'Daily Temperature',
  'Global Elections', 'Lebanon',
];

function toCardMarket(m: ApiMarket): MockMarket {
  return {
    id: m.id,
    title: m.title,
    category: 'General',
    status: m.status as MockMarket['status'],
    closeDate: m.closeDate,
    volume: 0,
    options: m.options.map((o) => ({
      id: o.id,
      label: o.label,
      currentPrice: Number(o.currentPrice),
    })),
  };
}

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState('All');

  const { data: apiMarkets } = useQuery({
    queryKey: ['markets'],
    queryFn: () => getMarkets('ACTIVE'),
    retry: false,
  });

  const markets: MockMarket[] = apiMarkets
    ? apiMarkets.map(toCardMarket)
    : mockMarkets;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6">
        {/* Featured Section */}
        <div className="py-6">
          <FeaturedMarket />
        </div>

        {/* Quick topic pills */}
        <div className="flex items-center gap-3 pb-6">
          {quickTopics.map((topic) => (
            <button
              key={topic}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {topic}
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          ))}
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white text-[13px] font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors ml-auto">
            Explore all
          </button>
        </div>

        {/* All Markets Header */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">All markets</h2>
            {apiMarkets && (
              <span className="text-[12px] text-gray-400">({apiMarkets.length} from API)</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600">
              <Search size={18} />
            </button>
            <button className="p-2 rounded-lg text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600">
              <SlidersHorizontal size={18} />
            </button>
            <button className="p-2 rounded-lg text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600">
              <Bookmark size={18} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-5 border-b border-gray-100 scrollbar-hide">
          {filterTabs.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap border cursor-pointer transition-colors
                ${activeFilter === filter
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Market Grid */}
        <div className="grid grid-cols-4 gap-4 pt-5 pb-8">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>

        {markets.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <Search size={24} className="text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No markets found</p>
          </div>
        )}

        {/* Show more button */}
        <div className="flex justify-center pb-10">
          <button className="px-8 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
            Show more markets
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
