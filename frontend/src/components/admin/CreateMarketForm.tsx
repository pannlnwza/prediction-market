import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createMarket, type CreateMarketParams } from '../../api/markets';
import { getUsers } from '../../api/users';

const CATEGORIES = ['General', 'Politics', 'Crypto', 'Sports', 'Finance', 'Tech', 'Science'];

const EMPTY_FORM: CreateMarketParams = {
  title: '', description: '', category: 'General', closeDate: '', resolverId: '',
};

const INPUT_CLASS = "w-full h-10 max-w-xl px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors";

interface CreateMarketFormProps {
  onCreated: () => void;
}

export function CreateMarketForm({ onCreated }: CreateMarketFormProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateMarketParams>(EMPTY_FORM);

  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: getUsers });
  const resolvers = users.filter((u) => u.role === 'RESOLVER');

  const createMutation = useMutation({
    mutationFn: createMarket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
      setForm(EMPTY_FORM);
      onCreated();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  const isValid = form.title.trim() && form.closeDate && form.resolverId;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {createMutation.isError && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-lg">Failed to create market.</div>
      )}
      {createMutation.isSuccess && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-2.5 rounded-lg">Market created!</div>
      )}

      <div className="grid grid-cols-[180px_1fr] gap-x-6 gap-y-5 items-start">
        <label className="text-sm font-medium text-gray-700 pt-2">Title</label>
        <div>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={INPUT_CLASS}
            placeholder="e.g. Will Bitcoin reach $100K by 2026?"
            required
          />
          <p className="text-[11px] text-gray-400 mt-1">A clear yes/no question about a future event.</p>
        </div>

        <label className="text-sm font-medium text-gray-700 pt-2">Description</label>
        <div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full max-w-xl px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none resize-none transition-colors"
            rows={3}
            placeholder="Resolution criteria, sources, and context..."
          />
        </div>

        <label className="text-sm font-medium text-gray-700 pt-2">Category</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className={`${INPUT_CLASS} cursor-pointer`}
          style={{ width: 'auto', minWidth: 160 }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label className="text-sm font-medium text-gray-700 pt-2">Close Date</label>
        <input
          type="date"
          value={form.closeDate}
          onChange={(e) => setForm({ ...form, closeDate: e.target.value })}
          className={INPUT_CLASS}
          style={{ width: 'auto', minWidth: 180 }}
          required
        />

        <label className="text-sm font-medium text-gray-700 pt-2">Resolver</label>
        <div>
          <select
            value={form.resolverId}
            onChange={(e) => setForm({ ...form, resolverId: e.target.value })}
            className={`${INPUT_CLASS} cursor-pointer`}
            style={{ width: 'auto', minWidth: 280 }}
            required
          >
            <option value="">Select a resolver...</option>
            {resolvers.map((u) => (
              <option key={u.id} value={u.id}>{u.displayName} ({u.email})</option>
            ))}
          </select>
          {resolvers.length === 0 && (
            <p className="text-[11px] text-gray-400 mt-1">No RESOLVER users found. Assign the role in Users tab first.</p>
          )}
        </div>

        <div />
        <button
          type="submit"
          disabled={!isValid || createMutation.isPending}
          className="h-10 px-6 bg-teal-600 text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-fit"
        >
          {createMutation.isPending ? 'Creating...' : 'Create Market'}
        </button>
      </div>
    </form>
  );
}
