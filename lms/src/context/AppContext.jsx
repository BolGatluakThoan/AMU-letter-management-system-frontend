import { createContext, useContext, useState, useEffect } from 'react';
import { OFFICES as STATIC_OFFICES, ROLES, CAMPUSES } from '../data/mockData';
import { api } from '../lib/api';

export { ROLES, CAMPUSES };

// OFFICES is now dynamic — components should use useApp().offices
// This static export is kept for backward compatibility during transition
export { STATIC_OFFICES as OFFICES };

export const isReadOnly = (role) => false; // All users can register letters

function loadSession() {
  try {
    const token = localStorage.getItem('lms-token');
    if (!token) return null;
    const raw = localStorage.getItem('lms-session');
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.name || !s?.role || !s?.id) { localStorage.removeItem('lms-session'); return null; }
    return s;
  } catch { localStorage.removeItem('lms-session'); return null; }
}
function loadTheme() {
  try { return localStorage.getItem('lms-theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}

const sortNewest = (arr, dateField) =>
  [...arr].sort((a, b) => {
    // Primary: createdAt (MongoDB timestamp) — always accurate for insertion order
    const ca = new Date(a.createdAt || 0);
    const cb = new Date(b.createdAt || 0);
    if (cb - ca !== 0) return cb - ca;
    // Fallback: dateReceived/datePrepared field
    const da = new Date(a[dateField] || 0);
    const db = new Date(b[dateField] || 0);
    return db - da;
  });
const norm = (obj) => obj ? { ...obj, id: obj._id || obj.id } : obj;
const normArr = (arr) => (arr || []).map(norm);

// Map DB field names to app field names for letters
const mapIn = (r) => ({
  ...r,
  id: r._id || r.id,
  refNo: r.refNo,
  senderOrg: r.senderOrg,
  dateReceived: r.dateReceived,
  _fromOffice: r.fromOffice,
  _toOffice: r.toOffice,
  _autoDelivered: r.autoDelivered,
  _linkedOutRef: r.linkedOutRef,
  _forwardedFrom: r.forwardedFrom,
  _forwardChain: r.forwardChain || [],
  _readBy: r.readBy || [],
  _deleted: r.deleted,
  _deletedAt: r.deletedAt,
  _deletedBy: r.deletedBy,
  _deletedByName: r.deletedByName,
  _deletedByRole: r.deletedByRole || '',
  attachments: r.attachments || [],
  receivedBy:  r.receivedBy || '',
  intendedFor: r.intendedFor || '',
  dispatchRef: r.dispatchRef || '',
  stampedBy:   r.stampedBy || '',
  stampedAt:   r.stampedAt || null,
  archivedAt:  r.archivedAt || null,
});

const mapOut = (r) => ({
  ...r,
  id: r._id || r.id,
  refNo: r.refNo,
  referralNo: r.referralNo || '',
  recipientOrg: r.recipientOrg,
  datePrepared: r.datePrepared,
  relatedIncoming: r.relatedIncoming,
  dispatchMethod: r.dispatchMethod,
  trackingNo: r.trackingNo,
  responsibleOfficer: r.responsibleOfficer,
  toOffice: r.toOffice,
  _fromOffice: r.fromOffice,
  _deleted: r.deleted,
  _deletedAt: r.deletedAt,
  _deletedBy: r.deletedBy,
  _deletedByName: r.deletedByName,
  _deletedByRole: r.deletedByRole || '',
  attachments: r.attachments || [],
  copies: r.copies || [],
});

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [users, setUsers]       = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [offices, setOffices]   = useState(STATIC_OFFICES); // start with static, replaced by DB
  const [departments, setDepartments] = useState([]);
  const [retentionDays, setRetentionDays] = useState(30);
  const [user, setUser]   = useState(loadSession);
  const [theme, setTheme] = useState(loadTheme);
  const [loading, setLoading] = useState(() => !!localStorage.getItem('lms-token'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lms-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // Fetch all data when user logs in or page refreshes with valid session
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('lms-token');
    if (!token) { logout(); return; }
    setLoading(true);
    Promise.all([
      api.getIncoming(),
      api.getOutgoing(),
      api.getUsers(),
      api.getAuditLog(),
      api.getOffices().catch(() => []),
      api.getDepartments().catch(() => []),
    ]).then(([inc, out, usr, audit, offs, depts]) => {
      setIncoming(sortNewest(inc.map(mapIn), 'dateReceived'));
      setOutgoing(sortNewest(out.map(mapOut), 'datePrepared'));
      setUsers(normArr(usr));
      setAuditLog(audit);
      setOffices(offs.length > 0 ? offs.map(o => o.name) : STATIC_OFFICES);
      setDepartments(depts.map(d => d.name));
    }).catch(err => {
      console.error(err);
      // If 401, token expired — force logout
      if (err.message?.includes('401') || err.message?.includes('token')) logout();
    }).finally(() => setLoading(false));
  }, [user?.id]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = async (username, password) => {
    try {
      const { token, user: u } = await api.login(username, password);
      localStorage.setItem('lms-token', token);
      const session = { id: u.id || u._id, name: u.name, role: u.role, office: u.office, avatar: u.avatar, email: u.email, canAddUsers: u.canAddUsers, mustChangePassword: u.mustChangePassword, canResetPassword: u.canResetPassword };
      localStorage.setItem('lms-session', JSON.stringify(session));
      setUser(session);
      return { ok: true, mustChangePassword: u.mustChangePassword };
    } catch { return { ok: false }; }
  };

  const logout = () => {
    localStorage.removeItem('lms-session');
    localStorage.removeItem('lms-token');
    setUser(null);
    setIncoming([]); setOutgoing([]); setUsers([]); setAuditLog([]);
  };

  const updateProfile = async (data) => {
    await api.updateUser(user.id, data);
    const updated = { ...user, ...data };
    localStorage.setItem('lms-session', JSON.stringify(updated));
    setUser(updated);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...data } : u));
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const isRecordOfficer = user?.role === 'Record Officer';
  const isAdmin         = isRecordOfficer; // Record Officer is the sole system admin
  const canManageUsers  = isAdmin || ['Dean', 'Director'].includes(user?.role);
  const myOffice        = user?.office;
  const readOnly        = user ? isReadOnly(user.role) : false;
  // Only Record Officer can forward letters
  const canForward      = isRecordOfficer;

  const canSeeIncoming = (l) => {
    if (isRecordOfficer) {
      // Record Officer sees: letters at Record Office + originals they stamped
      // Does NOT see auto-delivered copies sent to other offices (those belong to destination)
      if (l._toOffice === 'Record Office') return true;       // at Record Office queue
      if (!l._autoDelivered) return true;                     // original letters (not system copies)
      if (l._fromOffice === 'Record Office') return true;     // dispatched by Record Office (track what was sent)
      return false;
    }
    if (l._toOffice === myOffice) return true;                // dispatched/forwarded to my office
    if (l._fromOffice === myOffice && !l._autoDelivered) return true; // I registered it
    if (l._fromOffice === myOffice && l._toOffice === 'Record Office') return true; // my outgoing at Record Office
    return false;
  };
  const canSeeOutgoing = (l) => {
    if (isRecordOfficer) return true;
    if (l._fromOffice === myOffice) return true;               // I registered it
    if (l.fromOffice === myOffice) return true;                // fallback — unmapped field
    return false;
  };

  const visibleIncoming = user ? incoming.filter(l => !l._deleted && canSeeIncoming(l)) : incoming.filter(l => !l._deleted);
  const visibleOutgoing = user ? outgoing.filter(l => !l._deleted && canSeeOutgoing(l)) : outgoing.filter(l => !l._deleted);

  const RECORD_OFFICE = 'Record Office';

  // Letters waiting in Record Office that haven't been forwarded yet
  // Exclude CC copies (autoDelivered) — those go directly to offices
  const pendingDispatch = isRecordOfficer
    ? incoming.filter(l => !l._deleted && l._toOffice === RECORD_OFFICE && l.status === 'Registered' && !l._autoDelivered)
    : [];

  const myNotifications = user
    ? isRecordOfficer
      ? pendingDispatch  // Record Officer: all unrouted letters
      : incoming.filter(l =>
          !l._deleted &&
          l._toOffice === myOffice &&
          ['Registered'].includes(l.status) &&
          !(l._readBy || []).includes(myOffice)
        )
    : [];

  // ── Dispatch (Record Officer only) ───────────────────────────────────────
  const dispatchLetter = async (id, toOffice, dispatchRef, note, receivedBy, copies = [], emails = [], staffIds = []) => {
    const { original, forwarded } = await api.dispatchLetter(id, { toOffice, dispatchRef, note, receivedBy, emails, staffIds, copies });
    setIncoming(prev => [
      mapIn(forwarded),
      ...prev.map(l => l.id === id ? mapIn(original) : l),
    ]);
    const letter = incoming.find(l => l.id === id);

    // ── Client-side inbox creation removed — server handles it in background ──
    // NOTE: dispatch does NOT create a new outgoing record — the letter is already
    // in outgoing from when it was registered. Dispatch only routes it.

    // Auto-deliver copies to each tagged CC office — go DIRECTLY, bypass Record Office
    // Skip if deliveryMode === 'inbox' (personal inbox only, no office incoming letter)
    if (letter && copies.length > 0) {
      const fullAttachments = letter.attachments?.length > 0 ? letter.attachments : [];
      for (const copy of copies) {
        if (copy.deliveryMode === 'inbox') continue; // inbox-only: server handles it, no incoming letter
        const office = copy.office || copy.body;
        if (!office) continue;
        try {
          const ccCopy = {
            sender: letter.sender, senderOrg: letter.senderOrg, subject: letter.subject,
            department: letter.department, priority: letter.priority, mode: 'Internal Copy',
            dateReceived: new Date().toISOString().slice(0, 10), status: 'Registered',
            remarks: `ግልባጭ (CC) — dispatched by Record Office${dispatchRef ? ' · Ref: ' + dispatchRef : ''}${copy.receivedBy ? ' · Collected by: ' + copy.receivedBy : ''}`,
            attachments: fullAttachments,
            fromOffice: 'Record Office',
            toOffice: office,
            autoDelivered: true,
            linkedOutRef: dispatchRef || letter.refNo,
            forwardedFrom: letter.refNo,
            receivedBy: copy.receivedBy || '',
            readBy: [],
          };
          const added = await api.addIncoming(ccCopy);
          setIncoming(prev => [mapIn(added), ...prev]);
        } catch {}
      }
    }
  };
  const markLetterRead = async (id) => {
    const letter = incoming.find(l => l.id === id);
    if (!letter) return;
    const readBy = letter._readBy || [];
    if (readBy.includes(myOffice)) return;
    const updated = [...readBy, myOffice];
    await api.updateIncoming(id, { readBy: updated });
    setIncoming(prev => prev.map(l => l.id === id ? { ...l, _readBy: updated } : l));
  };

  // ── Forward ───────────────────────────────────────────────────────────────
  const forwardLetter = async (letter, toOffice, note) => {
    const forwarded = {
      sender: letter.sender, senderOrg: letter.senderOrg, subject: letter.subject,
      department: toOffice, priority: letter.priority, mode: 'Internal Forward',
      dateReceived: new Date().toISOString().slice(0, 10), status: 'Registered',
      remarks: `Forwarded from ${myOffice}${note ? ': ' + note : ''}`,
      // Preserve ALL attachments from original letter
      attachments: letter.attachments?.length > 0 ? letter.attachments : (letter.attachment ? [letter.attachment] : []),
      fromOffice: myOffice, toOffice, autoDelivered: true,
      linkedOutRef: letter.refNo, forwardedFrom: letter.refNo,
      forwardChain: [...(letter._forwardChain || []), letter.refNo], readBy: [],
    };
    const [fwd] = await Promise.all([
      api.addIncoming(forwarded),
      api.updateIncoming(letter.id, { status: 'Forwarded', forwardedTo: toOffice }),
    ]);
    setIncoming(prev => [
      ...prev.map(l => l.id === letter.id ? { ...l, status: 'Forwarded', _forwardedTo: toOffice } : l),
      mapIn(fwd),
    ]);
  };

  // ── Incoming CRUD ─────────────────────────────────────────────────────────
  // All new incoming letters land in Record Office first for routing
  const addIncoming = async (letter) => {
    const data = await api.addIncoming({
      ...letter,
      fromOffice: myOffice,
      toOffice: RECORD_OFFICE,
      readBy: [],
    });
    // Add to top of list immediately
    setIncoming(prev => [mapIn(data), ...prev]);
  };
  const updateIncoming = async (id, data) => {
    await api.updateIncoming(id, data);
    setIncoming(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  };
  const deleteIncoming = async (id) => {
    if (!id || id === 'undefined') return;
    try {
      const data = await api.deleteIncoming(id);
      setIncoming(prev => prev.map(l => l.id === id ? mapIn(data) : l));
    } catch (err) {
      console.error('deleteIncoming failed:', err.message);
    }
  };
  const restoreIncoming = async (id) => {
    const data = await api.restoreIncoming(id);
    setIncoming(prev => prev.map(l => l.id === id ? mapIn(data) : l));
  };
  const permanentDeleteIncoming = async (id) => {
    await api.permanentDeleteIncoming(id);
    setIncoming(prev => prev.filter(l => l.id !== id));
  };

  // ── Outgoing CRUD ─────────────────────────────────────────────────────────
  // Outgoing letters create an incoming entry in Record Office for routing
  const addOutgoing = async (letter) => {
    const data = await api.addOutgoing({ ...letter, fromOffice: myOffice });
    setOutgoing(prev => [mapOut(data), ...prev]);
    // Refresh incoming — server creates a Record Office entry automatically
    const inc = await api.getIncoming();
    setIncoming(sortNewest(inc.map(mapIn), 'dateReceived'));
    // NOTE: CC copies are NOT auto-created here — they are created when
    // Record Office dispatches the letter to the destination office.
  };
  const updateOutgoing = async (id, data) => {
    await api.updateOutgoing(id, data);
    setOutgoing(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  };
  const deleteOutgoing = async (id) => {
    const data = await api.deleteOutgoing(id);
    setOutgoing(prev => prev.map(l => l.id === id ? mapOut(data) : l));
  };
  const restoreOutgoing = async (id) => {
    const data = await api.restoreOutgoing(id);
    setOutgoing(prev => prev.map(l => l.id === id ? mapOut(data) : l));
  };
  const permanentDeleteOutgoing = async (id) => {
    await api.permanentDeleteOutgoing(id);
    setOutgoing(prev => prev.filter(l => l.id !== id));
  };

  // ── Users CRUD ────────────────────────────────────────────────────────────
  const visibleUsers = isAdmin ? users : users.filter(u => u.office === myOffice);

  const addUser = async (userData) => {
    const data = await api.addUser(userData);
    setUsers(prev => [...prev, norm(data)]);
  };
  const updateUser = async (id, data) => {
    await api.updateUser(id, data);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  };
  const deleteUser = async (id) => {
    if (id === user?.id) return;
    await api.deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // ── Recycle bin views ─────────────────────────────────────────────────────
  const deletedIncoming    = incoming.filter(l => l._deleted);
  const deletedOutgoing    = outgoing.filter(l => l._deleted);
  // "My deleted" = letters I personally deleted (by name), not just my office
  const myDeletedIncoming  = deletedIncoming.filter(l => l._deletedByName === user?.name || l._deletedBy === myOffice);
  const myDeletedOutgoing  = deletedOutgoing.filter(l => l._deletedByName === user?.name || l._deletedBy === myOffice);
  const allDeletedIncoming = (isAdmin || isRecordOfficer) ? deletedIncoming : myDeletedIncoming;
  const allDeletedOutgoing = (isAdmin || isRecordOfficer) ? deletedOutgoing : myDeletedOutgoing;

  return (
    <AppContext.Provider value={{
      user, login, logout, updateProfile,
      theme, toggleTheme, loading,
      users: visibleUsers, allUsers: users, addUser, updateUser, deleteUser, canManageUsers,
      incoming: visibleIncoming, outgoing: visibleOutgoing, readOnly,
      addIncoming, updateIncoming, deleteIncoming,
      addOutgoing, updateOutgoing, deleteOutgoing,
      markLetterRead, forwardLetter, dispatchLetter,
      myOffice, isRecordOfficer, isAdmin, canForward,
      myNotifications, pendingDispatch,
      auditLog, retentionDays, setRetentionDays,
      offices, departments,
      addOffice: async (data) => { const o = await api.addOffice(data); setOffices(prev => [...prev, o.name].sort()); return o; },
      deleteOffice: async (id) => { await api.deleteOffice(id); const offs = await api.getOffices(); setOffices(offs.map(o => o.name)); },
      addDepartment: async (data) => { const d = await api.addDepartment(data); setDepartments(prev => [...prev, d.name].sort()); return d; },
      deleteDepartment: async (id) => { await api.deleteDepartment(id); const depts = await api.getDepartments(); setDepartments(depts.map(d => d.name)); },
      refreshOffices: async () => { const offs = await api.getOffices(); setOffices(offs.map(o => o.name)); },
      refreshDepartments: async () => { const depts = await api.getDepartments(); setDepartments(depts.map(d => d.name)); },
      myDeletedIncoming, myDeletedOutgoing,
      allDeletedIncoming, allDeletedOutgoing,
      restoreIncoming, restoreOutgoing,
      permanentDeleteIncoming, permanentDeleteOutgoing,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
