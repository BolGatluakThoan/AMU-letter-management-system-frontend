import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Inbox as InboxIcon, Eye, Paperclip, RefreshCw, X, Download, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import FileViewer from '../components/FileViewer';

const SERVER = 'http://localhost:5000';

function fmt(b) {
  if (!b) return '';
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}

function getIcon(type) {
  if (!type) return '📄';
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📕';
  if (type.includes('word')) return '📝';
  if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
  return '📄';
}

export default function Inbox() {
  const { user, isRecordOfficer } = useApp();
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]); // Record Officer only
  const [loading, setLoading] = useState(true);
  const [viewRecord, setViewRecord] = useState(null);
  const [viewFile, setViewFile] = useState(null);
  const [tab, setTab] = useState('mine'); // 'mine' | 'all'

  const load = async () => {
    setLoading(true);
    try {
      // Cleanup duplicates on every load (fast, no-op if already clean)
      api.cleanupInbox().catch(() => {});
      const data = await api.getInbox();      setRecords(data);
      if (isRecordOfficer) {
        const all = await api.getAllInbox();
        setAllRecords(all);
      }
    } catch (e) {
      console.error('Inbox load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleView = async (record) => {
    if (!record.isRead) {
      try {
        await api.markInboxRead(record._id);
        setRecords(prev => prev.map(r => r._id === record._id ? { ...r, isRead: true } : r));
        setAllRecords(prev => prev.map(r => r._id === record._id ? { ...r, isRead: true } : r));
      } catch (e) { console.error(e); }
    }
    setViewRecord(record);
  };

  const unreadCount = records.filter(r => !r.isRead).length;
  const activeRecords = tab === 'all' ? allRecords : records;

  const totalAll = allRecords.length;
  const unreadAll = allRecords.filter(r => !r.isRead).length;
  const readAll = totalAll - unreadAll;

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, display:'flex', alignItems:'center', gap:10 }}>
            <InboxIcon size={22} />
            {tab === 'all' ? 'All Staff Inboxes' : 'My Inbox'}
            {unreadCount > 0 && tab === 'mine' && (
              <span style={{ background:'#ef4444', color:'#fff', fontSize:11, fontWeight:700, borderRadius:99, padding:'2px 8px', marginLeft:4 }}>
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>
            {tab === 'all'
              ? `${totalAll} total · ${unreadAll} unread · ${readAll} read`
              : `${records.length} letters received`}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} style={{ display:'flex', alignItems:'center', gap:6 }}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Record Officer stats + tab */}
      {isRecordOfficer && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
            {[
              { label:'Total Inbox Letters', value:totalAll, color:'#6366f1', bg:'linear-gradient(135deg,#6366f1,#8b5cf6)' },
              { label:'Unread', value:unreadAll, color:'#ef4444', bg:'linear-gradient(135deg,#ef4444,#f97316)' },
              { label:'Read', value:readAll, color:'#10b981', bg:'linear-gradient(135deg,#10b981,#059669)' },
            ].map(s => (
              <div key={s.label} style={{ borderRadius:14, padding:'18px 20px', background:s.bg, color:'#fff', boxShadow:`0 4px 16px ${s.color}30` }}>
                <div style={{ fontSize:28, fontWeight:900, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:12, opacity:.85, marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)' }}>
            {[['mine','My Inbox'],['all','All Staff Inboxes (Record Office View)']].map(([key,label])=>(
              <button key={key} onClick={()=>setTab(key)} style={{ padding:'8px 16px', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:'none', borderBottom:tab===key?'2px solid #6366f1':'2px solid transparent', color:tab===key?'#6366f1':'var(--text-muted)', marginBottom:-1 }}>
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text-faint)' }}>
            <RefreshCw size={24} style={{ animation:'spin .8s linear infinite', margin:'0 auto 12px', display:'block' }}/>
            Loading inbox...
          </div>
        ) : activeRecords.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'var(--text-faint)' }}>
            <InboxIcon size={40} style={{ margin:'0 auto 12px', display:'block', opacity:.3 }}/>
            <div style={{ fontSize:15, fontWeight:600 }}>No letters yet</div>
            <div style={{ fontSize:13, marginTop:6 }}>Letters dispatched to you will appear here.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ref No.</th>
                  <th>Subject</th>
                  <th>From</th>
                  {tab === 'all' && <th>Recipient</th>}
                  <th>Priority</th>
                  <th>Files</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeRecords.map(r => {
                  const letter = r.letterId;
                  const unread = !r.isRead;
                  return (
                    <tr key={r._id} style={{ fontWeight:unread?700:400, background:unread?'rgba(99,102,241,.04)':undefined }}>
                      <td>
                        <div style={{ fontWeight:700, color:'#1e40af', display:'flex', alignItems:'center', gap:6 }}>
                          {unread && <span style={{ width:8, height:8, borderRadius:'50%', background:'#6366f1', display:'inline-block', flexShrink:0 }}/>}
                          {letter?.refNo || '—'}
                        </div>
                      </td>
                      <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{letter?.subject || '—'}</td>
                      <td style={{ fontSize:12, color:'var(--text-muted)' }}>{letter?.sender || '—'}</td>
                      {tab === 'all' && (
                        <td style={{ fontSize:12, color:'var(--text-muted)' }}>
                          {r.userId?.name || r.userId || '—'}
                          {r.userId?.office && <div style={{ fontSize:10, color:'var(--text-faint)' }}>{r.userId.office}</div>}
                        </td>
                      )}
                      <td>
                        {letter?.priority && (
                          <span className={`badge ${letter.priority==='Urgent'?'badge-warning':letter.priority==='Confidential'?'badge-danger':'badge-gray'}`}>
                            {letter.priority}
                          </span>
                        )}
                      </td>
                      <td>
                        {letter?.attachments?.length > 0
                          ? <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#6366f1' }}>
                              <Paperclip size={12}/> {letter.attachments.length}
                            </span>
                          : <span style={{ color:'var(--text-faint)', fontSize:12 }}>—</span>}
                      </td>
                      <td style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, background:unread?'#eef2ff':'#f0fdf4', color:unread?'#3730a3':'#166534' }}>
                          {unread ? 'Unread' : 'Read'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => handleView(r)}
                          style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <Eye size={13}/> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', color:'var(--text-faint)', fontSize:12 }}>
          {tab === 'all' ? `${totalAll} total · ${unreadAll} unread` : `${records.length} total · ${unreadCount} unread`}
        </div>
      </div>

      {/* Letter detail modal — opens inside inbox, no redirect */}
      {viewRecord && createPortal(
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewRecord(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize:17, fontWeight:700 }}>{viewRecord.letterId?.refNo || 'Letter Detail'}</h2>
                <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Received via Inbox · {new Date(viewRecord.createdAt).toLocaleDateString()}</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewRecord(null)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              {viewRecord.letterId ? (
                <div className="grid grid-2" style={{ gap:16 }}>
                  {[
                    ['Ref No.', viewRecord.letterId.refNo],
                    ['Sender', viewRecord.letterId.sender],
                    ['Priority', null],
                    ['Status', null],
                  ].map(([k]) => null)}
                  {/* Fields */}
                  {[
                    ['Ref No.', viewRecord.letterId.refNo],
                    ['Sender', viewRecord.letterId.sender],
                    ['Organization', viewRecord.letterId.senderOrg],
                    ['Subject', viewRecord.letterId.subject],
                    ['Priority', viewRecord.letterId.priority],
                    ['Date Received', viewRecord.letterId.dateReceived],
                    ['Mode', viewRecord.letterId.mode],
                    ['Department', viewRecord.letterId.department],
                  ].filter(([,v]) => v).map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>{k}</div>
                      <div style={{ fontSize:14, fontWeight:500 }}>{v}</div>
                    </div>
                  ))}
                  {viewRecord.letterId.remarks && (
                    <div style={{ gridColumn:'1/-1' }}>
                      <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Remarks</div>
                      <div style={{ fontSize:13, color:'var(--text-muted)' }}>{viewRecord.letterId.remarks}</div>
                    </div>
                  )}
                  {/* Attachments */}
                  {viewRecord.letterId.attachments?.length > 0 && (
                    <div style={{ gridColumn:'1/-1' }}>
                      <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>
                        Attached Documents ({viewRecord.letterId.attachments.length})
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {viewRecord.letterId.attachments.map((att, idx) => (
                          <div key={idx} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', border:'1.5px solid var(--border)', borderRadius:10, background:'var(--surface-2)' }}>
                            <div style={{ fontSize:24 }}>{getIcon(att.type)}</div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:13, fontWeight:600 }}>{att.name}</div>
                              <div style={{ fontSize:11, color:'var(--text-faint)' }}>{fmt(att.size)}</div>
                            </div>
                            <button onClick={() => setViewFile(att)} className="btn btn-primary btn-sm">View</button>
                            <a href={att.url ? `${SERVER}${att.url}` : att.dataUrl} download={att.name}
                              className="btn btn-ghost btn-sm" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
                              <Download size={13}/> Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color:'var(--text-faint)', textAlign:'center', padding:40 }}>Letter details not available.</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewRecord(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {viewFile && createPortal(<FileViewer file={viewFile} onClose={() => setViewFile(null)}/>, document.body)}
    </div>
  );
}
