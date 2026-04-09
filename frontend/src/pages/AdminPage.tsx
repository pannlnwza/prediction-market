import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, AlertTriangle, LayoutGrid, Users, PlusCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import {
  getMarkets,
  createMarket,
  updateMarket,
  deleteMarket,
  type Market,
  type CreateMarketParams,
  type UpdateMarketParams,
} from '../api/markets';
import { getUsers, updateUserRole, type User } from '../api/users';

type Tab = 'markets' | 'users' | 'create';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700 border border-green-200',
  CLOSED: 'bg-amber-50 text-amber-700 border border-amber-200',
  RESOLVED: 'bg-teal-50 text-teal-700 border border-teal-200',
  VOIDED: 'bg-red-50 text-red-700 border border-red-200',
};

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'markets', label: 'Markets', icon: <LayoutGrid size={15} /> },
  { key: 'users', label: 'Users', icon: <Users size={15} /> },
  { key: 'create', label: 'Create Market', icon: <PlusCircle size={15} /> },
];

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-500 border border-gray-200';
  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${color}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// --- Markets Tab ---

function MarketsTab() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateMarketParams>({});
  const [confirmVoidId, setConfirmVoidId] = useState<string | null>(null);

  const { data: markets = [], isLoading } = useQuery({
    queryKey: ['admin-markets'],
    queryFn: () => getMarkets(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateMarketParams }) => updateMarket(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMarket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-markets'] }),
  });

  const voidMutation = useMutation({
    mutationFn: (id: string) => updateMarket(id, { status: 'VOIDED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
      setConfirmVoidId(null);
    },
  });

  function startEditing(market: Market) {
    setEditingId(market.id);
    setEditForm({ title: market.title, description: market.description ?? '', closeDate: market.closeDate.slice(0, 10) });
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500 py-8 text-center">Loading markets...</p>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-gray-500 text-[11px] font-semibold uppercase tracking-wider">
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Close Date</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((market) => (
            <tr key={market.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
              {editingId === market.id ? (
                <td colSpan={4} className="px-4 py-4">
                  <div className="flex flex-col gap-2.5">
                    <input
                      type="text"
                      value={editForm.title ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:border-teal-400 transition-colors"
                    />
                    <textarea
                      value={editForm.description ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none resize-none focus:border-teal-400 transition-colors"
                      rows={2}
                    />
                    <input
                      type="date"
                      value={editForm.closeDate ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, closeDate: e.target.value })}
                      className="h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none w-fit focus:border-teal-400 transition-colors"
                    />
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => updateMutation.mutate({ id: market.id, params: editForm })}
                        disabled={updateMutation.isPending}
                        className="px-4 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg border-none cursor-pointer hover:bg-teal-700 transition-colors disabled:opacity-50"
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg border-none cursor-pointer hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </td>
              ) : (
                <>
                  <td className="px-4 py-3 font-medium text-gray-900">{market.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={market.status} /></td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-[13px]">{formatDate(market.closeDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => startEditing(market)}
                        className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md border-none cursor-pointer hover:bg-gray-200 hover:text-gray-900 transition-colors"
                      >
                        Edit
                      </button>
                      {market.status === 'ACTIVE' && (
                        <button
                          onClick={() => setConfirmVoidId(market.id)}
                          className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-md border-none cursor-pointer hover:bg-amber-100 transition-colors"
                        >
                          Void
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this market?')) deleteMutation.mutate(market.id);
                        }}
                        className="p-1.5 text-gray-400 bg-transparent border-none cursor-pointer hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
          {markets.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">No markets found</td>
            </tr>
          )}
        </tbody>
      </table>

      {confirmVoidId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-amber-500" />
              <h3 className="text-sm font-bold text-gray-900">Void Market</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">This will void the market and refund all users. This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmVoidId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg border-none cursor-pointer hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => voidMutation.mutate(confirmVoidId)}
                disabled={voidMutation.isPending}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg border-none cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {voidMutation.isPending ? 'Voiding...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Users Tab ---

function UsersTab() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getUsers,
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: User['role'] }) => updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  if (isLoading) {
    return <p className="text-sm text-gray-500 py-8 text-center">Loading users...</p>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-gray-500 text-[11px] font-semibold uppercase tracking-wider">
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Display Name</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-900 font-mono text-[13px]">{u.email}</td>
              <td className="px-4 py-3 text-gray-600">{u.displayName}</td>
              <td className="px-4 py-3">
                <select
                  value={u.role}
                  onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value as User['role'] })}
                  className="h-8 px-2 rounded-lg bg-gray-50 border border-gray-200 text-[12px] text-gray-900 font-medium outline-none cursor-pointer focus:border-teal-400 transition-colors"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="RESOLVER">RESOLVER</option>
                </select>
              </td>
              <td className="px-4 py-3 text-gray-500 font-mono text-[13px]">{formatDate(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Create Market ---

function CreateMarketForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateMarketParams>({ title: '', description: '', closeDate: '', resolverId: '' });

  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: getUsers });
  const resolvers = users.filter((u) => u.role === 'RESOLVER');

  const createMutation = useMutation({
    mutationFn: createMarket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
      setForm({ title: '', description: '', closeDate: '', resolverId: '' });
      onCreated();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  const isValid = form.title.trim() && form.closeDate && form.resolverId;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-teal-400 transition-colors"
          placeholder="e.g. Will Bitcoin reach $100K by 2026?"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none resize-none focus:border-teal-400 transition-colors"
          rows={3}
          placeholder="Provide context and resolution criteria..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Close Date</label>
        <input
          type="date"
          value={form.closeDate}
          onChange={(e) => setForm({ ...form, closeDate: e.target.value })}
          className="h-11 px-4 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:border-teal-400 transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Resolver</label>
        <select
          value={form.resolverId}
          onChange={(e) => setForm({ ...form, resolverId: e.target.value })}
          className="h-11 px-4 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none cursor-pointer focus:border-teal-400 transition-colors"
          required
        >
          <option value="">Select a resolver...</option>
          {resolvers.map((u) => (
            <option key={u.id} value={u.id}>{u.displayName} ({u.email})</option>
          ))}
        </select>
        {resolvers.length === 0 && (
          <p className="text-[12px] text-gray-500 mt-1">No RESOLVER users found. Assign the role in Users tab first.</p>
        )}
      </div>

      {createMutation.isError && <p className="text-sm text-red-600">Failed to create market.</p>}
      {createMutation.isSuccess && <p className="text-sm text-green-600">Market created!</p>}

      <button
        type="submit"
        disabled={!isValid || createMutation.isPending}
        className="h-11 px-6 bg-teal-600 text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {createMutation.isPending ? 'Creating...' : 'Create Market'}
      </button>
    </form>
  );
}

// --- Admin Page ---

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('markets');

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-5 py-20 text-center">
          <p className="text-sm text-gray-500">You do not have permission to view this page.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg border-none cursor-pointer transition-colors
                ${activeTab === tab.key
                  ? 'bg-teal-600 text-white'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'markets' && <MarketsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'create' && <CreateMarketForm onCreated={() => setActiveTab('markets')} />}
      </main>

      <Footer />
    </div>
  );
}
