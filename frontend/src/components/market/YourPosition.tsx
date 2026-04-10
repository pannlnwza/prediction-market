import { useQuery } from '@tanstack/react-query';
import { getMarketPosition, type Position } from '../../api/orders';
import { formatCurrency } from './StatusBadge';

export function YourPosition({ marketId }: { marketId: string }) {
  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ['my-position', marketId],
    queryFn: () => getMarketPosition(marketId),
  });

  if (positions.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Your Position</h3>
      {positions.map((pos) => {
        const currentPrice = Number(pos.option?.currentPrice ?? 0);
        const currentValue = pos.quantity * currentPrice;
        const cost = pos.quantity * Number(pos.avgPrice);
        const pnl = currentValue - cost;
        return (
          <div key={pos.id} className="flex items-center justify-between py-2">
            <div>
              <span className={`text-sm font-semibold ${pos.option?.label === 'YES' ? 'text-green-600' : 'text-red-500'}`}>
                {pos.option?.label}
              </span>
              <div className="text-xs text-gray-400">{pos.quantity} shares · avg {formatCurrency(Number(pos.avgPrice))}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{formatCurrency(currentValue)}</div>
              <div className={`text-[11px] font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
