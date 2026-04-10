import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Bookmark, Share2, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getMarket } from '../api/markets';
import { StatusBadge, formatDate } from '../components/market/StatusBadge';
import { PriceChart } from '../components/market/PriceChart';
import { TradeForm } from '../components/market/TradeForm';
import { YourPosition } from '../components/market/YourPosition';
import { YourOrders } from '../components/market/YourOrders';
import { MarketInfo } from '../components/market/MarketInfo';

export default function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: market, isLoading, isError } = useQuery({
    queryKey: ['market', id],
    queryFn: () => getMarket(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
          <p className="text-sm text-gray-500">Loading market...</p>
        </div>
      </div>
    );
  }

  if (isError || !market) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
          <p className="text-sm text-gray-500">Market not found.</p>
        </div>
      </div>
    );
  }

  const yesOption = market.options.find((o) => o.label === 'YES' || o.label === 'Yes');
  const yesPercent = yesOption ? Math.round(Number(yesOption.currentPrice) * 100) : 50;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 no-underline hover:text-gray-600 transition-colors mb-5">
          <ArrowLeft size={14} />
          Markets
        </Link>

        <div className="flex gap-8 items-start">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between mb-1">
              <h1 className="text-2xl font-bold text-gray-900 leading-snug">{market.title}</h1>
              <div className="flex gap-1.5 shrink-0 ml-4">
                <button className="p-2 rounded-lg text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600 transition-colors">
                  <Share2 size={16} />
                </button>
                <button className="p-2 rounded-lg text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600 transition-colors">
                  <Bookmark size={16} />
                </button>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-2 mb-5">
              <StatusBadge status={market.status} />
              {market.category && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                  {market.category}
                </span>
              )}
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar size={11} />
                {formatDate(market.closeDate)}
              </span>
            </div>

            {/* Big probability */}
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">
                {yesPercent}% chance
              </span>
            </div>

            {/* Chart */}
            <PriceChart yesPercent={yesPercent} />

            {/* Sections */}
            <div className="mt-6 space-y-5">
              <MarketInfo description={market.description ?? null} closeDate={market.closeDate} marketId={market.id} status={market.status} />
              {user && <YourOrders marketId={market.id} />}
            </div>
          </div>

          {/* Right column */}
          <div className="w-[340px] shrink-0 space-y-4 sticky top-20">
            <TradeForm marketId={market.id} options={market.options} marketStatus={market.status} />
            {user && <YourPosition marketId={market.id} />}
          </div>
        </div>
      </main>

    </div>
  );
}
