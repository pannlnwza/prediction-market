import api from './client';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN' | 'RESOLVER';
  createdAt: string;
}

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users');
  return data;
}

export async function updateUserRole(
  id: string,
  role: User['role'],
): Promise<User> {
  const { data } = await api.patch<User>(`/users/${id}/role`, { role });
  return data;
}
