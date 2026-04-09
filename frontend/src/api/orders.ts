import api from './client';

export interface PlaceOrderParams {
  marketId: string;
  optionId: string;
  type: 'MARKET' | 'LIMIT';
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
}

export async function placeOrder(params: PlaceOrderParams) {
  const { data } = await api.post('/orders', params);
  return data;
}

export async function getOrders(marketId?: string) {
  const params: Record<string, string> = {};
  if (marketId) params.marketId = marketId;
  const { data } = await api.get('/orders', { params });
  return data;
}

export async function cancelOrder(id: string) {
  const { data } = await api.delete(`/orders/${id}`);
  return data;
}

export async function getOrderBook(marketId: string) {
  const { data } = await api.get(`/markets/${marketId}/orderbook`);
  return data;
}
