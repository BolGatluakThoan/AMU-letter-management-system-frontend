import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Eye, Edit2, Trash2, X, Paperclip, Download, Send, Printer, Copy, AlertCircle } from 'lucide-react';
import { useApp, OFFICES } from '../context/AppContext';
import { departments, dispatchMethods, outgoingStatuses, priorities } from '../data/mockData';
import FileViewer from '../components/FileViewer';
import FileUploadZone from '../components/FileUploadZone';
import DepartmentSelect from '../components/DepartmentSelect';
import { useI18n } from '../i18n/index.jsx';

const statusColor = { Draft:'badge-gray', Approved:'badge-info', Sent:'badge-primary', Delivered:'badge-success' };
const emptyForm = {
  recipient:'', recipientOrg:'', toOffice:'', subject:'', department:'',
  datePrepared:'', relatedIncoming:'', dispatchMethod:'Email', priority:'Normal',
  trackingNo:'', responsibleOfficer:'', status:'Draft', attachments:[], notes:'',
  referralNo:'',
  copies:[],
};

function fmt(b) {
  if (!b) return '';
  if (b < 1024) return b + ' B';
  if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
  return (b/(1024*1024)).toFixed(1) + ' MB';
}

function getIcon(t) {
  if (!t || !t.startsWith) return '📄';
  if (t.startsWith('image/')) return '🖼️';
  if (t === 'application/pdf') return '📕';
  if (t.includes('word')) return '📝';
  if (t.includes('excel') || t.includes('spreadsheet')) return '📊';
  return '📄';
}

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

