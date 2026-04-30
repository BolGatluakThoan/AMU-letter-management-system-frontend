import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, Download, Eye, ArchiveIcon, FileText, Send, Mail,
         CheckCircle, Clock, AlertTriangle, Lock, Paperclip, ChevronLeft,
         ChevronRight, X, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import FileViewer from '../components/FileViewer';
import { useI18n } from '../i18n/index.jsx';

const ITEMS_PER_PAGE = 15;

const statusIcon = {
  Closed:    <CheckCircle size={14} color="#10b981" />,
  Responded: <CheckCircle size={14} color="#6366f1" />,
  Delivered: <CheckCircle size={14} color="#10b981" />,
  Sent:      <Send size={14} color="#3b82f6" />,
  Forwarded: <Share2 size={14} color="#f59e0b" />,
  'Under Review': <Clock size={14} color="#f59e0b" />,
  Registered: <Mail size={14} color="#6366f1" />,
  Draft:     <FileText size={14} color="#94a3b8" />,
  Approved:  <CheckCircle size={14} color="#0891b2" />,
};

const priorityIcon = {
  Urgent:       <AlertTriangle size={13} color="#ef4444" />,
  Confidential: <Lock size={13} color="#8b5cf6" />,
  Normal:       null,
};

function fmt(b) {
  if (!b) return '';
  if (b < 1024) return b + ' B';
  if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
  return (b/(1024*1024)).toFixed(1) + ' MB';
}

