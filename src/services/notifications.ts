import { apiFetch } from '../lib/api'
import type { AppNotification } from '../types/notification.types'

export async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await apiFetch('/api/admin/notifications') as { notifications: AppNotification[] }
  return res.notifications
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiFetch('/api/admin/notifications/unread-count') as { count: number }
  return res.count
}

export async function markAsRead(id: string): Promise<AppNotification> {
  const res = await apiFetch(`/api/admin/notifications/${id}/read`, {
    method: 'PATCH',
  }) as { notification: AppNotification }
  return res.notification
}

export async function markAllAsRead(): Promise<void> {
  await apiFetch('/api/admin/notifications/read-all', {
    method: 'POST',
  })
}
