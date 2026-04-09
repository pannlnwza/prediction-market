import { Bookmark, Copy, ExternalLink } from 'lucide-react';
import type { Market } from '../data/mockMarkets';

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(0)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  if (vol > 0) return `$${vol}`;
  return '';
}

interface MarketCardProps {
  market: Market;
}

export default function MarketCard({ market }: MarketCardProps) {
  const hasYesNo = market.options.some(o => o.label === 'Yes' || o.label === 'YES');
  const yesOpt = market.options.find(o => o.label === 'Yes' || o.label === 'YES');
  const yesPercent = yesOpt ? Math.round(yesOpt.currentPrice * 100) : null;

  return (
    <div className="border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow cursor-pointer flex flex-col">
      {/* Title row */}
      <div className="p-3.5 pb-2.5 flex gap-2.5 items-start">
        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-lg">
          {market.icon || market.title.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug flex-1 line-clamp-2">
            {market.title}
          </h3>
        </div>
        {/* Percentage circle for live/special markets */}
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

      {/* Percentage bar for yes/no markets */}
      {hasYesNo && yesPercent !== null && (
        <div className="px-3.5 mb-2">
          <div className="flex items-baseline gap-1 mb-1.5">
            <span className="text-lg font-bold text-gray-900">{yesPercent}%</span>
            <span className="text-[11px] text-gray-400 font-medium">chance</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${yesPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Options */}
      <div className="px-3.5 flex-1">
        {hasYesNo ? (
          <div className="flex gap-1.5 mt-1">
            <button className="flex-1 bg-green-50 text-green-600 py-1.5 px-5 rounded-md text-[13px] font-semibold border-none cursor-pointer hover:bg-green-600 hover:text-white transition-colors">
              Yes {yesPercent}¢
            </button>
            <button className="flex-1 bg-red-50 text-red-600 py-1.5 px-5 rounded-md text-[13px] font-semibold border-none cursor-pointer hover:bg-red-600 hover:text-white transition-colors">
              No {yesPercent !== null ? 100 - yesPercent : ''}¢
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
                  <button className="bg-green-50 text-green-600 px-2.5 py-0.5 rounded-md text-xs font-semibold border-none cursor-pointer hover:bg-green-600 hover:text-white transition-colors">
                    Yes
                  </button>
                  <button className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-md text-xs font-semibold border-none cursor-pointer hover:bg-red-600 hover:text-white transition-colors">
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
          {formatVolume(market.volume)}{market.volume > 0 ? ' Vol.' : ''}
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
