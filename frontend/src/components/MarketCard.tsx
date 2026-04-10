import { Link } from 'react-router-dom';
import type { Market } from '../data/mockMarkets';

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(0)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  if (vol > 0) return `$${vol}`;
  return '';
}

export default function MarketCard({ market }: { market: Market }) {
  const yesOpt = market.options.find(o => o.label === 'Yes' || o.label === 'YES');
  const noOpt = market.options.find(o => o.label === 'No' || o.label === 'NO');
  const yesPercent = yesOpt ? Math.round(yesOpt.currentPrice * 100) : null;
  const noPercent = noOpt ? Math.round(noOpt.currentPrice * 100) : null;
  const hasYesNo = yesOpt && noOpt;

  return (
    <Link to={`/market/${market.id}`} className="border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow cursor-pointer flex flex-col no-underline text-inherit">
      {/* Title */}
      <div className="p-4 pb-3">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
          {market.title}
        </h3>
      </div>

      {/* Options */}
      <div className="px-4 flex-1">
        {hasYesNo ? (
          <>
            {/* Percentage + progress */}
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-lg font-bold text-gray-900">{yesPercent}%</span>
              <span className="text-[11px] text-gray-400">chance</span>
            </div>

            {/* Yes / No buttons */}
            <div className="flex gap-1.5">
              <button className="flex-1 bg-green-50 text-green-600 py-1.5 rounded-md text-[13px] font-semibold border-none cursor-pointer hover:bg-green-600 hover:text-white transition-colors">
                Yes {yesPercent}¢
              </button>
              <button className="flex-1 bg-red-50 text-red-600 py-1.5 rounded-md text-[13px] font-semibold border-none cursor-pointer hover:bg-red-600 hover:text-white transition-colors">
                No {noPercent}¢
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {market.options.map((opt) => {
              const pct = Math.round(opt.currentPrice * 100);
              return (
                <div key={opt.id} className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-gray-700 font-medium truncate flex-1">{opt.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-gray-900">{pct}%</span>
                    <button className="bg-green-50 text-green-600 px-2.5 py-0.5 rounded-md text-xs font-semibold border-none cursor-pointer hover:bg-green-600 hover:text-white transition-colors">
                      Yes
                    </button>
                    <button className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-md text-xs font-semibold border-none cursor-pointer hover:bg-red-600 hover:text-white transition-colors">
                      No
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 mt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {formatVolume(market.volume)}{market.volume > 0 ? ' Vol.' : ''}
        </span>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (navigator.share) {
              navigator.share({ title: market.title, url: `${window.location.origin}/market/${market.id}` });
            } else {
              navigator.clipboard.writeText(`${window.location.origin}/market/${market.id}`);
            }
          }}
          className="text-gray-300 hover:text-gray-500 bg-transparent border-none cursor-pointer transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>
    </Link>
  );
}
