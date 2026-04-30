import { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, ShieldAlert, CheckSquare, Square, MinusSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/index.jsx';
import { api } from '../lib/api';

function daysRemaining(deletedAt, retentionDays) {
  if (!deletedAt) return retentionDays;
  const diff = Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000);
  return retentionDays - diff;
}

function Badge({ days }) {
  const color = days <= 3 ? '#ef4444' : days <= 7 ? '#f97316' : '#6b7280';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: color + '18', padding: '2px 7px', borderRadius: 99 }}>
      {days <= 0 ? 'Expiring' : `${days}d left`}
    </span>
  );
}

function EmptyState({ label }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted, #9ca3af)' }}>
      <Trash2 size={48} style={{ opacity: 0.25, marginBottom: 12 }} />
      <div style={{ fontSize: 15, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>Deleted letters will appear here</div>
    </div>
  );
}

const btnStyle = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
  fontSize: 12, fontWeight: 500, background: color + '18', color,
});

function LetterTable({ items, retentionDays, onRestore, onDelete, onBulkDelete, showDept }) {
  const [confirmId, setConfirmId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const { t } = useI18n();

  // Reset selection when items change
  useEffect(() => { setSelected(new Set()); }, [items]);

  if (!items.length) return <EmptyState label="Recycle bin is empty" />;

  const allIds = items.map(i => `${i._type}-${i.id}`);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = allIds.some(id => selected.has(id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const toggleOne = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleBulkDelete = () => {
    const toDelete = items.filter(i => selected.has(`${i._type}-${i.id}`));
    toDelete.forEach(item => onDelete(item));
    setSelected(new Set());
    setConfirmBulk(false);
  };

  return (
    <div>
      {/* Bulk action bar — shown when anything is selected */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px', background: '#fef2f2',
          borderBottom: '1px solid #fecaca',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>
            {selected.size} item{selected.size > 1 ? 's' : ''} selected
          </span>
          <div style={{ flex: 1 }} />
          {confirmBulk ? (
            <>
              <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                Permanently delete {selected.size} item{selected.size > 1 ? 's' : ''}?
              </span>
              <button onClick={handleBulkDelete} style={btnStyle('#ef4444')}>
                <Trash2 size={13} /> Yes, Delete All
              </button>
              <button onClick={() => setConfirmBulk(false)} style={btnStyle('#6b7280')}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setConfirmBulk(true)} style={{ ...btnStyle('#ef4444'), fontWeight: 700 }}>
                <Trash2 size={13} /> Delete Selected ({selected.size})
              </button>
              <button onClick={() => setSelected(new Set())} style={btnStyle('#6b7280')}>
                Clear Selection
              </button>
            </>
          )}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border, #e5e7eb)', color: 'var(--text-muted, #6b7280)', textAlign: 'left' }}>
              {/* Select-all checkbox */}
              <th style={{ padding: '8px 12px', width: 36 }}>
                <button onClick={toggleAll} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: someSelected ? '#6366f1' : allSelected ? '#6366f1' : 'var(--text-faint)' }}>
                  {allSelected ? <CheckSquare size={16} /> : someSelected ? <MinusSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Type</th>
              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Reference</th>
              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Subject</th>
              {showDept && <th style={{ padding: '8px 12px', fontWeight: 600 }}>Sender / From</th>}
              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Deleted By</th>
              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Date Deleted</th>
              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Expires</th>
              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const key = `${item._type}-${item.id}`;
              const days = daysRemaining(item._deletedAt, retentionDays);
              const isChecked = selected.has(key);
              return (
                <tr key={key} style={{
                  borderBottom: '1px solid var(--border, #f3f4f6)',
                  background: isChecked ? 'rgba(239,68,68,.04)' : undefined,
                }}>
                  {/* Row checkbox */}
                  <td style={{ padding: '10px 12px' }}>
                    <button onClick={() => toggleOne(key)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: isChecked ? '#ef4444' : 'var(--text-faint)' }}>
                      {isChecked ? <CheckSquare size={15} /> : <Square size={15} />}
                    </button>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                      background: item._type === 'incoming' ? '#dbeafe' : '#dcfce7',
                      color: item._type === 'incoming' ? '#1d4ed8' : '#15803d',
                    }}>
                      {item._type === 'incoming' ? 'Incoming' : 'Outgoing'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{item.refNo}</td>
                  <td style={{ padding: '10px 12px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subject}</td>
                  {showDept && (
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{item.sender || item.recipient || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{item.senderOrg || item.recipientOrg || ''}</div>
                    </td>
                  )}
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{item._deletedByName || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                      {item._deletedByRole && (
                        <span style={{ marginRight: 6, color: '#6366f1', fontWeight: 600 }}>{item._deletedByRole}</span>
                      )}
                      {item._deletedBy}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>{item._deletedAt ? new Date(item._deletedAt).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '10px 12px' }}><Badge days={days} /></td>
                  <td style={{ padding: '10px 12px' }}>
                    {confirmId === key ? (
                      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#ef4444' }}>Confirm?</span>
                        <button onClick={() => { onDelete(item); setConfirmId(null); }} style={btnStyle('#ef4444')}>Yes</button>
                        <button onClick={() => setConfirmId(null)} style={btnStyle('#6b7280')}>No</button>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => onRestore(item)} title="Restore" style={btnStyle('#6366f1')}>
                          <RotateCcw size={13} /> {t('restore')}
                        </button>
                        <button onClick={() => setConfirmId(key)} title="Delete permanently" style={btnStyle('#ef4444')}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RecycleBin() {
  const {
    restoreIncoming, restoreOutgoing,
    permanentDeleteIncoming, permanentDeleteOutgoing,
    retentionDays, isRecordOfficer, user,
  } = useApp();
  const { t } = useI18n();

  const [tab, setTab] = useState('mine');
  const [allDeleted, setAllDeleted] = useState([]);   // server-fetched, Record Officer
  const [myDeleted, setMyDeleted] = useState([]);     // server-fetched, current user
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const mapItem = (l, type) => ({
        ...l,
        id: l._id || l.id,
        _type: type,
        _deletedAt: l.deletedAt || l._deletedAt,
        _deletedBy: l.deletedBy || l._deletedBy,
        _deletedByName: l.deletedByName || l._deletedByName,
        _deletedByRole: l.deletedByRole || l._deletedByRole || '',
      });

      if (isRecordOfficer) {
        // Record Officer: fetch ALL deleted letters
        let inc = [], out = [];
        try {
          [inc, out] = await Promise.all([
            api.getDeletedIncoming(),
            api.getDeletedOutgoing(),
          ]);
        } catch {
          // Fallback: fetch all and filter by deleted flag
          const [allInc, allOut] = await Promise.all([
            api.getIncoming(),
            api.getOutgoing(),
          ]);
          inc = allInc.filter(l => l.deleted === true || l._deleted === true);
          out = allOut.filter(l => l.deleted === true || l._deleted === true);
        }
        // Also try fallback if endpoints returned empty but full list has deleted items
        if (inc.length === 0 && out.length === 0) {
          const [allInc, allOut] = await Promise.all([
            api.getIncoming(),
            api.getOutgoing(),
          ]);
          inc = allInc.filter(l => l.deleted === true || l._deleted === true);
          out = allOut.filter(l => l.deleted === true || l._deleted === true);
        }
        const all = [
          ...inc.map(l => mapItem(l, 'incoming')),
          ...out.map(l => mapItem(l, 'outgoing')),
        ].sort((a, b) => new Date(b._deletedAt || 0) - new Date(a._deletedAt || 0));
        setAllDeleted(all);
        setMyDeleted(all.filter(l => l._deletedByName === user?.name));
      } else {
        // Other staff: only their own deleted outgoing letters
        let out = [];
        try {
          out = await api.getDeletedOutgoing();
        } catch {
          const allOut = await api.getOutgoing();
          out = allOut.filter(l => (l.deleted === true || l._deleted === true) && l.deletedByName === user?.name);
        }
        if (out.length === 0) {
          const allOut = await api.getOutgoing();
          out = allOut.filter(l => (l.deleted === true || l._deleted === true) && l.deletedByName === user?.name);
        }
        const mine = out
          .map(l => mapItem(l, 'outgoing'))
          .sort((a, b) => new Date(b._deletedAt || 0) - new Date(a._deletedAt || 0));
        setMyDeleted(mine);
      }
    } catch (e) {
      console.error('RecycleBin load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecordOfficer, user?.name]);

  // Auto-purge expired items
  useEffect(() => {
    const expired = [...myDeleted, ...allDeleted].filter(
      item => daysRemaining(item._deletedAt, retentionDays) <= 0
    );
    expired.forEach(item => {
      if (item._type === 'incoming') permanentDeleteIncoming(item.id);
      else permanentDeleteOutgoing(item.id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestore = async (item) => {
    if (item._type === 'incoming') await restoreIncoming(item.id);
    else await restoreOutgoing(item.id);
    setAllDeleted(prev => prev.filter(l => l.id !== item.id));
    setMyDeleted(prev => prev.filter(l => l.id !== item.id));
  };

  const handleDelete = async (item) => {
    if (item._type === 'incoming') await permanentDeleteIncoming(item.id);
    else await permanentDeleteOutgoing(item.id);
    setAllDeleted(prev => prev.filter(l => l.id !== item.id));
    setMyDeleted(prev => prev.filter(l => l.id !== item.id));
  };

  const activeItems = tab === 'mine' ? myDeleted : allDeleted;

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Trash2 size={22} color="#6366f1" />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t('recycle_bin_title')}</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted, #6b7280)' }}>
              Items are permanently deleted after {retentionDays} days
            </p>
          </div>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)', background:'none', cursor:'pointer', fontSize:12, color:'var(--text-muted)' }}>
          {loading ? '↻ Loading...' : '↻ Refresh'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border, #e5e7eb)' }}>
        <TabBtn active={tab === 'mine'} onClick={() => setTab('mine')}>
          {t('my_deleted')} ({myDeleted.length})
        </TabBtn>
        {isRecordOfficer && (
          <TabBtn active={tab === 'all'} onClick={() => setTab('all')}>
            <ShieldAlert size={13} style={{ marginRight: 4 }} />
            {t('system_recycle')} ({allDeleted.length})
          </TabBtn>
        )}
      </div>

      <div style={{ background: 'var(--card-bg, #fff)', borderRadius: 10, border: '1px solid var(--border, #e5e7eb)', overflow: 'hidden' }}>
        <LetterTable
          items={activeItems}
          retentionDays={retentionDays}
          onRestore={handleRestore}
          onDelete={handleDelete}
          showDept={tab === 'all'}
        />
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
      background: 'none', borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
      color: active ? '#6366f1' : 'var(--text-muted, #6b7280)',
      marginBottom: -1,
    }}>
      {children}
    </button>
  );
}
