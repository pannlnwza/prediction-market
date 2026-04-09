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
  status: string;
  closeDate: string;
  createdAt: string;
  creatorId: string;
  resolverId: string | null;
  options: MarketOption[];
}

export async function getMarkets(status?: string, search?: string): Promise<Market[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (search) params.search = search;
  const { data } = await api.get<Market[]>('/markets', { params });
  return data;
}

export async function getMarket(id: string): Promise<Market> {
  const { data } = await api.get<Market>(`/markets/${id}`);
  return data;
}

export interface CreateMarketParams {
  title: string;
  description: string;
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
