import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Pagination } from './Pagination';
import Modal from '../Modal';
import { StatusBadge } from '../market/StatusBadge';
import { formatDate } from '../../utils/format';
import {
  getMarkets,
  updateMarket,
  deleteMarket,
  type Market,
  type UpdateMarketParams,
} from '../../api/markets';

const PAGE_SIZE = 15;

export function MarketsTab() {
  const queryClient = useQueryClient();
  const [editMarket, setEditMarket] = useState<Market | null>(null);
  const [editForm, setEditForm] = useState<UpdateMarketParams>({});
  const [voidMarket, setVoidMarket] = useState<Market | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Market | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-markets'],
    queryFn: () => getMarkets({ limit: 100 }),
  });
  const allMarkets = data?.markets ?? [];
  const markets = search
    ? allMarkets.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
    : allMarkets;

  const updateMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateMarketParams }) => updateMarket(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
      setEditMarket(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMarket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
      setDeleteTarget(null);
    },
  });

  const voidMutation = useMutation({
    mutationFn: (id: string) => updateMarket(id, { status: 'VOIDED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
      setVoidMarket(null);
    },
  });

  function openEdit(market: Market) {
    setEditMarket(market);
    setEditForm({ title: market.title, description: market.description ?? '', closeDate: market.closeDate.slice(0, 10) });
  }

  if (isLoading) {
    return <p className="text-sm text-gray-400 py-8 text-center">Loading markets...</p>;
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search markets..."
          className="h-9 w-64 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors"
        />
      </div>

      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-800 text-sm font-semibold">
            <th className="py-3 w-[45%]">Market</th>
            <th className="px-5 py-3 w-[15%]">Status</th>
            <th className="px-5 py-3 w-[15%]">Close Date</th>
            <th className="px-5 py-3 text-right w-[25%]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {markets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((market) => (
            <tr key={market.id} className="border-b border-gray-100 last:border-b-0 transition-colors">
              <td className="py-3 font-medium text-gray-900 truncate">{market.title}</td>
              <td className="px-5 py-3"><StatusBadge status={market.status} /></td>
              <td className="px-5 py-3 text-gray-500 text-[13px]">{formatDate(market.closeDate)}</td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openEdit(market)}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md border-none cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                  {market.status === 'ACTIVE' && (
                    <button
                      onClick={() => setVoidMarket(market)}
                      className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-md border-none cursor-pointer hover:bg-amber-100 transition-colors"
                    >
                      Void
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(market)}
                    className="p-1.5 text-gray-400 bg-transparent border-none cursor-pointer hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {markets.length === 0 && (
            <tr>
              <td colSpan={4} className="px-5 py-16 text-center">
                <p className="text-sm text-gray-400">No markets found</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination current={page} total={Math.ceil(markets.length / PAGE_SIZE)} onChange={setPage} />

      {/* Edit Modal */}
      {editMarket && (
        <Modal title="Edit Market" onClose={() => setEditMarket(null)}>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Title</label>
              <input
                type="text"
                value={editForm.title ?? ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
              <textarea
                value={editForm.description ?? ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Close Date</label>
              <input
                type="date"
                value={editForm.closeDate ?? ''}
                onChange={(e) => setEditForm({ ...editForm, closeDate: e.target.value })}
                className="h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setEditMarket(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg border-none cursor-pointer hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateMutation.mutate({ id: editMarket.id, params: editForm })}
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg border-none cursor-pointer hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Void Modal */}
      {voidMarket && (
        <Modal title="Void Market" onClose={() => setVoidMarket(null)}>
          <p className="text-sm text-gray-600 mb-1">Are you sure you want to void this market?</p>
          <p className="text-sm font-medium text-gray-900 mb-4">"{voidMarket.title}"</p>
          <p className="text-xs text-gray-400 mb-5">This will refund all users. This action cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setVoidMarket(null)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg border-none cursor-pointer hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => voidMutation.mutate(voidMarket.id)}
              disabled={voidMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg border-none cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {voidMutation.isPending ? 'Voiding...' : 'Void Market'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Delete Market" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-600 mb-1">Are you sure you want to delete this market?</p>
          <p className="text-sm font-medium text-gray-900 mb-4">"{deleteTarget.title}"</p>
          <p className="text-xs text-gray-400 mb-5">This only works if there are no trades on this market.</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg border-none cursor-pointer hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg border-none cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
