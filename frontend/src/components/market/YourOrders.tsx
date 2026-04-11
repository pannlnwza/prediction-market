import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, cancelOrder, type Order } from '../../api/orders';
import { StatusBadge, formatCurrency } from './StatusBadge';

export function YourOrders({ marketId }: { marketId: string }) {
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

  return (
    <div className="pt-5">
      <h3 className="text-base font-bold text-gray-900 mb-3">Your Orders</h3>
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
            {orders.map((order) => (
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
    </div>
  );
}
