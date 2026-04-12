export { formatDate, formatDateLong, formatCurrency } from '../../utils/format';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  CLOSED: 'bg-amber-50 text-amber-700',
  RESOLVED: 'bg-teal-50 text-teal-700',
  VOIDED: 'bg-red-50 text-red-700',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}
