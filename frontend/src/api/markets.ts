import api from './client';

export interface MarketOption {
  id: string;
  label: string;
  currentPrice: string | number;
}

export interface Market {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  closeDate: string;
  createdAt: string;
  creatorId: string;
  resolverId: string | null;
  options: MarketOption[];
  volume?: number;
}

export interface MarketsResponse {
  markets: Market[];
  total: number;
  limit: number;
  offset: number;
}

export async function getMarkets(params?: {
  status?: string;
  search?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<MarketsResponse> {
  const query: Record<string, string | number> = {};
  if (params?.status) query.status = params.status;
  if (params?.search) query.search = params.search;
  if (params?.category) query.category = params.category;
  if (params?.limit) query.limit = params.limit;
  if (params?.offset) query.offset = params.offset;
  const { data } = await api.get<MarketsResponse>('/markets', { params: query });
  return data;
}

export async function getMarket(id: string): Promise<Market> {
  const { data } = await api.get<Market>(`/markets/${id}`);
  return data;
}

export interface CreateMarketParams {
  title: string;
  description: string;
  category: string;
  closeDate: string;
  resolverId: string;
}

export interface UpdateMarketParams {
  title?: string;
  description?: string;
  closeDate?: string;
  resolverId?: string;
  status?: string;
}

export async function createMarket(params: CreateMarketParams): Promise<Market> {
  const { data } = await api.post<Market>('/markets', params);
  return data;
}

export async function updateMarket(id: string, params: UpdateMarketParams): Promise<Market> {
  const { data } = await api.patch<Market>(`/markets/${id}`, params);
  return data;
}

export async function deleteMarket(id: string): Promise<void> {
  await api.delete(`/markets/${id}`);
}
