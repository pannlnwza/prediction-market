import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, cancelOrder, type Order } from '../../api/orders';
import { StatusBadge, formatCurrency } from './StatusBadge';

const PAGE_SIZE = 5;

export function YourOrders({ marketId }: { marketId: string }) {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['my-orders', marketId],
    queryFn: () => getOrders(marketId),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders', marketId] });
      queryClient.invalidateQueries({ queryKey: ['order-book', marketId] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
  });

  if (orders.length === 0) return null;

  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const paged = orders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="pt-5">
      <h3 className="text-base font-bold text-gray-900 mb-3">
        Your Orders
        {orders.length > PAGE_SIZE && (
          <span className="text-xs font-normal text-gray-400 ml-2">({orders.length})</span>
        )}
      </h3>
      <div className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-sm font-semibold text-gray-900">
              <th className="py-2.5">Side</th>
              <th className="py-2.5">Price</th>
              <th className="py-2.5">Filled</th>
              <th className="py-2.5">Status</th>
              <th className="py-2.5 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {paged.map((order) => (
              <tr key={order.id} className="border-t border-gray-100">
                <td className="py-2.5">
                  <span className={`text-sm font-semibold ${order.option?.label === 'YES' ? 'text-green-600' : 'text-red-500'}`}>
                    {order.option?.label}
                  </span>
                </td>
                <td className="py-2.5 text-gray-700">
                  {formatCurrency(Number(order.price))}
                </td>
                <td className="py-2.5 text-gray-700">
                  {order.filledQuantity}/{order.quantity}
                </td>
                <td className="py-2.5">
                  <StatusBadge status={order.status} />
                </td>
                <td className="py-2.5 text-right">
                  {(order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED') && (
                    <button
                      onClick={() => cancelMutation.mutate(order.id)}
                      disabled={cancelMutation.isPending}
                      className="text-xs text-red-500 bg-transparent border-none cursor-pointer hover:text-red-700 disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 0}
            className="px-2 py-1 text-xs text-gray-500 bg-transparent border-none cursor-pointer hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-xs text-gray-400">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages - 1}
            className="px-2 py-1 text-xs text-gray-500 bg-transparent border-none cursor-pointer hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
