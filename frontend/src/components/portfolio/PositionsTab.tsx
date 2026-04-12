import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pagination } from '../admin/Pagination';
import { formatCurrency } from '../../utils/format';
import type { Position } from '../../api/orders';

const PAGE_SIZE = 15;

interface PositionsTabProps {
  positions: Position[];
}

export default function PositionsTab({ positions }: PositionsTabProps) {
  const [page, setPage] = useState(0);

  if (positions.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <p className="text-sm text-gray-400 text-center py-10">No positions yet</p>
      </div>
    );
  }

  const totalPages = Math.ceil(positions.length / PAGE_SIZE);
  const pageItems = positions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="text-left text-sm font-semibold text-gray-800">
              <th className="py-2.5 w-[35%]">Market</th>
              <th className="px-5 py-2.5 w-[10%]">Option</th>
              <th className="px-5 py-2.5 text-right w-[10%]">Shares</th>
              <th className="px-5 py-2.5 text-right w-[12%]">Avg Price</th>
              <th className="px-5 py-2.5 text-right w-[11%]">Current</th>
              <th className="px-5 py-2.5 text-right w-[11%]">Value</th>
              <th className="px-5 py-2.5 text-right w-[11%]">P&L</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((pos) => {
              const avg = Number(pos.avgPrice);
              const cur = Number(pos.option?.currentPrice ?? 0);
              const value = pos.quantity * cur;
              const pnl = value - pos.quantity * avg;
              return (
                <tr key={pos.id} className="border-t border-gray-100 transition-colors">
                  <td className="py-3">
                    <Link to={`/market/${pos.marketId}`} className="text-gray-900 font-medium no-underline hover:text-teal-700 block truncate">
                      {pos.market?.title ?? '—'}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold ${pos.option?.label === 'YES' ? 'text-green-600' : 'text-red-500'}`}>
                      {pos.option?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-900 font-medium">{pos.quantity}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(avg)}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(cur)}</td>
                  <td className="px-5 py-3 text-right text-gray-900 font-medium">{formatCurrency(value)}</td>
                  <td className={`px-5 py-3 text-right font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      {positions.length > PAGE_SIZE && (
        <Pagination current={page} total={totalPages} onChange={setPage} />
      )}
    </div>
  );
}
