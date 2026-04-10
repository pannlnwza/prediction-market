import api from './client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  referenceId: string | null;
  createdAt: string;
}

export async function getNotifications(limit = 20): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>('/notifications', { params: { limit } });
  return data;
}

export async function markAsRead(id: string) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
}

export async function markAllAsRead() {
  const { data } = await api.patch('/notifications/read-all');
  return data;
}
