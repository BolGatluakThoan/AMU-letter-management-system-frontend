import { NavLink } from 'react-router-dom';
import { Building2, LayoutDashboard, Mail, Send, BarChart2, ChevronLeft, ChevronRight, FileText, Users, UserCircle, Archive, Settings, MapPin, HelpCircle, Trash2, MessageSquare, Inbox } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/index.jsx';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Sidebar({ collapsed, onToggle, mobileOpen, isMobile }) {
  const { canManageUsers, myDeletedIncoming, myDeletedOutgoing, user, isRecordOfficer } = useApp();
  const { t } = useI18n();
  const w = (isMobile || !collapsed) ? 256 : 68;
  const recycleBinCount = (myDeletedIncoming?.length || 0) + (myDeletedOutgoing?.length || 0);
  const [inboxUnread, setInboxUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const data = await api.getInbox();
        if (!cancelled) setInboxUnread(data.filter(r => !r.isRead).length);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000); // poll every 10s
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const nav = [
    { to: '/',            icon: LayoutDashboard, label: t('dashboard'),    show: true },
    { to: '/incoming',    icon: Mail,            label: t('incoming'),     show: true },
    { to: '/outgoing',    icon: Send,            label: t('outgoing'),     show: true },
    { to: '/inbox',       icon: Inbox,           label: 'My Inbox',        show: true, badge: inboxUnread },
    { to: '/reports',     icon: BarChart2,       label: t('reports'),      show: true },
    { to: '/archive',     icon: Archive,         label: t('archive'),      show: true },
    { to: '/users',       icon: Users,           label: t('users'),        show: canManageUsers },
    { to: '/campuses',    icon: Building2,       label: t('campuses'),     show: isRecordOfficer },
    { to: '/chat',        icon: MessageSquare,   label: t('messages'),     show: true },
    { to: '/recycle-bin', icon: Trash2,          label: t('recycle_bin'),  show: true, badge: recycleBinCount },
    { to: '/settings',    icon: Settings,        label: t('settings'),     show: true },
    { to: '/tracking',    icon: MapPin,          label: t('tracking'),     show: isRecordOfficer },
    { to: '/help',        icon: HelpCircle,      label: t('help'),         show: true },
    { to: '/profile',     icon: UserCircle,      label: t('profile'),      show: true },
  ].filter(item => item.show);

  return (
    <aside style={{
      width: w, height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 300,
      background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)',
      display: 'flex', flexDirection: 'column',
      transition: 'width .22s ease, transform .28s cubic-bezier(.4,0,.2,1)',
      boxShadow: '4px 0 32px rgba(99,102,241,.2)',
      overflowX: 'hidden', overflowY: 'hidden',
      transform: isMobile && !mobileOpen ? 'translateX(-100%)' : 'translateX(0)',
    }}>
      {/* Brand */}
      <div style={{
        height: 60, display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '0 16px' : '0 20px',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        justifyContent: collapsed ? 'center' : 'flex-start', flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(99,102,241,.3), rgba(139,92,246,.2))',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText size={16} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>LMS Portal</div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, whiteSpace: 'nowrap' }}>Letter Management</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 2,
        overflowY: 'auto', overflowX: 'hidden',
        minHeight: 0, /* critical — allows flex child to scroll */
      }}>
        {nav.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 8, textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
              color: isActive ? '#fff' : 'rgba(255,255,255,.55)',
              background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,.5), rgba(139,92,246,.4))' : 'transparent',
              boxShadow: isActive ? '0 2px 12px rgba(99,102,241,.3)' : 'none',
              transition: 'all .15s ease',
              borderLeft: isActive && !collapsed ? '3px solid #a78bfa' : '3px solid transparent',
            })}
            onMouseEnter={e => { if (!e.currentTarget.getAttribute('aria-current')) { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#fff'; }}}
            onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.55)'; }}}
          >
            <span style={{ position: 'relative', flexShrink: 0 }}>
              <Icon size={17} />
              {badge > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -7,
                  background: '#ef4444', color: '#fff',
                  fontSize: 9, fontWeight: 700, borderRadius: 99,
                  minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', lineHeight: 1,
                }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
        <button onClick={onToggle} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '10px 0' : '10px 12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,.4)', borderRadius: 8, fontSize: 13,
          transition: 'all .15s ease',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