export default function OutgoingLetters() {
  const { outgoing, addOutgoing, updateOutgoing, deleteOutgoing, readOnly, user } = useApp();
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewLetter, setViewLetter] = useState(null);
  const [editLetter, setEditLetter] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [viewFile, setViewFile] = useState(null);
  const [refError, setRefError] = useState('');

  // CC helpers
  const addCopy = () => {
    const copies = [...(form.copies||[]), { no: (form.copies||[]).length + 1, body: '', file: null }];
    setForm(p => ({ ...p, copies }));
  };
  const updateCopy = (i, key, val) => {
    const copies = (form.copies||[]).map((c, idx) => idx === i ? { ...c, [key]: val } : c);
    setForm(p => ({ ...p, copies }));
  };
  const removeCopy = (i) => {
    const copies = (form.copies||[]).filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, no: idx + 1 }));
    setForm(p => ({ ...p, copies }));
  };

  const filtered = outgoing.filter(l => {
    const q = search.toLowerCase();
    return (!q || l.refNo?.toLowerCase().includes(q) || l.recipient?.toLowerCase().includes(q) || l.subject?.toLowerCase().includes(q) || l.recipientOrg?.toLowerCase().includes(q))
      && (!filterStatus || l.status === filterStatus);
  });

  const [step, setStep] = useState(1);
  const [nextError, setNextError] = useState('');

  const openAdd = () => {
    const now = new Date();
    const trackingNo = `TRK-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*9000)+1000)}`;
    setForm({ ...emptyForm, responsibleOfficer: user?.name || '', trackingNo });
    setEditLetter(null); setStep(1); setNextError(''); setShowModal(true);
  };
  const openEdit = (l) => { setForm({ ...l, attachments: getAttachments(l) }); setEditLetter(l); setStep(1); setShowModal(true); };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    setRefError('');
    if (editLetter) { await updateOutgoing(editLetter.id, form); setShowModal(false); return; }
    setSending(true);
    try {
      await addOutgoing({ ...form, status: form.toOffice ? 'Sent' : form.status });
      setShowModal(false);
      setStep(1);
    } catch (err) {
      console.error('Failed to save outgoing letter:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700 }}>{t('outgoing')}</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>{outgoing.length} total letters</p>
        </div>
        {!readOnly && <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> {t('register_letter')}</button>}
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ padding:'14px 20px', display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-faint)' }}/>
            <input className="form-control" placeholder={t('search_ref')} value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:32 }}/>
          </div>
          <select className="form-control" style={{ width:160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{t('all_statuses')}</option>
            {outgoingStatuses.map(s => <option key={s}>{s}</option>)}
          </select>
          {(search || filterStatus) && <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); }}><X size={14}/> Clear</button>}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('ref_no')}</th><th>Referral No.</th><th>{t('date')}</th><th>{t('recipient')}</th><th>{t('to_office')}</th><th>{t('subject')}</th><th>{t('priority')}</th><th>CC</th><th>Files</th><th>{t('status')}</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={9} style={{ textAlign:'center', padding:40, color:'var(--text-faint)' }}>{t('no_letters_found')}</td></tr>
                : filtered.map(l => {
                  const atts = getAttachments(l);
                  return (
                    <tr key={l.id}>
                      <td style={{ fontWeight:600, color:'#0891b2' }}>{l.refNo}</td>
                      <td style={{ fontFamily:'monospace', fontSize:11, color:'#6366f1' }}>{l.referralNo || <span style={{ color:'var(--text-faint)' }}>—</span>}</td>
                      <td>{l.datePrepared}</td>
                      <td><div style={{ fontWeight:500 }}>{l.recipient}</div><div style={{ fontSize:11, color:'var(--text-faint)' }}>{l.recipientOrg}</div></td>
                      <td>{l.toOffice ? <span style={{ fontSize:11, background:'#eef2ff', color:'#3730a3', padding:'2px 8px', borderRadius:99, fontWeight:600 }}>{l.toOffice}</span> : <span style={{ color:'var(--text-faint)', fontSize:12 }}>External</span>}</td>
                      <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.subject}</td>
                      <td><span className={'badge '+(l.priority==='Urgent'?'badge-warning':l.priority==='Confidential'?'badge-danger':'badge-gray')}>{l.priority||'Normal'}</span></td>
                      <td>
                        {(l.copies||[]).length > 0
                          ? <span style={{ fontSize:11, background:'#eef2ff', color:'#3730a3', padding:'2px 8px', borderRadius:99, fontWeight:600, cursor:'pointer' }}
                              title={(l.copies||[]).map(c=>`${c.no}. ${c.body}`).join('\n')}>
                              CC: {(l.copies||[]).length}
                            </span>
                          : <span style={{ color:'var(--text-faint)', fontSize:12 }}>—</span>}
                      </td>
                      <td>{atts.length > 0
                        ? <button onClick={() => setViewFile(atts[0])} style={{ display:'flex', alignItems:'center', gap:4, color:'#6366f1', fontSize:12, background:'none', border:'none', cursor:'pointer', padding:0 }}>
                            <Paperclip size={13}/>{atts.length > 1 ? `${atts.length} files` : (atts[0].name.length>14?atts[0].name.slice(0,14)+'...':atts[0].name)}
                          </button>
                        : <span style={{ color:'var(--text-faint)', fontSize:12 }}>-</span>}
                      </td>
                      <td><span className={'badge '+(statusColor[l.status]||'badge-gray')}>{l.status}</span></td>
                      <td><div style={{ display:'flex', gap:4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setViewLetter(l)}><Eye size={14}/></button>
                        {!readOnly && <>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(l)}><Edit2 size={14}/></button>
                          {/* Delete: sender's office OR Record Officer */}
                          {(l._fromOffice === user?.office || user?.role === 'Record Officer') && (
                            <button className="btn btn-ghost btn-icon btn-sm" style={{ color:'#ef4444' }} onClick={() => { if (window.confirm('Delete?')) deleteOutgoing(l.id); }}><Trash2 size={14}/></button>
                          )}
                        </>}
                      </div></td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', color:'var(--text-faint)', fontSize:12 }}>Showing {filtered.length} of {outgoing.length}</div>
      </div>

      {/* Add/Edit Modal — 3-step wizard */}
      {showModal && createPortal(
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize:17, fontWeight:700 }}>{editLetter ? 'Edit' : 'New'} Outgoing Letter</h2>
                {!editLetter && (
                  <>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, padding:'6px 10px', background:'rgba(8,145,178,.08)', borderRadius:7, width:'fit-content' }}>
                      <span style={{ fontSize:18 }}>📤</span>
                      <span style={{ fontSize:12, color:'#0e7490', fontWeight:600 }}>Your Office → Recipient / Other Office</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:0, marginTop:8 }}>
                      {[['1','Letter Info'],['2','Delivery'],['3','CC & Files']].map(([n, label], i) => (
                        <div key={n} style={{ display:'flex', alignItems:'center' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, cursor: Number(n) < step ? 'pointer' : 'default' }}
                            onClick={() => { if (Number(n) < step) setStep(Number(n)); }}>
                            <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700,
                              background: step === Number(n) ? '#6366f1' : step > Number(n) ? '#10b981' : 'var(--border)',
                              color: step >= Number(n) ? '#fff' : 'var(--text-faint)' }}>
                              {step > Number(n) ? '✓' : n}
                            </div>
                            <span style={{ fontSize:12, fontWeight: step === Number(n) ? 700 : 400, color: step === Number(n) ? '#6366f1' : step > Number(n) ? '#10b981' : 'var(--text-faint)' }}>{label}</span>
                          </div>
                          {i < 2 && <div style={{ width:28, height:2, background: step > Number(n) ? '#10b981' : 'var(--border)', margin:'0 6px' }}/>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">

                {/* ── Step 1: Letter Info ── */}
                {(editLetter || step === 1) && (
                  <div className="grid grid-2" style={{ gap:16 }}>
                    <div className="form-group"><label className="form-label">{t('recipient')} *</label><input className="form-control" required value={form.recipient} onChange={e => f('recipient', e.target.value)} placeholder="Full name" autoFocus/></div>
                    <div className="form-group"><label className="form-label">{t('organization')} *</label><input className="form-control" required value={form.recipientOrg} onChange={e => f('recipientOrg', e.target.value)} placeholder="Organization"/></div>
                    <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">{t('subject')} *</label><input className="form-control" required value={form.subject} onChange={e => f('subject', e.target.value)} placeholder="Letter subject"/></div>
                    <div className="form-group" style={{ gridColumn:'1/-1' }}>
                      <label className="form-label">{t('referral_number')}</label>
                      <input className="form-control" value={form.referralNo||''} onChange={e => { f('referralNo', e.target.value); setRefError(''); }}
                        placeholder={t('referral_placeholder')} style={{ borderColor: refError ? '#ef4444' : undefined, fontFamily:'monospace' }}/>
                      <div style={{ fontSize:11, color: refError ? '#ef4444' : 'var(--text-faint)', marginTop:3 }}>{refError || t('referral_hint')}</div>
                    </div>
                    <div className="form-group"><label className="form-label">{t('department')} *</label><DepartmentSelect required value={form.department} onChange={v => f('department', v)}/></div>
                    <div className="form-group"><label className="form-label">{t('date_prepared')} *</label><input type="date" className="form-control" required value={form.datePrepared} onChange={e => f('datePrepared', e.target.value)}/></div>
                    <div className="form-group"><label className="form-label">{t('priority')}</label><select className="form-control" value={form.priority} onChange={e => f('priority', e.target.value)}>{priorities.map(p => <option key={p}>{p}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">{t('status')}</label><select className="form-control" value={form.status} onChange={e => f('status', e.target.value)}>{outgoingStatuses.map(s => <option key={s}>{s}</option>)}</select></div>
                  </div>
                )}

                {/* ── Step 2: Delivery ── */}
                {!editLetter && step === 2 && (
                  <div className="grid grid-2" style={{ gap:16 }}>

                    {/* Record Office — mandatory gateway */}
                    <div className="form-group" style={{ gridColumn:'1/-1' }}>
                      <label className="form-label">Destination</label>
                      <div style={{ background:'#fef3c7', border:'1.5px solid #f59e0b', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:36, height:36, borderRadius:9, background:'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontSize:16 }}>🏢</span>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'#92400e' }}>Record Office</div>
                          <div style={{ fontSize:11, color:'#b45309', marginTop:1 }}>All outgoing letters must pass through Record Office for stamping and routing.</div>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, background:'#f59e0b', color:'#fff' }}>Mandatory</span>
                      </div>
                      {/* Flow diagram */}
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, padding:'8px 12px', background:'var(--surface-2)', borderRadius:8, fontSize:12 }}>
                        <span style={{ fontWeight:600, color:'var(--text)' }}>Your Office</span>
                        <span style={{ color:'var(--text-faint)' }}>→</span>
                        <span style={{ fontWeight:700, color:'#f59e0b' }}>Record Office</span>
                        <span style={{ color:'var(--text-faint)' }}>→</span>
                        <span style={{ fontWeight:600, color:'#6366f1' }}>{form.toOffice || 'Final Recipient'}</span>
                      </div>
                    </div>

                    {/* Final recipient (internal office, optional) */}
                    <div className="form-group" style={{ gridColumn:'1/-1' }}>
                      <label className="form-label">Final Recipient Office <span style={{ color:'var(--text-faint)', fontWeight:400 }}>(internal, optional)</span></label>
                      <select className="form-control" value={form.toOffice} onChange={e => f('toOffice', e.target.value)}>
                        <option value="">External recipient / not internal</option>
                        {OFFICES.filter(o => o !== 'Record Office').map(o => <option key={o}>{o}</option>)}
                      </select>
                      {form.toOffice && <div style={{ marginTop:6, fontSize:12, color:'#10b981', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}><Send size={12}/> After Record Office stamps it, will be routed to {form.toOffice}</div>}
                    </div>

                    <div className="form-group"><label className="form-label">{t('dispatch_method')}</label><select className="form-control" value={form.dispatchMethod} onChange={e => f('dispatchMethod', e.target.value)}>{dispatchMethods.map(m => <option key={m}>{m}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">{t('responsible_officer')} *</label><input className="form-control" required value={form.responsibleOfficer} onChange={e => f('responsibleOfficer', e.target.value)} placeholder="Officer name"/></div>
                    <div className="form-group"><label className="form-label">{t('related_incoming')}</label><input className="form-control" value={form.relatedIncoming} onChange={e => f('relatedIncoming', e.target.value)} placeholder="e.g. INC-2026-001"/></div>
                    <div className="form-group"><label className="form-label">Tracking Number</label><input className="form-control" value={form.trackingNo} readOnly style={{ background:'var(--surface-2)', color:'var(--text-muted)' }}/></div>
                    <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">{t('notes')}</label><textarea className="form-control" rows={3} value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Optional notes or instructions"/></div>
                  </div>
                )}

                {/* ── Step 3: CC & Attachments ── */}
                {!editLetter && step === 3 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

                    {/* Multi-department CC tagger */}
                    <div className="form-group">
                      <label className="form-label">ግልባጭ / CC — Send copies to offices</label>
                      <div style={{ fontSize:12, color:'var(--text-faint)', marginBottom:8 }}>
                        Select all offices that should receive a copy. Each will get it in their inbox automatically.
                      </div>

                      {/* Selected tags */}
                      {(form.copies||[]).length > 0 && (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                          {(form.copies||[]).map((copy, i) => (
                            <span key={i} style={{ display:'flex', alignItems:'center', gap:5, background:'#eef2ff', color:'#3730a3', borderRadius:99, padding:'4px 10px', fontSize:12, fontWeight:600, border:'1px solid #c7d2fe' }}>
                              {copy.body}
                              <button type="button" onClick={() => removeCopy(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6366f1', padding:0, lineHeight:1, fontSize:14 }}>×</button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Office picker dropdown */}
                      <select className="form-control"
                        value=""
                        onChange={e => {
                          const office = e.target.value;
                          if (!office) return;
                          if ((form.copies||[]).some(c => c.body === office)) return; // no duplicates
                          const copies = [...(form.copies||[]), { no: (form.copies||[]).length + 1, body: office, file: '' }];
                          setForm(p => ({ ...p, copies }));
                        }}>
                        <option value="">+ Select an office to add as CC...</option>
                        {OFFICES.filter(o => !(form.copies||[]).some(c => c.body === o)).map(o => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>

                      {(form.copies||[]).length === 0 && (
                        <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:6 }}>No offices tagged yet. Select from the dropdown above.</div>
                      )}
                      {(form.copies||[]).length > 0 && (
                        <div style={{ fontSize:11, color:'#6366f1', marginTop:6, display:'flex', alignItems:'center', gap:5 }}>
                          <Send size={11}/> {(form.copies||[]).length} office{(form.copies||[]).length > 1 ? 's' : ''} will receive a copy automatically.
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">{t('attachments')}</label>
                      <FileUploadZone value={form.attachments||[]} onChange={atts => f('attachments', atts)} onPreview={setViewFile}/>
                    </div>
                  </div>
                )}

              </div>

              <div className="modal-footer">
                {nextError && (
                  <div style={{ flex:1, fontSize:12, color:'#ef4444', display:'flex', alignItems:'center', gap:6 }}>
                    ⚠ {nextError}
                  </div>
                )}
                <button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); setNextError(''); }}>{t('cancel')}</button>
                {!editLetter && step > 1 && (
                  <button type="button" className="btn btn-outline" onClick={() => { setStep(s => s - 1); setNextError(''); }}>← Back</button>
                )}
                {!editLetter && step < 3 && (
                  <button type="button" className="btn btn-primary"
                    onClick={() => {
                      if (step === 1) {
                        const missing = [];
                        if (!form.recipient?.trim()) missing.push('Recipient');
                        if (!form.recipientOrg?.trim()) missing.push('Organization');
                        if (!form.subject?.trim()) missing.push('Subject');
                        if (!form.datePrepared) missing.push('Date');
                        if (missing.length > 0) { setNextError(`Please fill in: ${missing.join(', ')}`); return; }
                      }
                      setNextError('');
                      setStep(s => s + 1);
                    }}>
                    Next →
                  </button>
                )}
                {(editLetter || step === 3) && (
                  <button type="submit" className="btn btn-primary" disabled={sending}>
                    {sending ? t('dispatching') : editLetter ? t('save') : form.toOffice ? 'Send to Office' : t('register_letter')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* View Modal */}
      {viewLetter && createPortal(
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewLetter(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div><h2 style={{ fontSize:17, fontWeight:700 }}>{viewLetter.refNo}</h2><p style={{ fontSize:12, color:'var(--text-muted)' }}>Outgoing Letter</p></div>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewLetter(null)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2" style={{ gap:16 }}>
                {[['Ref No.',viewLetter.refNo],['Date',viewLetter.datePrepared],['Recipient',viewLetter.recipient],['Organization',viewLetter.recipientOrg],['Department',viewLetter.department],['Dispatch',viewLetter.dispatchMethod],['Officer',viewLetter.responsibleOfficer],['Tracking',viewLetter.trackingNo||'-'],['Related',viewLetter.relatedIncoming||'-'],['Priority',viewLetter.priority||'Normal']].map(([k,v]) => (
                  <div key={k}><div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>{k}</div><div style={{ fontSize:14, fontWeight:500 }}>{v}</div></div>
                ))}
                {viewLetter.toOffice && <div style={{ gridColumn:'1/-1' }}><div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Delivered To</div><span style={{ fontSize:13, background:'#eef2ff', color:'#3730a3', padding:'3px 12px', borderRadius:99, fontWeight:600 }}>{viewLetter.toOffice}</span></div>}
                <div style={{ gridColumn:'1/-1' }}><div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Subject</div><div style={{ fontSize:14, fontWeight:500 }}>{viewLetter.subject}</div></div>
                {viewLetter.notes && <div style={{ gridColumn:'1/-1' }}><div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Notes</div><div style={{ fontSize:13 }}>{viewLetter.notes}</div></div>}
                {/* Referral Number */}
                {viewLetter.referralNo && (
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Referral Number</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#6366f1', fontFamily:'monospace' }}>{viewLetter.referralNo}</div>
                  </div>
                )}
                {/* CC Copies */}
                {(viewLetter.copies||[]).length > 0 && (
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>CC / Copies ({viewLetter.copies.length})</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {viewLetter.copies.map((c, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px', background:'var(--surface-2)', borderRadius:8, border:'1px solid var(--border)' }}>
                          <span style={{ fontSize:12, fontWeight:700, color:'#6366f1', minWidth:24 }}>#{c.no}</span>
                          <span style={{ fontSize:13, flex:1 }}>{c.body}</span>
                          {c.file && <span style={{ fontSize:11, color:'var(--text-faint)' }}>{c.file}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div><div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Status</div><span className={'badge '+(statusColor[viewLetter.status]||'badge-gray')}>{viewLetter.status}</span></div>
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
                          <button onClick={() => setViewFile(att)} className="btn btn-primary btn-sm">View</button>
                          <button onClick={() => printFile(att)} className="btn btn-ghost btn-sm" title="Print" style={{ display:'flex', alignItems:'center', gap:5 }}><Printer size={13}/> Print</button>
                          <a href={att.url ? `http://localhost:5000${att.url}` : att.dataUrl} download={att.name} className="btn btn-ghost btn-sm" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}><Download size={13}/> Download</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {!readOnly && <button className="btn btn-outline" onClick={() => { setViewLetter(null); openEdit(viewLetter); }}><Edit2 size={14}/> Edit</button>}
              <button className="btn btn-ghost" onClick={() => setViewLetter(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {viewFile && createPortal(<FileViewer file={viewFile} onClose={() => setViewFile(null)}/>, document.body)}
    </div>
  );
}
