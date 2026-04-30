import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2, X, Paperclip, Download, Send, Share2, CheckCircle, Printer, ArrowRight, Stamp, Clock } from 'lucide-react';
import { useApp, OFFICES } from '../context/AppContext';
import FileViewer from '../components/FileViewer';
import FileUploadZone from '../components/FileUploadZone';
import { departments, priorities, deliveryModes, incomingStatuses } from '../data/mockData';
import { useI18n } from '../i18n/index.jsx';

const statusColor = { Registered:'badge-primary', Forwarded:'badge-info', 'Under Review':'badge-warning', Responded:'badge-success', Closed:'badge-gray' };
const priorityColor = { Normal:'badge-gray', Urgent:'badge-warning', Confidential:'badge-danger' };
const empty = { sender:'', senderOrg:'', subject:'', department:'', priority:'Normal', mode:'Email', dateReceived:'', status:'Registered', remarks:'', attachments:[] };

function fmt(b) { if (!b) return ''; if (b<1024) return b+' B'; if (b<1024*1024) return (b/1024).toFixed(1)+' KB'; return (b/(1024*1024)).toFixed(1)+' MB'; }
function getIcon(t) { if (!t||!t.startsWith) return '📄'; if (t.startsWith('image/')) return '🖼️'; if (t==='application/pdf') return '📕'; if (t.includes('word')) return '📝'; if (t.includes('excel')||t.includes('spreadsheet')) return '📊'; return '📄'; }

// normalise legacy single-attachment to array
function getAttachments(l) {
  if (Array.isArray(l.attachments)) return l.attachments;
  if (l.attachment) return [l.attachment];
  return [];
}

function printFile(file) {
  const src = file.url ? `http://localhost:5000${file.url}` : file.dataUrl;
  if (!src) return;
  const win = window.open('', '_blank');
  if (!win) return;
  if (file.type?.startsWith('image/')) {
    win.document.write(`<html><body style="margin:0"><img src="${src}" style="max-width:100%" onload="window.print();window.close()"/></body></html>`);
  } else {
    win.document.write(`<html><body style="margin:0"><iframe src="${src}" style="width:100%;height:100vh;border:none" onload="window.print();window.close()"></iframe></body></html>`);
  }
  win.document.close();
}

