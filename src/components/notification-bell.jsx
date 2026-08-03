'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Calendar, CreditCard, XCircle } from 'lucide-react';
import useFetch from '@/app/hooks/useFetch';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from 'actions/notifications';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const NOTIFICATION_ICONS = {
  BOOKING_CONFIRMED: Calendar,
  APPOINTMENT_CANCELLED: XCircle,
  APPOINTMENT_REMINDER: Bell,
  PAYOUT_PROCESSED: CreditCard,
};

const POLL_INTERVAL_MS = 60000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { fn: fetchNotifications, data } = useFetch(getNotifications);
  const { fn: submitMarkRead } = useFetch(markNotificationRead);
  const { fn: submitMarkAllRead, data: markAllData } = useFetch(
    markAllNotificationsRead
  );

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (markAllData?.success) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markAllData]);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkRead = async (notificationId) => {
    const formData = new FormData();
    formData.append('notificationId', notificationId);
    await submitMarkRead(formData);
    fetchNotifications();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative w-10 h-10"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-emerald-600 text-[10px] leading-none flex items-center justify-center text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              Notifications
              {unreadCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => submitMarkAllRead()}
                >
                  Mark all read
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const Icon =
                  NOTIFICATION_ICONS[notification.type] || Bell;
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      !notification.isRead && handleMarkRead(notification.id)
                    }
                    className={cn(
                      'w-full text-left flex items-start gap-3 p-3 rounded-md border',
                      notification.isRead
                        ? 'border-transparent'
                        : 'border-emerald-700/30 bg-emerald-900/10'
                    )}
                  >
                    <Icon className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
