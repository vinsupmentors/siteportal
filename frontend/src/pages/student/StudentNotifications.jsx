import React, { useState, useEffect } from 'react';
import theme from './theme';
import { PageHeader, Card, LoadingSpinner, EmptyState, FilterTabs, ActionButton } from './StudentComponents';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

const typeConfig = {
  announcement: { icon: '📢', color: theme.accent.cyan, label: 'Announcement' },
  alert: { icon: '⚠️', color: theme.accent.yellow, label: 'Alert' },
  reminder: { icon: '🔔', color: theme.accent.blue, label: 'Reminder' },
  result: { icon: '📊', color: theme.accent.green, label: 'Result' },
  leave: { icon: '🏖️', color: theme.accent.purple, label: 'Leave Update' },
  system: { icon: '⚙️', color: theme.text.muted, label: 'System' },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/notifications', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAcknowledge = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/student/notifications/${id}/acknowledge`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, acknowledged: true } : n));
    } catch { }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/student/notifications/read-all', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filtered = filter === 'all' ? notifications
    : filter === 'unread' ? notifications.filter(n => !n.read) : notifications.filter(n => n.read);

  if (loading) return <LoadingSpinner label="Loading notifications..." />;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with announcements and alerts"
        icon={<Bell size={24} />}
        accentColor={theme.accent.blue}
        action={unreadCount > 0 && (
          <ActionButton onClick={handleMarkAllRead} variant="secondary" icon={<CheckCheck size={16} />}>
            Mark all read ({unreadCount})
          </ActionButton>
        )}
      />

      {/* Filters */}
      <div style={{ marginBottom: '20px' }}>
        <FilterTabs
          filters={[
            { key: 'all', label: `All · ${notifications.length}` },
            { key: 'unread', label: unreadCount > 0 ? `Unread · ${unreadCount}` : 'Unread' },
            { key: 'read', label: 'Read' },
          ]}
          active={filter} onChange={setFilter}
        />
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell size={32} />}
          title={filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          message={filter === 'unread' ? "You've read all your notifications." : 'Notifications will appear here as they arrive.'}
        />
      ) : (
        <Card noPadding>
          {filtered.map((notif, i) => {
            const cfg = typeConfig[notif.type] || typeConfig.system;
            return (
              <div key={notif.id || i} style={{
                display: 'flex', gap: '16px', padding: '18px 24px',
                borderBottom: i < filtered.length - 1 ? `1px solid ${theme.border.subtle}` : 'none',
                background: notif.read ? 'transparent' : `${theme.accent.blue}06`,
                transition: 'background 0.2s', position: 'relative',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : `${theme.accent.blue}06`}
              >
                {/* Unread dot */}
                {!notif.read && (
                  <div style={{
                    position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                    width: '7px', height: '7px', borderRadius: '50%', background: theme.accent.blue,
                  }} />
                )}

                {/* Icon */}
                <div style={{
                  width: '44px', height: '44px', borderRadius: theme.radius.sm,
                  background: `${cfg.color}12`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', flexShrink: 0,
                }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '4px' }}>
                    <div style={{
                      fontSize: theme.font.size.base,
                      fontWeight: notif.read ? 500 : 700,
                      color: theme.text.primary,
                    }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: theme.font.size.xs, color: theme.text.muted, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {notif.date || (notif.created_at ? format(new Date(notif.created_at), 'MMM d, h:mm a') : '')}
                    </div>
                  </div>
                  <div style={{ fontSize: theme.font.size.sm, color: theme.text.secondary, lineHeight: 1.5 }}>
                    {notif.message}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                      fontSize: '9px', fontWeight: 700, color: cfg.color,
                      background: `${cfg.color}12`, textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {cfg.label}
                    </span>
                    {notif.requires_acknowledgement && !notif.acknowledged && (
                      <button onClick={() => handleAcknowledge(notif.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 12px', borderRadius: '6px',
                          background: `${theme.accent.blue}12`, border: `1px solid ${theme.accent.blue}30`,
                          color: theme.accent.blue, fontSize: '11px', fontWeight: 700,
                          cursor: 'pointer',
                        }}>
                        <Check size={12} /> Acknowledge
                      </button>
                    )}
                    {notif.acknowledged && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontSize: '10px', color: theme.accent.green, fontWeight: 600,
                      }}>
                        <Check size={12} /> Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

export { Notifications as StudentNotifications };
export default Notifications;
