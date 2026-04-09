import { useState } from 'react';
import { Search, SlidersHorizontal, Bookmark, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import MarketCard from '../components/MarketCard';
import FeaturedMarket from '../components/FeaturedMarket';
import Footer from '../components/Footer';
import { mockMarkets } from '../data/mockMarkets';

const quickTopics = ['Oil Prices', 'Champions League Winner'];

const filterTabs = [
  'All', 'Trump', 'Iran', 'UCL', 'Oscars', 'Oil', 'NFL Free Agency',
  'Midterms', 'Epstein', 'Primaries', 'Tweet Markets', 'Daily Temperature',
  'Global Elections', 'Lebanon',
];

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState('All');

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
          <h2 className="text-xl font-bold text-gray-900">All markets</h2>
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
                  ? 'bg-blue-800 text-white border-blue-800'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Market Grid - 4 columns */}
        <div className="grid grid-cols-4 gap-4 pt-5 pb-8">
          {mockMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>

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
