import api from './client';

export async function getBalance(): Promise<{ balance: string | number }> {
  const { data } = await api.get('/wallet');
  return data;
}

export async function deposit(amount: number): Promise<{ balance: string | number }> {
  const { data } = await api.post('/wallet/deposit', { amount });
  return data;
}

export async function withdraw(amount: number): Promise<{ balance: string | number }> {
  const { data } = await api.post('/wallet/withdraw', { amount });
  return data;
}
