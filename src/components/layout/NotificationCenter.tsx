import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, Trash2, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export const NotificationCenter = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification.id);
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <Bell className="w-6 h-6 text-zinc-400 hover:text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-full right-0 mt-2 w-96 max-h-[32rem] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-black">
              <h3 className="font-bold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[28rem]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer transition-colors ${
                        notification.read
                          ? 'bg-zinc-900 hover:bg-zinc-800'
                          : 'bg-amber-500/5 hover:bg-amber-500/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {notification.icon && (
                          <span className="text-2xl flex-shrink-0">{notification.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white mb-1">{notification.title}</h4>
                          <p className="text-sm text-zinc-400">{notification.message}</p>
                          <p className="text-xs text-zinc-600 mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-zinc-500 hover:text-white transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            className="text-zinc-500 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