export default function IncomingLetters() {
  const { incoming, addIncoming, updateIncoming, deleteIncoming, readOnly, markLetterRead, forwardLetter, dispatchLetter, addOutgoing, myOffice, isRecordOfficer, pendingDispatch, canForward, allUsers, user } = useApp();
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewLetter, setViewLetter] = useState(null);
  const [editLetter, setEditLetter] = useState(null);
  const [form, setForm] = useState(empty);
  const [viewFile, setViewFile] = useState(null);
  const [forwardModal, setForwardModal] = useState(null);
  const [forwardTo, setForwardTo] = useState('');
  const [forwardNote, setForwardNote] = useState('');
  const [dispatchModal, setDispatchModal] = useState(null);
  const [dispatchTo, setDispatchTo] = useState('');
  const [dispatchRef, setDispatchRef] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');
  const [dispatchReceivedBy, setDispatchReceivedBy] = useState('');
  const [dispatchCopies, setDispatchCopies] = useState([]);
  const [addingCCOffice, setAddingCCOffice] = useState(false);
  const [newCCOffice, setNewCCOffice] = useState('');
  const [customCCOffices, setCustomCCOffices] = useState([]);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchEmails, setDispatchEmails] = useState('');
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [originalStatus, setOriginalStatus] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    if (id && incoming.length > 0) {
      const letter = incoming.find(l => String(l.id) === String(id));
      if (letter) { openView(letter); setSearchParams({}, { replace: true }); }
    }
  }, [searchParams, incoming]);

  const openView = (letter) => {
    setViewLetter(letter);
    markLetterRead(letter.id);
  };

  const filtered = incoming.filter(l => {
    const q = search.toLowerCase();
    return (!q || l.refNo?.toLowerCase().includes(q) || l.sender?.toLowerCase().includes(q) || l.subject?.toLowerCase().includes(q) || l.senderOrg?.toLowerCase().includes(q))
      && (!filterStatus || l.status === filterStatus) && (!filterPriority || l.priority === filterPriority);
  });

  const openAdd = () => { setForm(empty); setEditLetter(null); setShowModal(true); };
  const openEdit = (l) => { setForm({...l, attachments: getAttachments(l)}); setEditLetter(l); setOriginalStatus(l.status); setShowModal(true); };
  const closeModal = () => setShowModal(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editLetter) {
      updateIncoming(editLetter.id, { status: form.status, remarks: form.remarks });
      closeModal();
      return;
    }
    // Register the letter
    await addIncoming(form);
    closeModal();
    // If intended office was selected, auto-open dispatch for the newly created letter
    // (handled by the intendedFor field — Record Office will see it in pending dispatch)
  };
  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleForward = (e) => {
    e.preventDefault();
    if (!forwardTo) return;
    forwardLetter(forwardModal, forwardTo, forwardNote);
    setForwardModal(null);
    setForwardTo('');
    setForwardNote('');
    setViewLetter(null);
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    // Allow dispatch if toOffice is set OR if there are inbox-only copies with a staffId
    const hasInboxOnlyCopies = dispatchCopies.some(c => c.deliveryMode === 'inbox' && c.staffId);
    if (!dispatchTo && !hasInboxOnlyCopies) return;
    setDispatching(true);
    const emails = dispatchEmails.split(',').map(s => s.trim()).filter(Boolean);
    // Collect staffIds from CC copies that have a staff member selected
    const staffIds = dispatchCopies.filter(c => c.staffId).map(c => c.staffId);
    await dispatchLetter(dispatchModal.id, dispatchTo, dispatchRef, dispatchNote, dispatchReceivedBy, dispatchCopies, emails, staffIds);
    setDispatching(false);
    setDispatchModal(null);
    setDispatchTo('');
    setDispatchRef('');
    setDispatchNote('');
    setDispatchReceivedBy('');
    setDispatchCopies([]);
    setDispatchEmails('');
    setAddingCCOffice(false);
    setNewCCOffice('');
    setViewLetter(null);
  };

  const openDispatch = (l) => {
    setDispatchModal(l);
    setDispatchTo(l.intendedFor || '');
    setDispatchRef('');
    setDispatchNote('');
    // Auto-fill primary receiver with the logged-in Record Officer's name
    setDispatchReceivedBy(user?.name || '');
    setDispatchCopies([]);
    setDispatchEmails('');
  };

  // CC helpers for dispatch
  const addDispatchCopy = (office = '') => setDispatchCopies(prev => [...prev, { no: prev.length + 1, office, receivedBy: '', staffId: '', email: '', deliveryMode: 'office' }]);
  const updateDispatchCopy = (i, field, val) => setDispatchCopies(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  const removeDispatchCopy = (i) => setDispatchCopies(prev => prev.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, no: idx + 1 })));

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplySending(true);
    await addOutgoing({
      recipient: replyModal.sender,
      recipientOrg: replyModal.senderOrg,
      subject: `Re: ${replyModal.subject}`,
      department: replyModal._fromOffice || replyModal.department,
      toOffice: replyModal._fromOffice || '',
      datePrepared: new Date().toISOString().slice(0, 10),
      relatedIncoming: replyModal.refNo,
      dispatchMethod: 'Internal',
      trackingNo: `TRK-${Date.now()}`,
      responsibleOfficer: 'Record Office',
      status: 'Sent',
      notes: replyText,
      attachments: [],
    });
    await updateIncoming(replyModal.id, { status: 'Responded' });
    setReplySending(false);
    setReplyModal(null);
    setReplyText('');
    setViewLetter(null);
  };

  const isSupportRequest = (l) => l.subject?.startsWith('[Support Request]');

  const isRead = (l) => l._readBy?.includes(myOffice);
  const wasReadByRecipient = (l) => l._toOffice && l._readBy?.includes(l._toOffice);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div><h1 style={{ fontSize:22, fontWeight:700 }}>{t('incoming')}</h1><p style={{ color:'var(--text-muted)', fontSize:13 }}>{incoming.length} total letters</p></div>
        {isRecordOfficer && <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Register Incoming Letter</button>}
      </div>

      {/* Record Officer pending dispatch banner */}
      {isRecordOfficer && pendingDispatch.length > 0 && (
        <div style={{
          background:'linear-gradient(135deg,#fef3c7,#fde68a)', border:'1.5px solid #f59e0b',
          borderRadius:12, padding:'14px 20px', marginBottom:16,
          display:'flex', alignItems:'center', gap:14,
        }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Send size={20} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#92400e' }}>
              {pendingDispatch.length} letter{pendingDispatch.length > 1 ? 's' : ''} awaiting dispatch
            </div>
            <div style={{ fontSize:12, color:'#b45309', marginTop:2 }}>
              These letters have arrived at Record Office and need to be forwarded to the intended recipients.
            </div>
          </div>
          <button className="btn btn-sm" style={{ background:'#f59e0b', color:'#fff', border:'none', whiteSpace:'nowrap' }}
            onClick={() => { setFilterStatus('Registered'); }}>
            View Pending
          </button>
        </div>
      )}

      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ padding:'14px 20px', display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-faint)' }}/>
            <input className="form-control" placeholder={t('search_ref')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:32 }}/>
          </div>
          <select className="form-control" style={{ width:160 }} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">{t('all_statuses')}</option>{incomingStatuses.map(s=><option key={s}>{s}</option>)}
          </select>
          <select className="form-control" style={{ width:160 }} value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}>
            <option value="">{t('all_priorities')}</option>{priorities.map(p=><option key={p}>{p}</option>)}
          </select>
          {(search||filterStatus||filterPriority)&&<button className="btn btn-ghost btn-sm" onClick={()=>{setSearch('');setFilterStatus('');setFilterPriority('');}}><X size={14}/> Clear</button>}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('ref_no')}</th><th>{t('date')}</th><th>{t('from')}</th><th>{t('subject')}</th><th>{t('priority')}</th><th>File</th><th>{t('status')}</th><th>Read</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length===0?<tr><td colSpan={9} style={{ textAlign:'center', padding:40, color:'var(--text-faint)' }}>{t('no_letters_found')}</td></tr>
              :filtered.map(l=>(
                <tr key={l.id} style={{ background:!isRead(l)&&l._toOffice===myOffice?'rgba(99,102,241,.04)':undefined, fontWeight:!isRead(l)&&l._toOffice===myOffice?600:undefined }}>
                  <td>
                    <div style={{ fontWeight:600, color:'#1e40af' }}>{l.refNo}</div>
                    {l._autoDelivered&&<div style={{ fontSize:10, color:'#6366f1', display:'flex', alignItems:'center', gap:3, marginTop:2 }}><Send size={9}/> from {l._fromOffice}</div>}
                    {l._forwardedFrom&&<div style={{ fontSize:10, color:'#f59e0b', marginTop:2 }}>Fwd: {l._forwardedFrom}</div>}
                    {/* Dispatched indicator — shown to Record Officer */}
                    {isRecordOfficer && l.stampedBy && (
                      <div style={{ marginTop:3, display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, color:'#10b981', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:99, padding:'1px 7px', width:'fit-content' }}>
                        <CheckCircle size={9}/> Dispatched {l.stampedAt ? '· ' + new Date(l.stampedAt).toLocaleDateString() : ''}
                      </div>
                    )}
                    {isRecordOfficer && l._toOffice==='Record Office' && l.status==='Registered' && l.intendedFor &&
                      <div style={{ fontSize:10, color:'#d97706', fontWeight:600, marginTop:2 }}>→ {l.intendedFor}</div>}
                    {/* CC copy: show destination office + receiver name */}
                    {l._autoDelivered && l._toOffice && l._toOffice !== 'Record Office' && (
                      <div style={{ marginTop:3, display:'flex', flexDirection:'column', gap:1 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'#15803d', display:'flex', alignItems:'center', gap:3 }}>
                          <ArrowRight size={9}/> {l._toOffice}
                        </div>
                        {l.receivedBy && <div style={{ fontSize:10, color:'#6b7280' }}>👤 {l.receivedBy}</div>}
                      </div>
                    )}
                  </td>
                  <td>{l.dateReceived}</td>
                  <td><div>{l.sender}</div><div style={{ fontSize:11, color:'var(--text-faint)' }}>{l.senderOrg}</div></td>
                  <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.subject}</td>
                  <td><span className={'badge '+(priorityColor[l.priority]||'badge-gray')}>{l.priority}</span></td>
                  <td>{getAttachments(l).length > 0
                    ? <button onClick={()=>setViewFile(getAttachments(l)[0])} style={{ display:'flex', alignItems:'center', gap:4, color:'#6366f1', fontSize:12, background:'none', border:'none', cursor:'pointer', padding:0 }}>
                        <Paperclip size={13}/>{getAttachments(l).length > 1 ? `${getAttachments(l).length} files` : (getAttachments(l)[0].name.length>12?getAttachments(l)[0].name.slice(0,12)+'...':getAttachments(l)[0].name)}
                      </button>
                    : <span style={{ color:'var(--text-faint)', fontSize:12 }}>-</span>}</td>
                  <td><span className={'badge '+(statusColor[l.status]||'badge-gray')}>{l.status}</span></td>
                  <td>
                    {wasReadByRecipient(l)
                      ? <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#10b981' }}><CheckCircle size={12}/> Seen</span>
                      : l._toOffice ? <span style={{ fontSize:11, color:'var(--text-faint)' }}>Unread</span> : null}
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      {/* Primary action */}
                      {isRecordOfficer && l.status==='Registered' && !isSupportRequest(l) ? (
                        <button onClick={()=>openDispatch(l)}
                          style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#f59e0b,#f97316)', color:'#fff', cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(245,158,11,.3)' }}>
                          <ArrowRight size={12}/> Dispatch
                        </button>
                      ) : isRecordOfficer && l.stampedBy && l.status !== 'Registered' ? (
                        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8, background:'#f0fdf4', color:'#166534', border:'1px solid #86efac', whiteSpace:'nowrap' }}>
                          <CheckCircle size={11}/> Dispatched
                        </span>
                      ) : !isRecordOfficer && ['Registered','Forwarded','Under Review'].includes(l.status) ? (
                        <button onClick={()=>updateIncoming(l.id,{status:'Responded'})}
                          style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(16,185,129,.25)' }}>
                          <CheckCircle size={12}/> Respond
                        </button>
                      ) : null}
                      {/* View */}
                      <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={()=>openView(l)}><Eye size={14}/></button>
                      {/* Secondary icon actions */}
                      <div style={{ display:'flex', gap:2 }}>
                        {isRecordOfficer && isSupportRequest(l) && ['Registered','Under Review'].includes(l.status) && (
                          <button className="btn btn-ghost btn-icon btn-sm" title="Reply" onClick={()=>{setReplyModal(l);setReplyText('');}} style={{ color:'#10b981' }}><Send size={13}/></button>
                        )}
                        {!isRecordOfficer && l.status==='Registered' && (
                          <button className="btn btn-ghost btn-icon btn-sm" title="Mark Under Review" onClick={()=>updateIncoming(l.id,{status:'Under Review'})} style={{ color:'#0891b2' }}><Clock size={13}/></button>
                        )}
                        {!isRecordOfficer && ['Registered','Forwarded','Under Review'].includes(l.status) && (
                          <button className="btn btn-ghost btn-icon btn-sm" title="Forward" onClick={()=>{setForwardModal(l);setForwardTo('');setForwardNote('');}} style={{ color:'#6366f1' }}><Share2 size={13}/></button>
                        )}
                        {!isRecordOfficer && l.status !== 'Closed' && (
                          <button className="btn btn-ghost btn-icon btn-sm" title="Close" onClick={()=>{ if(window.confirm('Close this letter?')) updateIncoming(l.id,{status:'Closed'}); }} style={{ color:'#94a3b8' }}><X size={13}/></button>
                        )}
                        {!readOnly && <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={()=>openEdit(l)}><Edit2 size={13}/></button>}
                        {/* Delete: only Record Officer can delete incoming letters */}
                        {isRecordOfficer && <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={async ()=>{
                          if(window.confirm('Delete?')) {
                            console.log('[DELETE BTN] l.id=', l.id, 'l._id=', l._id);
                            deleteIncoming(l.id || l._id);
                          }
                        }} style={{ color:'#ef4444' }}><Trash2 size={13}/></button>}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', color:'var(--text-faint)', fontSize:12 }}>{t('showing')} {filtered.length} {t('of')} {incoming.length} {t('letters')}</div>
      </div>

      {showModal&&createPortal(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&closeModal()}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize:17, fontWeight:700 }}>{editLetter ? 'Update Letter Status' : 'Register Incoming Letter'}</h2>
                {editLetter
                  ? <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{editLetter.refNo} · {editLetter.subject}</p>
                  : <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, padding:'6px 10px', background:'rgba(99,102,241,.08)', borderRadius:7, width:'fit-content' }}>
                      <span style={{ fontSize:18 }}>📥</span>
                      <span style={{ fontSize:12, color:'#3730a3', fontWeight:600 }}>External → Record Office → Your Office</span>
                    </div>
                }
              </div>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {editLetter ? (
                  /* ── Edit mode: receiver updates status + remarks ── */
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {/* Read-only letter summary */}
                    <div style={{ background:'var(--surface-2)', borderRadius:10, padding:'14px 16px', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10 }}>Letter Information</div>
                      <div className="grid grid-2" style={{ gap:10 }}>
                        <div><div style={{ fontSize:11, color:'var(--text-faint)' }}>From</div><div style={{ fontSize:13, fontWeight:600 }}>{editLetter.sender}</div><div style={{ fontSize:11, color:'var(--text-faint)' }}>{editLetter.senderOrg}</div></div>
                        <div><div style={{ fontSize:11, color:'var(--text-faint)' }}>Ref No.</div><div style={{ fontSize:13, fontWeight:600, color:'#1e40af' }}>{editLetter.refNo}</div></div>
                        <div style={{ gridColumn:'1/-1' }}><div style={{ fontSize:11, color:'var(--text-faint)' }}>Subject</div><div style={{ fontSize:13, fontWeight:600 }}>{editLetter.subject}</div></div>
                        {editLetter.remarks && (
                          <div style={{ gridColumn:'1/-1' }}>
                            <div style={{ fontSize:11, color:'var(--text-faint)' }}>Dispatch Info (from Record Office)</div>
                            <div style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic', marginTop:2 }}>{editLetter.remarks}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status — receiver sets this */}
                    <div className="form-group">
                      <label className="form-label">Update Processing Status *</label>
                      <select className="form-control" value={form.status} onChange={e=>f('status',e.target.value)}>
                        {incomingStatuses.map(s=><option key={s}>{s}</option>)}
                      </select>
                      <div style={{ fontSize:11, color:'#6366f1', marginTop:4, display:'flex', alignItems:'center', gap:5 }}>
                        <CheckCircle size={11}/> This status is visible to the sender and Record Office
                      </div>
                    </div>

                    {/* Remarks */}
                    <div className="form-group">
                      <label className="form-label">Your Remarks / Response</label>
                      <textarea className="form-control" rows={4} value={form.remarks} onChange={e=>f('remarks',e.target.value)} placeholder="Describe the action taken or your response..."/>
                    </div>

                    {/* Preview of what sender/Record Office will see */}
                    <div style={{ background:'#eef2ff', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#3730a3', display:'flex', alignItems:'center', gap:8 }}>
                      <CheckCircle size={13}/>
                      Sender and Record Office will see status: <strong style={{ marginLeft:4 }}>{form.status}</strong>
                    </div>
                  </div>
                ) : (
                  /* ── Register mode: Record Officer logs a received letter ── */
                  <div className="grid grid-2" style={{ gap:16 }}>
                    <div className="form-group"><label className="form-label">{t('sender')} *</label><input className="form-control" required value={form.sender} onChange={e=>f('sender',e.target.value)} placeholder="Full name of sender"/></div>
                    <div className="form-group"><label className="form-label">{t('organization')} *</label><input className="form-control" required value={form.senderOrg} onChange={e=>f('senderOrg',e.target.value)} placeholder="Sender's organization"/></div>
                    <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">{t('subject')} *</label><input className="form-control" required value={form.subject} onChange={e=>f('subject',e.target.value)} placeholder="Letter subject"/></div>
                    <div className="form-group"><label className="form-label">From Department</label><input className="form-control" value={form.department} onChange={e=>f('department',e.target.value)} placeholder="e.g. Finance, HR, External Ministry"/></div>
                    <div className="form-group"><label className="form-label">{t('date_received')} *</label><input type="date" className="form-control" required value={form.dateReceived} onChange={e=>f('dateReceived',e.target.value)}/></div>
                    <div className="form-group"><label className="form-label">{t('priority')}</label><select className="form-control" value={form.priority} onChange={e=>f('priority',e.target.value)}>{priorities.map(p=><option key={p}>{p}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">{t('mode')}</label><select className="form-control" value={form.mode} onChange={e=>f('mode',e.target.value)}>{deliveryModes.map(m=><option key={m}>{m}</option>)}</select></div>
                    <div className="form-group">
                      <label className="form-label">Pre-tag Destination Office <span style={{ color:'var(--text-faint)', fontWeight:400 }}>(optional)</span></label>
                      <select className="form-control" value={form.intendedFor||''} onChange={e=>f('intendedFor',e.target.value)}>
                        <option value="">Select office (tag now, dispatch later)</option>
                        {OFFICES.filter(o=>o!=='Record Office').map(o=><option key={o}>{o}</option>)}
                      </select>
                      <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:3 }}>
                        Optional — tag the destination now. You will still use Dispatch (→) to officially route it.
                      </div>
                    </div>
                    <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">{t('remarks')}</label><textarea className="form-control" rows={2} value={form.remarks} onChange={e=>f('remarks',e.target.value)} placeholder="Optional remarks"/></div>
                    <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">{t('attachments')}</label><FileUploadZone value={form.attachments||[]} onChange={atts=>f('attachments',atts)} onPreview={setViewFile}/></div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{editLetter ? 'Update Status & Remarks' : 'Register Letter'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Dispatch Modal — Record Officer only */}
      {dispatchModal&&createPortal(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDispatchModal(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize:17, fontWeight:700 }}>Dispatch Letter</h2>
                <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                  Step 2 of 2 — Route to office · {dispatchModal.refNo} · {dispatchModal.subject}
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, padding:'6px 10px', background:'rgba(245,158,11,.08)', borderRadius:7, width:'fit-content' }}>
                  <span style={{ fontSize:16 }}>🏢</span>
                  <span style={{ fontSize:12, color:'#92400e', fontWeight:600 }}>Record Office → stamps → routes to destination office</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={()=>setDispatchModal(null)}><X size={18}/></button>
            </div>
            <form onSubmit={handleDispatch}>
              <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:20 }}>

                {/* Example hint */}
                <details style={{ background:'var(--surface-2)', borderRadius:8, border:'1px solid var(--border)', padding:'10px 14px' }}>
                  <summary style={{ fontSize:12, fontWeight:700, color:'#6366f1', cursor:'pointer', userSelect:'none' }}>
                    📖 See example — how to fill this form
                  </summary>
                  <div style={{ marginTop:10, fontSize:12, color:'var(--text-muted)', lineHeight:1.8 }}>
                    <div style={{ marginBottom:6, fontWeight:600, color:'var(--text)' }}>Scenario: Ministry letter about budget allocation for Finance Office</div>
                    <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'4px 12px' }}>
                      <span style={{ color:'var(--text-faint)' }}>Referral No.</span><span style={{ fontFamily:'monospace', color:'#6366f1' }}>FIN/ALLOC/021/2026</span>
                      <span style={{ color:'var(--text-faint)' }}>Direct to</span><span style={{ fontWeight:600 }}>Finance Office</span>
                      <span style={{ color:'var(--text-faint)' }}>Dispatch Note</span><span>Please process the budget allocation by end of week.</span>
                      <span style={{ color:'var(--text-faint)' }}>Received By</span><span>Tigist Bekele (Finance staff who collected it)</span>
                      <span style={{ color:'var(--text-faint)' }}>CC (ግልባጭ)</span><span>Academic Affairs VP Office</span>
                    </div>
                  </div>
                </details>

                {/* Letter summary */}
                <div style={{ background:'var(--surface-2)', borderRadius:10, padding:'14px 16px', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>Letter Details</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div><div style={{ fontSize:11, color:'var(--text-faint)' }}>From</div><div style={{ fontSize:13, fontWeight:600 }}>{dispatchModal.sender}</div><div style={{ fontSize:11, color:'var(--text-faint)' }}>{dispatchModal.senderOrg}</div></div>
                    <div><div style={{ fontSize:11, color:'var(--text-faint)' }}>Subject</div><div style={{ fontSize:13, fontWeight:600 }}>{dispatchModal.subject}</div></div>
                  </div>
                </div>

                {/* Reference number — manual entry only */}
                <div className="form-group">
                  <label className="form-label">Referral Number <span style={{ color:'var(--text-faint)', fontWeight:400 }}>(optional)</span></label>
                  <input className="form-control" value={dispatchRef} onChange={e => setDispatchRef(e.target.value)}
                    placeholder="e.g. FIN/ALLOC/021/2026" style={{ fontFamily:'monospace' }}/>
                  <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>Enter manually — format: DEPT/SECTION/SERIAL/YEAR</div>
                </div>

                {/* Directional indicator — arrow to office (optional if inbox-only copies exist) */}
                <div className="form-group">
                  <label className="form-label">
                    Directional Indicator — Direct to Office
                    {dispatchCopies.some(c => c.deliveryMode === 'inbox' && c.staffId)
                      ? <span style={{ color:'var(--text-faint)', fontWeight:400, marginLeft:6 }}>(optional — you have inbox-only copies)</span>
                      : <span style={{ color:'#ef4444' }}> *</span>}
                  </label>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ background:'#fef3c7', border:'1.5px solid #f59e0b', borderRadius:8, padding:'8px 14px', fontSize:13, fontWeight:700, color:'#92400e', flexShrink:0 }}>
                      Record Office
                    </div>
                    <ArrowRight size={22} color="#f59e0b" style={{ flexShrink:0 }}/>
                    <select className="form-control" value={dispatchTo} onChange={e=>setDispatchTo(e.target.value)} style={{ flex:1 }}>
                      <option value="">Select destination office (or leave blank for inbox-only)</option>
                      {OFFICES.filter(o=>o!=='Record Office').map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  {dispatchTo && (
                    <div style={{ marginTop:10, background:'#eef2ff', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#3730a3', display:'flex', alignItems:'center', gap:10, fontWeight:600 }}>
                      <ArrowRight size={16}/> Letter will be directed to: <strong>{dispatchTo}</strong>
                    </div>
                  )}
                </div>

                {/* Note */}
                <div className="form-group">
                  <label className="form-label">Dispatch Note (optional)</label>
                  <textarea className="form-control" rows={2} value={dispatchNote} onChange={e=>setDispatchNote(e.target.value)} placeholder="Add instructions or notes for the receiving office..."/>
                </div>

                {/* Received By — person who physically collects the primary letter */}
                <div className="form-group">
                  <label className="form-label">Received By — Primary Recipient</label>
                  <input className="form-control" value={dispatchReceivedBy} onChange={e=>setDispatchReceivedBy(e.target.value)} placeholder="Name of person collecting the letter at destination office"/>
                  <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>
                    The staff member who physically collects the letter at <strong>{dispatchTo || 'the destination office'}</strong>.
                  </div>
                </div>
                {/* CC / ግልባጭ — each copy has its own office + receiver */}                <div className="form-group">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <label className="form-label" style={{ margin:0 }}>ግልባጭ / CC — Copy to Offices</label>
                    <span style={{ fontSize:11, color:'var(--text-faint)' }}>{dispatchCopies.length} cop{dispatchCopies.length !== 1 ? 'ies' : 'y'}</span>
                  </div>

                  {/* Per-copy rows */}
                  {dispatchCopies.map((copy, i) => (
                    <div key={i} style={{ marginBottom:10, padding:'12px 14px', background:'var(--surface-2)', borderRadius:10, border:'1px solid var(--border)' }}>
                      {/* Row header */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:'#6366f1' }}>Copy {copy.no}</span>
                        <button type="button" onClick={() => removeDispatchCopy(i)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:'2px', lineHeight:1, display:'flex', alignItems:'center', gap:4, fontSize:12 }}>
                          <X size={13}/> Remove
                        </button>
                      </div>
                      {/* Delivery Mode toggle */}
                      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                        {[
                          { val:'office', label:'📂 Office Incoming', desc:'Appears in the office incoming letters list' },
                          { val:'inbox',  label:'📥 Personal Inbox Only', desc:'Goes only to the selected staff member\'s inbox' },
                        ].map(opt => (
                          <button key={opt.val} type="button"
                            onClick={() => updateDispatchCopy(i, 'deliveryMode', opt.val)}
                            title={opt.desc}
                            style={{
                              flex:1, padding:'7px 10px', borderRadius:8, border:'none', cursor:'pointer',
                              fontSize:12, fontWeight:600, transition:'all .15s',
                              background: copy.deliveryMode === opt.val ? (opt.val==='office'?'#6366f1':'#10b981') : 'var(--border)',
                              color: copy.deliveryMode === opt.val ? '#fff' : 'var(--text-muted)',
                            }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {/* Office + Received By — only shown for office mode */}
                      {copy.deliveryMode !== 'inbox' && (
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', marginBottom:4 }}>Office / Department *</div>
                          <select className="form-control" style={{ fontSize:12 }} value={copy.office}
                            onChange={e => updateDispatchCopy(i, 'office', e.target.value)}>
                            <option value="">Select office...</option>
                            {[...OFFICES, ...(customCCOffices||[])].filter(o => o !== 'Record Office').map(o => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', marginBottom:4 }}>Received By (physical collector)</div>
                          <input className="form-control" style={{ fontSize:12 }} value={copy.receivedBy}
                            onChange={e => updateDispatchCopy(i, 'receivedBy', e.target.value)}
                            placeholder="Name of person collecting this copy"/>
                        </div>
                      </div>
                      )}
                      {/* Staff Inbox — optional */}
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', marginBottom:4, display:'flex', alignItems:'center', gap:5 }}>
                          📥 Notify via LMS Inbox <span style={{ fontSize:10, color:'var(--text-faint)', fontWeight:400 }}>(optional)</span>
                        </div>
                        <select className="form-control" style={{ fontSize:12 }} value={copy.staffId || ''}
                          onChange={e => {
                            const sid = e.target.value;
                            const staff = (allUsers||[]).find(u => String(u.id||u._id) === sid);
                            updateDispatchCopy(i, 'staffId', sid);
                            if (staff && !copy.receivedBy) updateDispatchCopy(i, 'receivedBy', staff.name);
                            // Auto-fill email from staff record
                            if (staff?.email && !copy.email) updateDispatchCopy(i, 'email', staff.email);
                          }}>
                          <option value="">— No inbox notification —</option>
                          {(allUsers||[]).map(u => (
                            <option key={u.id||u._id} value={u.id||u._id}>
                              {u.name} · {u.office}
                            </option>
                          ))}
                        </select>
                        {copy.staffId && (
                          <div style={{ fontSize:11, color:'#6366f1', marginTop:3, display:'flex', alignItems:'center', gap:5 }}>
                            ✓ Will appear in <strong>{(allUsers||[]).find(u=>String(u.id||u._id)===copy.staffId)?.name || 'staff'}</strong>'s LMS inbox
                          </div>
                        )}
                      </div>
                      {/* Email — optional, auto-filled from staff or enter manually */}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', marginBottom:4, display:'flex', alignItems:'center', gap:5 }}>
                          ✉️ Send by Email <span style={{ fontSize:10, color:'var(--text-faint)', fontWeight:400 }}>(optional — staff or department email)</span>
                        </div>
                        <input className="form-control" style={{ fontSize:12 }} value={copy.email || ''}
                          onChange={e => updateDispatchCopy(i, 'email', e.target.value)}
                          placeholder="e.g. president@amu.edu.et"/>
                        {copy.email && (
                          <div style={{ fontSize:11, color:'#10b981', marginTop:3 }}>
                            ✓ A copy will be emailed to <strong>{copy.email}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add new office inline */}
                  {addingCCOffice && (
                    <div style={{ display:'flex', gap:8, marginTop:8 }}>
                      <input className="form-control" autoFocus placeholder="Enter new office name"
                        value={newCCOffice} onChange={e => setNewCCOffice(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); if (newCCOffice.trim()) { setCustomCCOffices(prev => [...(prev||[]), newCCOffice.trim()]); addDispatchCopy(newCCOffice.trim()); setNewCCOffice(''); setAddingCCOffice(false); } }
                          if (e.key === 'Escape') { setAddingCCOffice(false); setNewCCOffice(''); }
                        }}
                        style={{ flex:1, fontSize:12 }}/>
                      <button type="button" className="btn btn-primary btn-sm"
                        onClick={() => { if (newCCOffice.trim()) { setCustomCCOffices(prev => [...(prev||[]), newCCOffice.trim()]); addDispatchCopy(newCCOffice.trim()); setNewCCOffice(''); setAddingCCOffice(false); } }}>
                        Add
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAddingCCOffice(false); setNewCCOffice(''); }}>Cancel</button>
                    </div>
                  )}

                  {/* Add buttons */}
                  <div style={{ display:'flex', gap:8, marginTop:8 }}>
                    <button type="button" className="btn btn-ghost btn-sm"
                      onClick={() => addDispatchCopy('')}
                      style={{ fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                      + Add CC Office
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm"
                      onClick={() => setAddingCCOffice(true)}
                      style={{ fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                      + New Office Not in List
                    </button>
                  </div>

                  {dispatchCopies.length === 0 && (
                    <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:6 }}>No CC copies. Click "Add CC Office" to add one.</div>
                  )}
                  {dispatchCopies.length > 0 && (
                    <div style={{ fontSize:11, color:'#6366f1', marginTop:6, display:'flex', alignItems:'center', gap:5 }}>
                      <Send size={11}/> {dispatchCopies.length} cop{dispatchCopies.length !== 1 ? 'ies' : 'y'} will be delivered directly to each office.
                    </div>
                  )}
                </div>

                {/* External Email Addresses */}
                <div className="form-group">
                  <label className="form-label">Send Copy by Email <span style={{ color:'var(--text-faint)', fontWeight:400 }}>(optional — external recipients)</span></label>
                  <input className="form-control" value={dispatchEmails} onChange={e => setDispatchEmails(e.target.value)}
                    placeholder="e.g. john@example.com, jane@ministry.gov"
                    type="text"/>
                  <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>
                    Comma-separated external email addresses. The system will send a copy from the LMS no-reply address. For internal staff, use the CC section above — they receive it in their LMS inbox automatically.
                  </div>
                </div>

                {/* Stamp preview */}
                {dispatchTo && (
                  <div style={{ border:'2px dashed #6366f1', borderRadius:10, padding:'16px 20px', background:'rgba(99,102,241,.04)' }}>
                    <div style={{ fontSize:11, color:'#6366f1', textTransform:'uppercase', letterSpacing:1, fontWeight:700, marginBottom:10 }}>Record Office Stamp Preview</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
                      <div><div style={{ fontSize:10, color:'var(--text-faint)' }}>Ref No.</div><div style={{ fontSize:13, fontWeight:700 }}>{dispatchRef}</div></div>
                      <div><div style={{ fontSize:10, color:'var(--text-faint)' }}>Date</div><div style={{ fontSize:13, fontWeight:700 }}>{new Date().toLocaleDateString()}</div></div>
                      <div><div style={{ fontSize:10, color:'var(--text-faint)' }}>Directed To</div><div style={{ fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}><ArrowRight size={13} color="#6366f1"/>{dispatchTo}</div></div>
                      <div><div style={{ fontSize:10, color:'var(--text-faint)' }}>Stamped By</div><div style={{ fontSize:13, fontWeight:700 }}>Record Office</div></div>
                    </div>
                    {dispatchCopies.length > 0 && (
                      <div style={{ marginTop:12, borderTop:'1px dashed #6366f1', paddingTop:10 }}>
                        <div style={{ fontSize:10, color:'#6366f1', fontWeight:700, marginBottom:6 }}>ግልባጭ (CC):</div>
                        {dispatchCopies.map(c => (
                          <div key={c.no} style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4, display:'flex', gap:8, alignItems:'center' }}>
                            <span style={{ fontWeight:700 }}>{c.no}.</span>
                            <span>{c.office || '(no office)'}</span>
                            {c.receivedBy && <span style={{ color:'#10b981' }}>→ {c.receivedBy}</span>}
                            {c.staffId && <span style={{ fontSize:10, background:'#eef2ff', color:'#3730a3', padding:'1px 6px', borderRadius:99, fontWeight:600 }}>📥 inbox</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setDispatchModal(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={(!dispatchTo && !dispatchCopies.some(c=>c.deliveryMode==='inbox'&&c.staffId))||dispatching} style={{ background:'#f59e0b', borderColor:'#f59e0b' }}>
                  <ArrowRight size={14}/> {dispatching ? t('dispatching') : t('stamp_dispatch')}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Forward Modal — pre-filled from incoming letter */}
      {forwardModal&&createPortal(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setForwardModal(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize:17, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
                  <ArrowRight size={18} color="#6366f1"/> Forward / Route Letter
                </h2>
                <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{forwardModal.refNo} · {forwardModal.subject}</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={()=>setForwardModal(null)}><X size={18}/></button>
            </div>
            <form onSubmit={e=>{e.preventDefault();if(!forwardTo)return;forwardLetter(forwardModal,forwardTo,forwardNote);setForwardModal(null);setForwardTo('');setForwardNote('');setViewLetter(null);}}>
              <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Auto-filled letter info — read only */}
                <div style={{ background:'var(--surface-2)', borderRadius:10, padding:'14px 16px', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10, fontWeight:700 }}>Letter Information (Auto-filled)</div>
                  <div className="grid grid-2" style={{ gap:10 }}>
                    <div>
                      <div style={{ fontSize:11, color:'var(--text-faint)' }}>From</div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{forwardModal.sender}</div>
                      <div style={{ fontSize:11, color:'var(--text-faint)' }}>{forwardModal.senderOrg}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:'var(--text-faint)' }}>Ref No.</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#1e40af' }}>{forwardModal.refNo}</div>
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <div style={{ fontSize:11, color:'var(--text-faint)' }}>Subject</div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{forwardModal.subject}</div>
                    </div>
                    {getAttachments(forwardModal).length > 0 && (
                      <div style={{ gridColumn:'1/-1' }}>
                        <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:4 }}>Attached Documents</div>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {getAttachments(forwardModal).map((att, i) => (
                            <button key={i} type="button" onClick={()=>setViewFile(att)}
                              style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, padding:'3px 10px', borderRadius:6, border:'1px solid #6366f1', background:'none', cursor:'pointer', color:'#6366f1', fontWeight:600 }}>
                              <Paperclip size={11}/> {att.name.length>20?att.name.slice(0,20)+'...':att.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Officer fills only these */}
                <div style={{ background:'#eef2ff', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#3730a3', display:'flex', alignItems:'center', gap:8 }}>
                  <ArrowRight size={13}/> Fill in the routing details below — everything else is carried over automatically.
                </div>

                <div className="form-group">
                  <label className="form-label">Forward To Office *</label>
                  <select className="form-control" required value={forwardTo} onChange={e=>setForwardTo(e.target.value)}>
                    <option value="">Select destination office</option>
                    {OFFICES.filter(o=>o!==myOffice).map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Your Concern / Comment *</label>
                  <textarea className="form-control" rows={4} required value={forwardNote}
                    onChange={e=>setForwardNote(e.target.value)}
                    placeholder="e.g. Please review the attached request and prepare the financial report by Friday."/>
                  <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:3 }}>This will be visible to the receiving office.</div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setForwardModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!forwardTo||!forwardNote.trim()}
                  style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <ArrowRight size={14}/> Forward Letter
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* View Modal */}
      {viewLetter&&createPortal(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setViewLetter(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize:17, fontWeight:700 }}>{viewLetter.refNo}</h2>
                <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                  Incoming Letter
                  {viewLetter._autoDelivered&&<span style={{ marginLeft:8, color:'#6366f1', fontWeight:600 }}>· Auto-delivered</span>}
                  {viewLetter._forwardedFrom&&<span style={{ marginLeft:8, color:'#f59e0b', fontWeight:600 }}>· Forwarded</span>}
                </p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={()=>setViewLetter(null)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2" style={{ gap:16 }}>
                {viewLetter._autoDelivered&&(
                  <div style={{ gridColumn:'1/-1', background:'#eef2ff', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#3730a3', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <Send size={13}/> Dispatched by <strong style={{ marginLeft:4 }}>Record Office</strong>
                    {viewLetter.senderOrg && <span style={{ marginLeft:4, opacity:.8 }}>· From: {viewLetter.senderOrg}</span>}
                    <span style={{ marginLeft:8, opacity:.7 }}>· Ref: {viewLetter._linkedOutRef}</span>
                    {wasReadByRecipient(viewLetter)&&<span style={{ marginLeft:'auto', color:'#10b981', display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={12}/> Viewed by recipient</span>}
                  </div>
                )}
                {/* CC copy destination indicator */}
                {viewLetter._autoDelivered && viewLetter._toOffice && (
                  <div style={{ gridColumn:'1/-1', background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:8, padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:'#10b981', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <ArrowRight size={14} color="#fff"/>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:'#166534', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px' }}>This copy is intended for</div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#15803d' }}>{viewLetter._toOffice}</div>
                    </div>
                    {viewLetter.receivedBy && (
                      <div style={{ marginLeft:'auto', textAlign:'right' }}>
                        <div style={{ fontSize:11, color:'#166534', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px' }}>Physically received by</div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#15803d' }}>{viewLetter.receivedBy}</div>
                      </div>
                    )}
                  </div>
                )}
                {viewLetter._forwardedFrom&&(
                  <div style={{ gridColumn:'1/-1', background:'#fef3c7', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400e', display:'flex', alignItems:'center', gap:8 }}>
                    <Share2 size={13}/> Routed by <strong style={{ marginLeft:4 }}>Record Office</strong> · Original: {viewLetter._forwardedFrom}
                  </div>
                )}
                {/* Outgoing letter waiting at Record Office for dispatch */}
                {!viewLetter._autoDelivered && viewLetter._linkedOutRef && viewLetter._toOffice === 'Record Office' && (
                  <div style={{ gridColumn:'1/-1', background:'#fef3c7', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400e', display:'flex', alignItems:'center', gap:8 }}>
                    <Send size={13}/> Outgoing letter from <strong style={{ marginLeft:4 }}>{viewLetter._fromOffice}</strong> — awaiting dispatch to <strong style={{ marginLeft:4 }}>{viewLetter.intendedFor || 'recipient'}</strong>
                    <span style={{ marginLeft:8, opacity:.7 }}>· Out Ref: {viewLetter._linkedOutRef}</span>
                  </div>
                )}
                {[['Ref No.',viewLetter.refNo],['Date Received',viewLetter.dateReceived],['Sender',viewLetter.sender],['Office',viewLetter.senderOrg],['Department',viewLetter.department],['Mode',viewLetter.mode]].map(([k,v])=>(
                  <div key={k}><div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>{k}</div><div style={{ fontSize:14, fontWeight:500 }}>{v}</div></div>
                ))}
                <div style={{ gridColumn:'1/-1' }}><div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Subject</div><div style={{ fontSize:14, fontWeight:500 }}>{viewLetter.subject}</div></div>
                <div><div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Priority</div><span className={'badge '+(priorityColor[viewLetter.priority]||'badge-gray')}>{viewLetter.priority}</span></div>
                <div><div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Status</div><span className={'badge '+(statusColor[viewLetter.status]||'badge-gray')}>{viewLetter.status}</span></div>
                {viewLetter.remarks&&<div style={{ gridColumn:'1/-1' }}><div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Remarks</div><div style={{ fontSize:13, color:'var(--text-muted)' }}>{viewLetter.remarks}</div></div>}
                {viewLetter.stampedBy&&(
                  <div style={{ gridColumn:'1/-1', background:'rgba(99,102,241,.06)', border:'1.5px solid #6366f1', borderRadius:10, padding:'12px 16px' }}>
                    <div style={{ fontSize:11, color:'#6366f1', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:700, marginBottom:8 }}>Record Office Stamp</div>
                    <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                      <div><div style={{ fontSize:10, color:'var(--text-faint)' }}>Ref No.</div><div style={{ fontSize:13, fontWeight:700 }}>{viewLetter.dispatchRef||viewLetter.refNo}</div></div>
                      <div><div style={{ fontSize:10, color:'var(--text-faint)' }}>Stamped By</div><div style={{ fontSize:13, fontWeight:700 }}>{viewLetter.stampedBy}</div></div>
                      <div><div style={{ fontSize:10, color:'var(--text-faint)' }}>Directed To</div><div style={{ fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}><ArrowRight size={13} color="#6366f1"/>{viewLetter._forwardedTo||viewLetter._toOffice}</div></div>
                      {viewLetter.stampedAt&&<div><div style={{ fontSize:10, color:'var(--text-faint)' }}>Date</div><div style={{ fontSize:13, fontWeight:700 }}>{new Date(viewLetter.stampedAt).toLocaleDateString()}</div></div>}
                      {viewLetter.receivedBy&&<div><div style={{ fontSize:10, color:'var(--text-faint)' }}>Received By</div><div style={{ fontSize:13, fontWeight:700, color:'#10b981' }}>{viewLetter.receivedBy}</div></div>}
                    </div>
                  </div>
                )}
                {viewLetter._forwardedTo&&<div style={{ gridColumn:'1/-1' }}><div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Forwarded To</div><span style={{ fontSize:13, background:'#eef2ff', color:'#3730a3', padding:'3px 12px', borderRadius:99, fontWeight:600 }}>{viewLetter._forwardedTo}</span></div>}
                {viewLetter.intendedFor&&<div style={{ gridColumn:'1/-1' }}><div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Intended For</div><span style={{ fontSize:13, background:'#fef3c7', color:'#92400e', padding:'3px 12px', borderRadius:99, fontWeight:600 }}>→ {viewLetter.intendedFor}</span></div>}
                {getAttachments(viewLetter).length > 0 && (
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>
                      Attached Documents ({getAttachments(viewLetter).length})
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {getAttachments(viewLetter).map((att, idx) => (
                        <div key={idx} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', border:'1.5px solid var(--border)', borderRadius:10, background:'var(--surface-2)' }}>
                          <div style={{ fontSize:24 }}>{getIcon(att.type)}</div>
                          <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600 }}>{att.name}</div><div style={{ fontSize:11, color:'var(--text-faint)' }}>{fmt(att.size)}</div></div>
                          <button onClick={()=>setViewFile(att)} className="btn btn-primary btn-sm">View</button>
                          <button onClick={()=>printFile(att)} className="btn btn-ghost btn-sm" title="Print" style={{ display:'flex', alignItems:'center', gap:5 }}><Printer size={13}/> Print</button>
                          <a href={att.url ? `http://localhost:5000${att.url}` : att.dataUrl} download={att.name} className="btn btn-ghost btn-sm" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}><Download size={13}/> Download</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {isRecordOfficer && viewLetter.status==='Registered' && !isSupportRequest(viewLetter) &&
                <button className="btn btn-primary" style={{ background:'#f59e0b', borderColor:'#f59e0b' }} onClick={()=>{openDispatch(viewLetter);setViewLetter(null);}}><ArrowRight size={14}/> Dispatch</button>}
              {isRecordOfficer && viewLetter.stampedBy && viewLetter.status !== 'Registered' && (
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, padding:'8px 14px', borderRadius:8, background:'#f0fdf4', color:'#166534', border:'1px solid #86efac' }}>
                  <CheckCircle size={15}/> Dispatched to {viewLetter._forwardedTo || viewLetter.stampedBy && 'office'} {viewLetter.stampedAt ? '· ' + new Date(viewLetter.stampedAt).toLocaleDateString() : ''}
                </span>
              )}
              {isRecordOfficer && (isSupportRequest(viewLetter) || ['Registered','Forwarded','Under Review'].includes(viewLetter.status)) &&
                <button className="btn btn-outline" style={{ color:'#10b981', borderColor:'#10b981' }} onClick={()=>{setReplyModal(viewLetter);setReplyText('');setViewLetter(null);}}><Send size={14}/> Reply</button>}
              {!isRecordOfficer && ['Registered','Forwarded','Under Review'].includes(viewLetter.status) &&
                <button className="btn btn-primary" style={{ background:'#6366f1', borderColor:'#6366f1', display:'flex', alignItems:'center', gap:6 }}
                  onClick={()=>{setForwardModal(viewLetter);setForwardTo('');setForwardNote('');setViewLetter(null);}}>
                  <ArrowRight size={14}/> Forward →
                </button>}
              {!readOnly&&<button className="btn btn-outline" onClick={()=>{setViewLetter(null);openEdit(viewLetter);}}><Edit2 size={14}/> Edit</button>}
              <button className="btn btn-ghost" onClick={()=>setViewLetter(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reply Modal — Record Officer only */}
      {replyModal && createPortal(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setReplyModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize:17, fontWeight:700 }}>{isSupportRequest(replyModal) ? 'Reply to Support Request' : 'Reply to Letter'}</h2>
                <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                  Re: {replyModal.subject} · From {replyModal.sender}
                </p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={()=>setReplyModal(null)}><X size={18}/></button>
            </div>
            <form onSubmit={handleReply}>
              <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {/* Original message */}
                <div style={{ background:'var(--surface-2)', borderRadius:8, padding:'12px 14px', border:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)' }}>
                  <div style={{ fontWeight:700, color:'var(--text)', marginBottom:4 }}>Original: {replyModal.refNo}</div>
                  <div>{replyModal.remarks || replyModal.subject}</div>
                </div>
                {/* Reply to info */}
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                  <Send size={14} color="#10b981"/>
                  <span>Reply will be sent to: <strong>{replyModal._fromOffice || replyModal.senderOrg}</strong></span>
                </div>
                <div className="form-group">
                  <label className="form-label">Your Response *</label>
                  <textarea className="form-control" rows={5} required value={replyText}
                    onChange={e=>setReplyText(e.target.value)}
                    placeholder="Type your response here..."/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setReplyModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!replyText.trim()||replySending}
                  style={{ background:'#10b981', borderColor:'#10b981', display:'flex', alignItems:'center', gap:6 }}>
                  <Send size={14}/> {replySending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {viewFile && createPortal(<FileViewer file={viewFile} onClose={()=>setViewFile(null)}/>, document.body)}
    </div>
  );
}
