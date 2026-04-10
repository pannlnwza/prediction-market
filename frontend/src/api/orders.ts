import api from './client';

export interface PlaceOrderParams {
  marketId: string;
  optionId: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  marketId: string;
  optionId: string;
  price: string | number;
  quantity: number;
  filledQuantity: number;
  status: string;
  createdAt: string;
  option?: { id: string; label: string; currentPrice: string | number };
  market?: { id: string; title: string; status: string };
}

export async function placeOrder(params: PlaceOrderParams) {
  const { data } = await api.post('/orders', params);
  return data;
}

export async function getOrders(marketId?: string): Promise<Order[]> {
  const params: Record<string, string> = {};
  if (marketId) params.marketId = marketId;
  const { data } = await api.get<Order[]>('/orders', { params });
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

export interface Position {
  id: string;
  userId: string;
  marketId: string;
  optionId: string;
  quantity: number;
  avgPrice: string | number;
  market?: { id: string; title: string; status: string };
  option?: { id: string; label: string; currentPrice: string | number };
}

export async function getPortfolio(): Promise<Position[]> {
  const { data } = await api.get<Position[]>('/portfolio');
  return data;
}

export async function getMarketPosition(marketId: string): Promise<Position[]> {
  const { data } = await api.get<Position[]>(`/portfolio/${marketId}`);
  return data;
}
