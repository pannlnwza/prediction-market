import { Bookmark, Copy, ExternalLink } from 'lucide-react';
import type { Market } from '../data/mockMarkets';

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(0)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol}`;
}

interface MarketCardProps {
  market: Market;
}

export default function MarketCard({ market }: MarketCardProps) {
  const hasYesNo = market.options.some(o => o.label === 'Yes' || o.label === 'YES');

  return (
    <div className="border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow cursor-pointer flex flex-col">
      {/* Title row */}
      <div className="p-3.5 pb-2.5 flex gap-2.5 items-start">
        {market.icon && (
          <span className="text-xl shrink-0 mt-0.5">{market.icon}</span>
        )}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug flex-1 line-clamp-2">
          {market.title}
        </h3>
        {market.liveLabel && !hasYesNo && (
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: market.isLive
                ? 'conic-gradient(#16a34a 0%, #16a34a 51%, #dc2626 51%, #dc2626 100%)'
                : 'conic-gradient(#6366f1 0%, #6366f1 30%, #e5e7eb 30%)',
            }}>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-gray-900">{market.liveLabel}</span>
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="px-3.5 flex-1">
        {hasYesNo ? (
          <div className="flex gap-1.5 mt-1">
            <button className="flex-1 bg-green-600 text-white border-none py-1.5 px-5 rounded-md text-[13px] font-semibold cursor-pointer hover:bg-green-700 transition-colors">
              Yes
            </button>
            <button className="flex-1 bg-red-600 text-white border-none py-1.5 px-5 rounded-md text-[13px] font-semibold cursor-pointer hover:bg-red-700 transition-colors">
              No
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {market.options.map((opt) => (
              <div key={opt.id} className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-gray-700 font-medium truncate flex-1">
                  {opt.label}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-sm font-bold text-gray-900">
                    {Math.round(opt.currentPrice * 100)}%
                  </span>
                  <button className="bg-green-100 text-green-600 px-2.5 py-0.5 rounded-md text-xs font-semibold border-none cursor-pointer hover:bg-green-600 hover:text-white transition-colors">
                    Yes
                  </button>
                  <button className="bg-red-100 text-red-600 px-2.5 py-0.5 rounded-md text-xs font-semibold border-none cursor-pointer hover:bg-red-600 hover:text-white transition-colors">
                    No
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extra info */}
      {market.extraInfo && (
        <p className={`px-3.5 pt-1.5 text-[11px] font-medium ${market.extraInfo.includes('LIVE') ? 'text-green-600' : 'text-gray-400'}`}>
          {market.extraInfo}
        </p>
      )}

      {/* Footer */}
      <div className="px-3.5 py-2.5 mt-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] text-gray-400 font-medium">
          {formatVolume(market.volume)} Vol.
        </span>
        <div className="flex gap-1.5">
          <Bookmark size={13} className="text-gray-300 cursor-pointer hover:text-gray-500 transition-colors" />
          <Copy size={13} className="text-gray-300 cursor-pointer hover:text-gray-500 transition-colors" />
          <ExternalLink size={13} className="text-gray-300 cursor-pointer hover:text-gray-500 transition-colors" />
        </div>
      </div>
    </div>
  );
}
