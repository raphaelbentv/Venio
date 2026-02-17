import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { fetchNotifications as fetchNotificationsApi, fetchUnreadCount, markAsRead as markAsReadApi, markAllAsRead as markAllAsReadApi } from '../services/notifications'
import { useAuth } from './AuthContext'
import { isAdminRole } from '../lib/permissions'
import type { AppNotification } from '../types/notification.types'

interface NotificationContextValue {
  unreadCount: number
  notifications: AppNotification[]
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

const POLL_INTERVAL = 30_000

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const isAdmin = user && isAdminRole(user.role)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    if (!isAdmin) return
    try {
      const [count, notifs] = await Promise.all([
        fetchUnreadCount(),
        fetchNotificationsApi(),
      ])
      setUnreadCount(count)
      setNotifications(notifs)
    } catch {
      // silently fail polling
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) {
      setUnreadCount(0)
      setNotifications([])
      return
    }

    refresh()
    intervalRef.current = setInterval(refresh, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isAdmin, refresh])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await markAsReadApi(id)
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadApi()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }, [])

  const value = useMemo(
    () => ({ unreadCount, notifications, markAsRead, markAllAsRead, refresh }),
    [unreadCount, notifications, markAsRead, markAllAsRead, refresh]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
