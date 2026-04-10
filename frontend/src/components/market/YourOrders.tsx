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
    <div className="border-t border-gray-200 pt-4">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-3">Your Orders</h3>
      <div className="space-y-2">
        {orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <span className={`text-sm font-medium ${order.option?.label === 'YES' ? 'text-green-600' : 'text-red-500'}`}>
                {order.option?.label}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                {order.filledQuantity}/{order.quantity} @ {formatCurrency(Number(order.price))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} />
              {order.status === 'OPEN' && (
                <button
                  onClick={() => cancelMutation.mutate(order.id)}
                  className="text-xs text-red-500 bg-transparent border-none cursor-pointer hover:text-red-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
