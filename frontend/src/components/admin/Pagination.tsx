interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ current, total, onChange }: PaginationProps) {
  if (total <= 1) return null;

  const pages = getVisiblePages(current, total);

  return (
    <div className="flex items-center justify-center gap-1 py-3 border-t border-gray-100">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 0}
        className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-transparent border-none cursor-pointer hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Prev
      </button>
      {pages.map((page, i) =>
        page === -1 ? (
          <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={`w-7 h-7 rounded-md text-xs font-medium border-none cursor-pointer transition-colors ${
              page === current ? 'bg-teal-600 text-white' : 'bg-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            {page + 1}
          </button>
        )
      )}
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

function getVisiblePages(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const pages: number[] = [];

  // Always show first page
  pages.push(0);

  // Calculate range around current
  let start = Math.max(1, current - 1);
  let end = Math.min(total - 2, current + 1);

  // Adjust if near edges
  if (current <= 2) {
    end = Math.min(3, total - 2);
  }
  if (current >= total - 3) {
    start = Math.max(1, total - 4);
  }

  // Ellipsis before middle section
  if (start > 1) pages.push(-1);

  // Middle section
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Ellipsis after middle section
  if (end < total - 2) pages.push(-1);

  // Always show last page
  pages.push(total - 1);

  return pages;
}
