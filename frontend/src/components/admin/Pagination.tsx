interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ current, total, onChange }: PaginationProps) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 py-3 border-t border-gray-100">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 0}
        className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-transparent border-none cursor-pointer hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Prev
      </button>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`w-7 h-7 rounded-md text-xs font-medium border-none cursor-pointer transition-colors ${
            i === current ? 'bg-teal-600 text-white' : 'bg-transparent text-gray-500 hover:bg-gray-100'
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total - 1}
        className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-transparent border-none cursor-pointer hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}
