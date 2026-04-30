import { Bell, Search, ChevronDown, LogOut, User, Settings, Sun, Moon, Mail, Clock, CheckCheck, MessageSquare } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { useI18n } from '../i18n/index.jsx';

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(); };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

export default function Navbar({ mobileCompact }) {
  const { user, logout, myNotifications, theme, toggleTheme } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('lms-notif-read') || '[]')); }
    catch { return new Set(); }
  });

  // Poll chat unread count every 5s
  const loadChatUnread = useCallback(async () => {
    try {
      const convos = await api.getConversations();
      const total = Object.values(convos).reduce((s, c) => s + (c.unread || 0), 0);
      setChatUnread(total);
    } catch {}
  }, []);

  useEffect(() => {
    loadChatUnread();
    const t = setInterval(loadChatUnread, 5000);
    return () => clearInterval(t);
  }, [loadChatUnread]);

  const notifRef = useRef();
  const profileRef = useRef();
  useClickOutside(notifRef, () => setShowNotif(false));
  useClickOutside(profileRef, () => setShowProfile(false));

  // Only letters addressed TO my office — already filtered by context
  const notifications = (myNotifications || []).map(l => ({
    ...l,
    _type: l.priority === 'Urgent' ? 'urgent' : 'new',
    _key: `notif-${l.id}`,
  }));
  const unreadCount = notifications.filter(n => !readIds.has(n._key)).length;

  const markRead = (key) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(key);
      localStorage.setItem('lms-notif-read', JSON.stringify([...next]));
      return next;
    });
  };

  const markAllRead = () => {
    const allKeys = notifications.map(n => n._key);
    setReadIds(prev => {
      const next = new Set([...prev, ...allKeys]);
      localStorage.setItem('lms-notif-read', JSON.stringify([...next]));
      return next;
    });
  };

  const handleNotifClick = (n) => {
    markRead(n._key);
    setShowNotif(false);
    navigate(`/incoming?id=${n.id}`);
  };

  const handleLogout = () => {
    setShowProfile(false);
    logout();
  };

  // Mobile compact — only bell + avatar
  if (mobileCompact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button className="btn btn-ghost btn-icon" onClick={toggleTheme} style={{ color: 'var(--text-muted)' }}>
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setShowNotif(v => !v)} style={{ position: 'relative', color: 'var(--text-muted)' }}>
            <Bell size={17} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 14, height: 14, borderRadius: 99, background: '#ef4444', border: '2px solid var(--surface)', fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div style={{ position: 'fixed', right: 8, top: 60, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', width: 'calc(100vw - 16px)', maxWidth: 340, zIndex: 400, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>{t('notifications')}</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifications.length === 0
                  ? <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>No notifications</div>
                  : notifications.map(n => (
                    <button key={n._key} onClick={() => handleNotifClick(n)} style={{ display: 'flex', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{n.refNo}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.subject}</div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowProfile(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1e40af,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
              {user?.avatar || 'U'}
            </div>
          </button>
          {showProfile && (
            <div style={{ position: 'fixed', right: 8, top: 60, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', minWidth: 200, zIndex: 400, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>{user?.role}</div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{user?.office}</div>
              </div>
              {[{ label: 'My Profile', to: '/profile' }, { label: 'Settings', to: '/settings' }].map(({ label, to }) => (
                <button key={label} onClick={() => { setShowProfile(false); navigate(to); }} style={{ display: 'flex', width: '100%', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}>{label}</button>
              ))}
              <div style={{ height: 1, background: 'var(--border)' }} />
              <button onClick={handleLogout} style={{ display: 'flex', width: '100%', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: '#ef4444' }}>{t('sign_out')}</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <header style={{
      height: 64, background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
      borderBottom: '1px solid #e0e7ff',
      display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
      position: 'sticky', top: 0, zIndex: 200,
      boxShadow: '0 2px 12px rgba(99,102,241,.08)',
    }}>
      {/* Search — hidden on mobile */}
      <div className="navbar-search" style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
        <input className="form-control" placeholder="Search letters, references..."
          style={{ paddingLeft: 34, background: 'var(--surface-2)', height: 38, fontSize: 13 }} />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>

        {/* Theme toggle */}
        <button className="btn btn-ghost btn-icon" onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ color: 'var(--text-muted)' }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Chat notifications */}
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/chat')}
          title="Messages" style={{ position:'relative', color:'var(--text-muted)' }}>
          <MessageSquare size={18}/>
          {chatUnread > 0 && (
            <span style={{ position:'absolute', top:4, right:4, minWidth:16, height:16, borderRadius:99, background:'#8b5cf6', border:'2px solid var(--surface)', fontSize:9, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px' }}>
              {chatUnread > 9 ? '9+' : chatUnread}
            </span>
          )}
        </button>

        {/* Notification bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setShowNotif(v => !v)}
            style={{ position: 'relative', color: 'var(--text-muted)' }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16,
                borderRadius: 99, background: '#ef4444', border: '2px solid var(--surface)',
                fontSize: 9, fontWeight: 700, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
              }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotif && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,.15)', width: 340, zIndex: 400,
              overflow: 'hidden', animation: 'slideUp .15s ease',
            }}>
              {/* Header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t('notifications')}</div>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#fee2e2', color: '#991b1b' }}>
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                    <Bell size={28} style={{ margin: '0 auto 10px', opacity: .3, display: 'block' }} />
                    <div>No notifications</div>
                  </div>
                ) : notifications.map(n => {
                  const isRead = readIds.has(n._key);
                  return (
                    <button key={n._key} onClick={() => handleNotifClick(n)} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%',
                      padding: '12px 16px',
                      background: isRead ? 'transparent' : 'rgba(99,102,241,.04)',
                      border: 'none', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)', textAlign: 'left',
                      transition: 'background .12s', opacity: isRead ? .55 : 1,
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = isRead ? 'transparent' : 'rgba(99,102,241,.04)'}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: isRead ? 'var(--surface-2)' : (n._type === 'urgent' ? '#fee2e2' : '#eef2ff'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isRead
                          ? <CheckCheck size={15} color="var(--text-faint)" />
                          : n._type === 'urgent'
                            ? <Clock size={16} color="#ef4444" />
                            : <Mail size={16} color="#6366f1" />
                        }
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <div style={{ fontSize: 12, fontWeight: isRead ? 500 : 700, color: 'var(--text)' }}>
                            {n._type === 'urgent' ? '⚠ Urgent: ' : 'New letter: '}{n.refNo}
                          </div>
                          {!isRead && (
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: n._type === 'urgent' ? '#ef4444' : '#6366f1', flexShrink: 0 }} />
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.subject}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 3 }}>
                          From: {n.sender} · {n.dateReceived}
                          {isRead && <span style={{ marginLeft: 6, color: '#10b981', fontWeight: 600 }}>· Read</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    {notifications.length - unreadCount} of {notifications.length} read
                  </span>
                  <button onClick={() => { setShowNotif(false); navigate('/incoming'); }} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, color: '#6366f1', fontWeight: 600,
                  }}>
                    View all →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 6px' }} />

        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowProfile(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px',
            borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--surface)',
            cursor: 'pointer', transition: 'all .15s ease',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg,#1e40af,#3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
              overflow: 'hidden',
            }}>
              {user?.avatarPhoto
                ? <img src={user.avatarPhoto} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user?.avatar || 'U')}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>{user?.office || ''}</div>
            </div>
            <ChevronDown size={13} color="var(--text-faint)" style={{ transition: 'transform .15s', transform: showProfile ? 'rotate(180deg)' : 'none' }} />
          </button>

          {showProfile && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,.15)', minWidth: 220, zIndex: 400,
              overflow: 'hidden', animation: 'slideUp .15s ease',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#1e40af,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                    {user?.avatarPhoto
                      ? <img src={user.avatarPhoto} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (user?.avatar || 'U')}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: '#1e40af', fontWeight: 600, marginTop: 2 }}>{user?.role}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>{user?.office}</div>
                  </div>
                </div>
              </div>
              {[{ icon: User, label: t('profile'), to: '/profile' }, { icon: Settings, label: t('settings'), to: '/settings' }].map(({ icon: Icon, label, to }) => (
                <button key={label} onClick={() => { setShowProfile(false); if (to) navigate(to); }} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 16px', background: 'none', border: 'none',
                  fontSize: 13, cursor: 'pointer', color: 'var(--text)', transition: 'background .12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Icon size={14} color="var(--text-muted)" /> {label}
                </button>
              ))}
              <div style={{ height: 1, background: 'var(--border)' }} />
              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 16px', background: 'none', border: 'none',
                fontSize: 13, cursor: 'pointer', color: '#ef4444', transition: 'background .12s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
