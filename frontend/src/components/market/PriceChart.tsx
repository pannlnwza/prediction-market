import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getTradeHistory, type TradeHistory } from '../../api/orders';
import { useSocket } from '../../context/SocketContext';

interface PriceChartProps {
  marketId: string;
  yesPercent: number;
}

export function PriceChart({ marketId, yesPercent }: PriceChartProps) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: trades = [] } = useQuery({
    queryKey: ['trade-history', marketId],
    queryFn: () => getTradeHistory(marketId),
  });

  useEffect(() => {
    if (!socket) return;
    socket.emit('join:market', marketId);

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['trade-history', marketId] });
      queryClient.invalidateQueries({ queryKey: ['market', marketId] });
    };

    socket.on('market:trade', handleUpdate);
    socket.on('market:price-update', handleUpdate);

    return () => {
      socket.off('market:trade', handleUpdate);
      socket.off('market:price-update', handleUpdate);
      socket.emit('leave:market', marketId);
    };
  }, [socket, marketId, queryClient]);

  // Build chart data
  const data = trades.map((t: TradeHistory) => ({
    price: Math.round(Number(t.price) * 100),
    time: new Date(t.createdAt).getTime(),
    label: new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    shares: t.quantity,
  }));

  // Add current price as last point
  if (data.length === 0 || data[data.length - 1].price !== yesPercent) {
    data.push({
      price: yesPercent,
      time: Date.now(),
      label: 'Now',
      fullDate: 'Current price',
      shares: 0,
    });
  }

  // Add starting point if only one
  if (data.length === 1) {
    data.unshift({
      price: 50,
      time: data[0].time - 86400000,
      label: new Date(data[0].time - 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: '',
      shares: 0,
    });
  }

  const prices = data.map(d => d.price);
  const minY = Math.floor(Math.max(0, Math.min(...prices) - 5) / 5) * 5;
  const maxY = Math.ceil(Math.min(100, Math.max(...prices) + 5) / 5) * 5;

  return (
    <div>
      <div className="mb-2">
        <span className="text-xs text-gray-600">
          {trades.length > 0 ? `${trades.length} trades` : 'No trades yet'}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            interval={Math.max(0, Math.floor(data.length / 5) - 1)}
          />

          <YAxis
            domain={[minY, maxY]}
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={(v) => `${v}%`}
            width={35}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="price"
            stroke="#0d9488"
            strokeWidth={2}
            fill="url(#priceGrad)"
            dot={false}
            activeDot={{ r: 5, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-lg">
      <p className="font-bold text-sm">{data.price}%</p>
      <p className="text-gray-300 text-xs mt-1">{data.fullDate}</p>
      {data.shares > 0 && (
        <p className="text-gray-300 text-xs">{data.shares} shares</p>
      )}
    </div>
  );
}