export default function Archive() {
  const { incoming, outgoing, myOffice, isRecordOfficer } = useApp();
  const { t } = useI18n();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [viewLetter, setViewLetter] = useState(null);
  const [viewFile, setViewFile] = useState(null);

  // Combine all letters for archive
  const allLetters = useMemo(() => {
    const inc = incoming.map(l => ({ ...l, _dir: 'incoming' }));
    const out = outgoing.map(l => ({ ...l, _dir: 'outgoing' }));
    return [...inc, ...out].sort((a, b) => {
      const da = a.dateReceived || a.datePrepared || '';
      const db = b.dateReceived || b.datePrepared || '';
      return db.localeCompare(da);
    });
  }, [incoming, outgoing]);

  const tabCounts = useMemo(() => ({
    all: allLetters.length,
    incoming: allLetters.filter(l => l._dir === 'incoming').length,
    outgoing: allLetters.filter(l => l._dir === 'outgoing').length,
    closed: allLetters.filter(l => ['Closed','Delivered','Responded'].includes(l.status)).length,
    urgent: allLetters.filter(l => l.priority === 'Urgent').length,
    attachments: allLetters.filter(l => l.attachment).length,
  }), [allLetters]);

  const filtered = useMemo(() => {
    let list = allLetters;
    if (tab === 'incoming') list = list.filter(l => l._dir === 'incoming');
    else if (tab === 'outgoing') list = list.filter(l => l._dir === 'outgoing');
    else if (tab === 'closed') list = list.filter(l => ['Closed','Delivered','Responded'].includes(l.status));
    else if (tab === 'urgent') list = list.filter(l => l.priority === 'Urgent');
    else if (tab === 'attachments') list = list.filter(l => l.attachment);
    if (filterStatus) list = list.filter(l => l.status === filterStatus);
    if (filterPriority) list = list.filter(l => l.priority === filterPriority);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.refNo?.toLowerCase().includes(q) ||
        l.subject?.toLowerCase().includes(q) ||
        l.sender?.toLowerCase().includes(q) ||
        l.recipient?.toLowerCase().includes(q) ||
        l.department?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allLetters, tab, search, filterStatus, filterPriority]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map(l => l.id + l._dir)));
  };

  const exportCSV = () => {
    const rows = [['Ref No','Type','Date','From/To','Subject','Department','Priority','Status','Has File']];
    filtered.forEach(l => rows.push([
      l.refNo, l._dir === 'incoming' ? 'Incoming' : 'Outgoing',
      l.dateReceived || l.datePrepared || '',
      l._dir === 'incoming' ? (l.sender || '') : (l.recipient || ''),
      l.subject || '', l.department || '', l.priority || '', l.status || '',
      l.attachment ? 'Yes' : 'No',
    ]));
    const csv = rows.map(r => r.map(c => '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'archive-export.csv';
    a.click();
  };

  const tabStyle = (t) => ({
    padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    borderBottom: tab === t ? '2px solid #1e40af' : '2px solid transparent',
    color: tab === t ? '#1e40af' : 'var(--text-muted)',
    background: 'none', transition: 'all .15s', whiteSpace: 'nowrap',
    display: 'flex', alignItems: 'center', gap: 6,
  });

  const Badge = ({ n, color = '#1e40af' }) => n > 0 ? (
    <span style={{ background: color, color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>{n > 99 ? '99+' : n}</span>
  ) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1e3a8a,#1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArchiveIcon size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t('archive_records')}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{allLetters.length} total records · {myOffice}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> {t('export_csv')}
          </button>
        </div>
      </div>

      <div className="card">
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px', overflowX: 'auto', gap: 4 }}>
          <button style={tabStyle('all')} onClick={() => { setTab('all'); setPage(1); }}>
            {t('all_records')} <Badge n={tabCounts.all} />
          </button>
          <button style={tabStyle('incoming')} onClick={() => { setTab('incoming'); setPage(1); }}>
            <Mail size={13} /> Incoming <Badge n={tabCounts.incoming} color="#6366f1" />
          </button>
          <button style={tabStyle('outgoing')} onClick={() => { setTab('outgoing'); setPage(1); }}>
            <Send size={13} /> Outgoing <Badge n={tabCounts.outgoing} color="#0891b2" />
          </button>
          <button style={tabStyle('closed')} onClick={() => { setTab('closed'); setPage(1); }}>
            <CheckCircle size={13} /> {t('completed')} <Badge n={tabCounts.closed} color="#10b981" />
          </button>
          <button style={tabStyle('urgent')} onClick={() => { setTab('urgent'); setPage(1); }}>
            <AlertTriangle size={13} /> Urgent <Badge n={tabCounts.urgent} color="#ef4444" />
          </button>
          <button style={tabStyle('attachments')} onClick={() => { setTab('attachments'); setPage(1); }}>
            <Paperclip size={13} /> {t('with_files')} <Badge n={tabCounts.attachments} color="#8b5cf6" />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input className="form-control" placeholder={t('search_ref')} value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 32, height: 36, fontSize: 13 }} />
          </div>
          <select className="form-control" style={{ width: 150, height: 36, fontSize: 13 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">{t('all_statuses')}</option>
            {['Registered','Forwarded','Under Review','Responded','Closed','Draft','Approved','Sent','Delivered'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="form-control" style={{ width: 140, height: 36, fontSize: 13 }} value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }}>
            <option value="">{t('all_priorities')}</option>
            {['Normal','Urgent','Confidential'].map(p => <option key={p}>{p}</option>)}
          </select>
          {(search || filterStatus || filterPriority) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); setPage(1); }}>
              <X size={13} /> Clear
            </button>
          )}
          {selected.size > 0 && (
            <div style={{ marginLeft: 'auto', fontSize: 13, color: '#1e40af', fontWeight: 600 }}>
              {selected.size} selected
            </div>
          )}
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={selected.size === paginated.length && paginated.length > 0}
                    onChange={toggleAll} style={{ cursor: 'pointer' }} />
                </th>
                <th style={{ width: 28 }}></th>
                <th style={{ width: 28 }}></th>
                <th>Ref No.</th>
                <th>Date</th>
                <th>From / To</th>
                <th>Subject</th>
                <th>Department</th>
                <th>Previous Process</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 48, color: 'var(--text-faint)' }}>
                  <ArchiveIcon size={32} style={{ margin: '0 auto 12px', opacity: .3, display: 'block' }} />
                  No records found
                </td></tr>
              ) : paginated.map(l => {
                const key = l.id + l._dir;
                const isIn = l._dir === 'incoming';
                const date = l.dateReceived || l.datePrepared || '';
                const fromTo = isIn ? (l.sender || l.senderOrg || '-') : (l.recipient || l.recipientOrg || '-');
                const prevProcess = isIn ? (l._fromOffice || l.senderOrg || '-') : (l.toOffice || l.recipientOrg || '-');
                return (
                  <tr key={key} style={{ background: selected.has(key) ? 'rgba(30,64,175,.04)' : undefined, cursor: 'pointer' }}
                    onClick={() => setViewLetter(l)}>
                    <td onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(key)} onChange={() => toggleSelect(key)} style={{ cursor: 'pointer' }} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {isIn
                          ? <Mail size={13} color="#6366f1" title="Incoming" />
                          : <Send size={13} color="#0891b2" title="Outgoing" />}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {statusIcon[l.status] || null}
                        {priorityIcon[l.priority] || null}
                        {l.attachment && <Paperclip size={12} color="#8b5cf6" title="Has attachment" />}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#1e40af', fontSize: 13 }}>{l.refNo}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{date}</td>
                    <td style={{ fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{fromTo.length > 22 ? fromTo.slice(0, 22) + '…' : fromTo}</div>
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{l.subject}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.department}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {prevProcess.length > 28 ? prevProcess.slice(0, 28) + '…' : prevProcess}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => setViewLetter(l)}>
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            Display items {Math.min((safePage-1)*ITEMS_PER_PAGE+1, filtered.length)} - {Math.min(safePage*ITEMS_PER_PAGE, filtered.length)} | Total of {filtered.length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(1)} disabled={safePage === 1}>First</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={safePage === 1}>
              <ChevronLeft size={14} /> Prev
            </button>
            {Array.from({ length: Math.min(8, totalPages) }, (_, i) => {
              const pg = totalPages <= 8 ? i+1 : Math.max(1, Math.min(safePage-3, totalPages-7)) + i;
              return (
                <button key={pg} onClick={() => setPage(pg)} style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: pg === safePage ? 700 : 400,
                  background: pg === safePage ? '#1e40af' : 'transparent', color: pg === safePage ? '#fff' : 'var(--text-muted)',
                }}>{pg}</button>
              );
            })}
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={safePage === totalPages}>
              Next <ChevronRight size={14} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>Last</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {viewLetter && createPortal(
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewLetter(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {viewLetter._dir === 'incoming'
                    ? <Mail size={16} color="#6366f1" />
                    : <Send size={16} color="#0891b2" />}
                  <h2 style={{ fontSize: 17, fontWeight: 700 }}>{viewLetter.refNo}</h2>
                  {viewLetter.priority === 'Urgent' && <span className="badge badge-warning">Urgent</span>}
                  {viewLetter.priority === 'Confidential' && <span className="badge badge-danger">Confidential</span>}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {viewLetter._dir === 'incoming' ? 'Incoming Letter' : 'Outgoing Letter'} · {viewLetter.dateReceived || viewLetter.datePrepared}
                </p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewLetter(null)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              {/* Type banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderRadius: 8, marginBottom: 20,
                background: viewLetter._dir === 'incoming' ? '#eef2ff' : '#e0f2fe',
                border: `1px solid ${viewLetter._dir === 'incoming' ? '#c7d2fe' : '#bae6fd'}`,
              }}>
                {viewLetter._dir === 'incoming'
                  ? <Mail size={15} color="#6366f1"/>
                  : <Send size={15} color="#0891b2"/>}
                <span style={{ fontSize: 13, fontWeight: 600, color: viewLetter._dir === 'incoming' ? '#3730a3' : '#0369a1' }}>
                  {viewLetter._dir === 'incoming' ? 'Incoming' : 'Outgoing'} Letter
                </span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`badge ${
                    ['Closed','Delivered','Responded'].includes(viewLetter.status) ? 'badge-success' :
                    viewLetter.status === 'Forwarded' ? 'badge-info' :
                    viewLetter.status === 'Under Review' ? 'badge-warning' : 'badge-primary'
                  }`}>{viewLetter.status}</span>
                  <span className={`badge ${
                    viewLetter.priority === 'Urgent' ? 'badge-warning' :
                    viewLetter.priority === 'Confidential' ? 'badge-danger' : 'badge-gray'
                  }`}>{viewLetter.priority || 'Normal'}</span>
                </span>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Subject</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{viewLetter.subject}</div>
              </div>

              {/* Core fields grid */}
              <div className="grid grid-2" style={{ gap: 16, marginBottom: 16 }}>
                {viewLetter._dir === 'incoming' ? (
                  <>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Ref No.</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1e40af' }}>{viewLetter.refNo}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Date Received</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{viewLetter.dateReceived || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Sender</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{viewLetter.sender || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Organization</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{viewLetter.senderOrg || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Department</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{viewLetter.department || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Mode of Delivery</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{viewLetter.mode || '—'}</div>
                    </div>
                    {viewLetter._fromOffice && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>From Office</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{viewLetter._fromOffice}</div>
                      </div>
                    )}
                    {viewLetter._toOffice && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>To Office</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{viewLetter._toOffice}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Ref No.</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0891b2' }}>{viewLetter.refNo}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Date Prepared</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{viewLetter.datePrepared || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Recipient</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{viewLetter.recipient || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Organization</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{viewLetter.recipientOrg || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Department</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{viewLetter.department || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Dispatch Method</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{viewLetter.dispatchMethod || '—'}</div>
                    </div>
                    {viewLetter.trackingNo && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Tracking No.</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', fontFamily: 'monospace' }}>{viewLetter.trackingNo}</div>
                      </div>
                    )}
                    {viewLetter.responsibleOfficer && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Responsible Officer</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{viewLetter.responsibleOfficer}</div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Remarks */}
              {viewLetter.remarks && (
                <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Remarks / Notes</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{viewLetter.remarks}</div>
                </div>
              )}

              {/* Attachments */}
              {(viewLetter.attachments?.length > 0 || viewLetter.attachment) && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                    Attached Documents
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(viewLetter.attachments?.length > 0 ? viewLetter.attachments : [viewLetter.attachment]).map((att, idx) => att && (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)' }}>
                        <FileText size={22} color="#6366f1" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{att.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmt(att.size)}</div>
                        </div>
                        <button onClick={() => setViewFile(att)} className="btn btn-primary btn-sm">View</button>
                        <a href={att.dataUrl} download={att.name} className="btn btn-ghost btn-sm"
                          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Download size={13} /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewLetter(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {viewFile && createPortal(
        <FileViewer file={viewFile} onClose={() => setViewFile(null)} />,
        document.body
      )}
    </div>
  );
}
