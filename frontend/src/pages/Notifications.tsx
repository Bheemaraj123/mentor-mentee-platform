import React, { useState, useEffect } from 'react';
import { Bell, Check, Loader2, FileQuestion, FileText, CheckSquare, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface Notification {
  id: number;
  recipient_id: number;
  title: string;
  message: string;
  notification_type: string;
  related_entity_id: number | null;
  is_read: boolean;
  created_at: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Marked as read');
    } catch (err) {
      console.error('Failed to mark as read', err);
      toast.error('Failed to update');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read', err);
      toast.error('Failed to update');
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const filteredNotifications = notifications.filter(n => filter === 'all' || !n.is_read);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'request':
        return 'pill-blue';
      case 'report':
        return 'pill-ready';
      case 'task':
        return 'pill-lavender';
      default:
        return 'pill-neutral';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'request':
        return <FileQuestion size={15} />;
      case 'report':
        return <FileText size={15} />;
      case 'task':
        return <CheckSquare size={15} />;
      default:
        return <Bell size={15} />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Your updates</p>
          <h1>Notifications</h1>
          <p className="page-description">Stay updated on reports, tasks, and mentorship activity.</p>
        </div>
        <div className="heading-actions" style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="secondary-button"
              style={{fontSize: '11px', padding: '8px 12px'}}
            >
              <CheckCircle2 size={14} />
              Mark all read
            </button>
          )}
        </div>
      </section>

      <div className="surface-card" style={{overflow: 'hidden'}}>
        {/* Filter tabs */}
        <div className="filter-tabs" style={{padding: '16px 20px', borderBottom: '1px solid #edf1f5', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <button
            className={`library-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            style={{padding: '8px 12px', fontSize: '11px'}}
          >
            All <span style={{color: '#a8b2bf', marginLeft: '4px'}}>{notifications.length}</span>
          </button>
          <button
            className={`library-tab ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
            style={{padding: '8px 12px', fontSize: '11px'}}
          >
            Unread <span style={{color: '#a8b2bf', marginLeft: '4px'}}>{unreadCount}</span>
          </button>
        </div>

        {loading && (
          <div className="session-stage" style={{minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Loader2 className="w-8 h-8 animate-spin" style={{color: '#2f6bff'}} />
          </div>
        )}

        {!loading && filteredNotifications.length === 0 && (
          <div className="session-stage" style={{minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px'}}>
            <div className="ai-mini-icon" style={{marginBottom: '16px', width: '48px', height: '48px', fontSize: '20px'}}>
              <Bell size={24} />
            </div>
            <strong style={{fontSize: '16px', color: '#15233e', display: 'block', marginBottom: '8px'}}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </strong>
            <p style={{color: '#9aa7b8', fontSize: '13px'}}>{filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here when you receive updates.'}</p>
          </div>
        )}

        {!loading && filteredNotifications.length > 0 && (
          <div className="report-list" style={{maxHeight: 'calc(100vh - 300px)', overflowY: 'auto'}}>
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`report-row ${!notification.is_read ? '' : ''}`}
                style={{minHeight: 'auto', padding: '16px 20px', borderBottom: '1px solid #edf1f5', background: !notification.is_read ? '#fbfdff' : 'transparent'}}
              >
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                  <div className={`pill ${getTypeColor(notification.notification_type)}`} style={{flexShrink: 0, marginTop: '2px'}}>
                    {getTypeIcon(notification.notification_type)}
                  </div>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px'}}>
                      <div style={{flex: 1}}>
                        <strong style={{fontSize: '13px', color: '#15233e', display: 'block', marginBottom: '4px'}}>{notification.title}</strong>
                        <p style={{color: '#64758d', fontSize: '12px', lineHeight: 1.5, margin: 0}}>{notification.message}</p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="icon-button subtle"
                          style={{width: '28px', height: '28px', flexShrink: 0}}
                          aria-label="Mark as read"
                        >
                          <Check size={14} strokeWidth={3} style={{color: '#3cbd9a'}} />
                        </button>
                      )}
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px'}}>
                      <span className={`pill ${getTypeColor(notification.notification_type)}`} style={{fontSize: '9px', textTransform: 'capitalize'}}>
                        {notification.notification_type}
                      </span>
                      <span style={{color: '#9ba7b6', fontSize: '10px'}}>{formatDate(notification.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;