import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pagination } from '../admin/Pagination';
import Modal from '../Modal';
import { cancelOrder, type Order } from '../../api/orders';
import { formatCurrency } from '../../utils/format';

const PAGE_SIZE = 15;

interface OrdersTabProps {
  orders: Order[];
}

export default function OrdersTab({ orders }: OrdersTabProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      setCancelTarget(null);
    },
  });

  if (orders.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <p className="text-sm text-gray-400 text-center py-10">No orders yet</p>
      </div>
    );
  }

  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const pageItems = orders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      <div className="overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="text-left text-sm font-semibold text-gray-800">
                <th className="py-2.5 w-[35%]">Market</th>
                <th className="px-5 py-2.5 w-[10%]">Option</th>
                <th className="px-5 py-2.5 text-right w-[12%]">Price</th>
                <th className="px-5 py-2.5 text-right w-[10%]">Qty</th>
                <th className="px-5 py-2.5 text-right w-[10%]">Filled</th>
                <th className="px-5 py-2.5 w-[13%]">Status</th>
                <th className="px-5 py-2.5 text-right w-[10%]"></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((order) => (
                <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3">
                    <Link to={`/market/${order.marketId}`} className="text-gray-900 font-medium no-underline hover:text-teal-700 block truncate">
                      {order.market?.title ?? '—'}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold ${order.option?.label === 'YES' ? 'text-green-600' : 'text-red-500'}`}>
                      {order.option?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(Number(order.price))}</td>
                  <td className="px-5 py-3 text-right text-gray-900">{order.quantity}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{order.filledQuantity}/{order.quantity}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      order.status === 'FILLED' ? 'bg-green-50 text-green-700' :
                      order.status === 'OPEN' ? 'bg-blue-50 text-blue-700' :
                      order.status === 'PARTIALLY_FILLED' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {order.status === 'OPEN' && (
                      <button
                        onClick={() => setCancelTarget(order)}
                        className="text-xs text-red-500 bg-transparent border-none cursor-pointer hover:text-red-700"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        {orders.length > PAGE_SIZE && (
          <Pagination current={page} total={totalPages} onChange={setPage} />
        )}
      </div>

      {cancelTarget && (
        <Modal title="Cancel Order" onClose={() => setCancelTarget(null)}>
          <p className="text-sm text-gray-600 mb-1">Are you sure you want to cancel this order?</p>
          <p className="text-sm font-medium text-gray-900 mb-1">
            {cancelTarget.option?.label} @ ${Number(cancelTarget.price).toFixed(2)} x {cancelTarget.quantity}
          </p>
          <p className="text-xs text-gray-400 mb-5">Your escrowed funds will be returned to your wallet.</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setCancelTarget(null)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg border-none cursor-pointer hover:bg-gray-200 transition-colors"
            >
              Keep Order
            </button>
            <button
              onClick={() => cancelMutation.mutate(cancelTarget.id)}
              disabled={cancelMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg border-none cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
