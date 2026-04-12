import { useQuery } from '@tanstack/react-query';
import { StatusBadge, formatDateLong } from './StatusBadge';

interface MarketInfoProps {
  description: string | null;
  closeDate: string;
  marketId: string;
  status: string;
}

export function MarketInfo({ description, closeDate, marketId, status }: MarketInfoProps) {
  const { data: resolution } = useQuery({
    queryKey: ['resolution', marketId],
    queryFn: async () => {
      const res = await fetch(`/api/resolutions/${marketId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: status === 'RESOLVED',
    retry: false,
  });

  return (
    <div className="border-t border-gray-200 pt-5 space-y-5">
      {/* Resolution result */}
      {resolution && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-teal-800 mb-2">Resolution</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-teal-700">Outcome</span>
              <span className="font-semibold text-teal-900">
                {resolution.winningOption?.label ?? 'Unknown'}
              </span>
            </div>
            {resolution.resolver && (
              <div className="flex justify-between">
                <span className="text-teal-700">Resolved by</span>
                <span className="text-teal-900">{resolution.resolver.displayName}</span>
              </div>
            )}
            {resolution.resolvedAt && (
              <div className="flex justify-between">
                <span className="text-teal-700">Resolved on</span>
                <span className="text-teal-900">{formatDateLong(resolution.resolvedAt)}</span>
              </div>
            )}
            {resolution.evidenceUrl && (
              <div className="flex justify-between">
                <span className="text-teal-700">Evidence</span>
                <a href={resolution.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">
                  View source
                </a>
              </div>
            )}
            {resolution.notes && (
              <p className="text-teal-700 mt-2 pt-2 border-t border-teal-200">{resolution.notes}</p>
            )}
          </div>
        </div>
      )}

      {/* Rules */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-2">Rules</h3>
        <div className="text-sm text-gray-600 leading-relaxed space-y-2">
          {description ? (
            <p>{description}</p>
          ) : (
            <p>This market will resolve to "Yes" if the event occurs before the close date. Otherwise, it will resolve to "No".</p>
          )}
        </div>
      </div>

      {/* Market details */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-2">Details</h3>
        <div className="text-sm space-y-1.5">
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-500">Market ID</span>
            <span className="text-gray-700">{marketId.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-500">Close date</span>
            <span className="text-gray-700">{formatDateLong(closeDate)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Status</span>
            <StatusBadge status={status} />
          </div>
        </div>
      </div>
    </div>
  );
}
