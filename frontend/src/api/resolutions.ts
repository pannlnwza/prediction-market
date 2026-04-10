import api from './client';

export interface ResolveParams {
  winningOptionId: string;
  evidenceUrl?: string;
  notes?: string;
}

export async function resolveMarket(marketId: string, params: ResolveParams) {
  const { data } = await api.post(`/resolutions/${marketId}`, params);
  return data;
}

export async function getResolution(marketId: string) {
  const { data } = await api.get(`/resolutions/${marketId}`);
  return data;
}
