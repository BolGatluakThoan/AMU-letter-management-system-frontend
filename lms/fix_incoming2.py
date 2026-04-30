import os
base = os.path.dirname(os.path.abspath(__file__))

content = r"""import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2, X, Upload, Paperclip, Download, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { departments, priorities, deliveryModes, incomingStatuses } from '../data/mockData';

const statusColor = {
  Registered:'badge-primary', Forwarded:'badge-info',
  'Under Review':'badge-warning', Responded:'badge-success', Closed:'badge-gray',
};
const priorityColor = { Normal:'badge-gray', Urgent:'badge-warning', Confidential:'badge-danger' };

const empty = {
  sender:'', senderOrg:'', subject:'', department:'', priority:'Normal',
  mode:'Email', dateReceived:'', status:'Registered', remarks:'', attachment:null,
};

const MAX_SIZE = 25 * 1024 * 1024;

function fmt(b) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/(1024*1024)).toFixed(1)} MB`;
}

function getIcon(type) {
  if (!type) return '📄';
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📕';
  if (type.includes('word')) return '📝';
  if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
  if (type.includes('zip') || type.includes('rar')) return '🗜️';
  return '📄';
}

function FileUploadZone({ value, onChange }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState('');
  const process = (file) => {
    setErr('');
    if (file.size > MAX_SIZE) { setErr('File must be under 25 MB.'); return; }
    const reader = new FileReader();
    reader.onload = e => onChange({ name:file.name, size:file.size, type:file.type, dataUrl:e.target.result });
    reader.readAsDataURL(file);
  };
  if (value) return (
    <div style={{ border:'1.5px solid var(--border)', borderRadius:10, padding:'14px 16px', background:'var(--surface-2)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ fontSize:26 }}>{getIcon(value.type)}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value.name}</div>
          <div style={{ fontSize:11, color:'var(--text-faint)' }}>{fmt(value.size)}</div>
        </div>
        <a href={value.dataUrl} target="_blank" rel="noreferrer"
          style={{ fontSize:12, color:'#6366f1', fontWeight:600, textDecoration:'none', padding:'4px 10px', border:'1px solid #6366f1', borderRadius:6 }}>Preview</a>
        <button type="button" onClick={() => onChange(null)}
          style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:4 }}><X size={15}/></button>
      </div>
    </div>
  );
  return (
    <div>
      <div onClick={() => ref.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) process(e.dataTransfer.files[0]); }}
        style={{ border:`2px dashed ${drag?'#6366f1':'var(--border)'}`, borderRadius:10, padding:'24px 20px', textAlign:'center', cursor:'pointer', background:drag?'rgba(99,102,241,.06)':'var(--surface-2)', transition:'all .15s' }}>
        <Upload size={22} style={{ margin:'0 auto 8px', color:drag?'#6366f1':'var(--text-faint)', display:'block' }}/>
        <div style={{ fontSize:13, fontWeight:600 }}>{drag?'Drop file here':'Click to upload or drag & drop'}</div>
        <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>Any file format · Max 25 MB</div>
        <input ref={ref} type="file" accept="*/*" style={{ display:'none' }} onChange={e => { if (e.target.files[0]) process(e.target.files[0]); }}/>
      </div>
      {err && <div style={{ fontSize:12, color:'#ef4444', marginTop:6 }}>{err}</div>}
    </div>
  );
}

export default function IncomingLetters() {
  const { incoming, addIncoming, updateIncoming, deleteIncoming, readOnly } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewLetter, setViewLetter] = useState(null);
  const [editLetter, setEditLetter] = useState(null);
  const [form, setForm] = useState(empty);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    if (id && incoming.length > 0) {
      const letter = incoming.find(l => String(l.id) === String(id));
      if (letter) { setViewLetter(letter); setSearchParams({}, { replace: true }); }
    }
  }, [searchParams, incoming]);

  const filtered = incoming.filter(l => {
    const q = search.toLowerCase();
    return (!q || l.refNo.toLowerCase().includes(q) || l.sender.toLowerCase().includes(q) || l.subject.toLowerCase().includes(q))
      && (!filterStatus || l.status === filterStatus)
      && (!filterPriority || l.priority === filterPriority);
  });

  const openAdd = () => { setForm(empty); setEditLetter(null); setShowModal(true); };
  const openEdit = (l) => { setForm({ ...l, attachment: l.attachment || null }); setEditLetter(l); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editLetter) updateIncoming(editLetter.id, form);
    else addIncoming(form);
    closeModal();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700 }}>Incoming Letters</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>{incoming.length} total letters registered</p>
        </div>
        {!readOnly && <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Register Letter</button>}
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ padding:'14px 20px', display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-faint)' }}/>
            <input className="form-control" placeholder="Search ref, sender, subject..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ paddingLeft:32 }}/>
          </div>
          <select className="form-control" style={{ width:160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {incomingStatuses.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="form-control" style={{ width:160 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            {priorities.map(p => <option key={p}>{p}</option>)}
          </select>
          {(search || filterStatus || filterPriority) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); }}>
              <X size={14}/> Clear
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ref No.</th><th>Date</th><th>Sender</th><th>Subject</th>
                <th>Dept</th><th>Priority</th><th>File</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={9} style={{ textAlign:'center', padding:40, color:'var(--text-faint)' }}>No letters found</td></tr>
                : filtered.map(l => (
                  <tr key={l.id} style={{ background: l._autoDelivered ? 'rgba(99,102,241,.03)' : undefined }}>
                    <td>
                      <div style={{ fontWeight:600, color:'#1e40af' }}>{l.refNo}</div>
                      {l._autoDelivered && (
                        <div style={{ fontSize:10, color:'#6366f1', display:'flex', alignItems:'center', gap:3, marginTop:2 }}>
                          <Send size={9}/> from {l._fromOffice}
                        </div>
                      )}
                    </td>
                    <td>{l.dateReceived}</td>
                    <td>
                      <div>{l.sender}</div>
                      <div style={{ fontSize:11, color:'var(--text-faint)' }}>{l.senderOrg}</div>
                    </td>
                    <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.subject}</td>
                    <td>{l.department}</td>
                    <td><span className={`badge ${priorityColor[l.priority]}`}>{l.priority}</span></td>
                    <td>
                      {l.attachment
                        ? <a href={l.attachment.dataUrl} target="_blank" rel="noreferrer"
                            style={{ display:'flex', alignItems:'center', gap:4, color:'#6366f1', fontSize:12, textDecoration:'none' }}>
                            <Paperclip size={13}/>{l.attachment.name.length>14?l.attachment.name.slice(0,14)+'…':l.attachment.name}
                          </a>
                        : <span style={{ color:'var(--text-faint)', fontSize:12 }}>—</span>}
                    </td>
                    <td><span className={`badge ${statusColor[l.status]}`}>{l.status}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => setViewLetter(l)}><Eye size={14}/></button>
                        {!readOnly && <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(l)}><Edit2 size={14}/></button>}
                        {!readOnly && <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={() => { if(window.confirm('Delete?')) deleteIncoming(l.id); }} style={{ color:'#ef4444' }}><Trash2 size={14}/></button>}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', color:'var(--text-faint)', fontSize:12 }}>
          Showing {filtered.length} of {incoming.length} letters
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 style={{ fontSize:17, fontWeight:700 }}>{editLetter ? 'Edit Letter' : 'Register Incoming Letter'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-2" style={{ gap:16 }}>
                  <div className="form-group">
                    <label className="form-label">Sender Name *</label>
                    <input className="form-control" required value={form.sender} onChange={e => f('sender', e.target.value)} placeholder="Full name"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Organization *</label>
                    <input className="form-control" required value={form.senderOrg} onChange={e => f('senderOrg', e.target.value)} placeholder="Organization"/>
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label className="form-label">Subject *</label>
                    <input className="form-control" required value={form.subject} onChange={e => f('subject', e.target.value)} placeholder="Letter subject"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select className="form-control" required value={form.department} onChange={e => f('department', e.target.value)}>
                      <option value="">Select department</option>
                      {departments.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date Received *</label>
                    <input type="date" className="form-control" required value={form.dateReceived} onChange={e => f('dateReceived', e.target.value)}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-control" value={form.priority} onChange={e => f('priority', e.target.value)}>
                      {priorities.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mode of Delivery</label>
                    <select className="form-control" value={form.mode} onChange={e => f('mode', e.target.value)}>
                      {deliveryModes.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={form.status} onChange={e => f('status', e.target.value)}>
                      {incomingStatuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label className="form-label">Remarks</label>
                    <textarea className="form-control" rows={2} value={form.remarks} onChange={e => f('remarks', e.target.value)} placeholder="Optional remarks"/>
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label className="form-label">Attach Document</label>
                    <FileUploadZone value={form.attachment} onChange={att => f('attachment', att)}/>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editLetter ? 'Save Changes' : 'Register Letter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewLetter && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewLetter(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize:17, fontWeight:700 }}>{viewLetter.refNo}</h2>
                <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                  Incoming Letter Details
                  {viewLetter._autoDelivered && <span style={{ marginLeft:8, color:'#6366f1', fontWeight:600 }}>· Auto-delivered</span>}
                </p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewLetter(null)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2" style={{ gap:16 }}>
                {viewLetter._autoDelivered && (
                  <div style={{ gridColumn:'1/-1', background:'#eef2ff', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#3730a3', display:'flex', alignItems:'center', gap:8 }}>
                    <Send size={13}/> Auto-delivered from <strong style={{ marginLeft:4 }}>{viewLetter._fromOffice}</strong>
                    <span style={{ marginLeft:8, opacity:.7 }}>· Linked outgoing: {viewLetter._linkedOutRef}</span>
                  </div>
                )}
                {[
                  ['Ref No.', viewLetter.refNo],
                  ['Date Received', viewLetter.dateReceived],
                  ['Sender', viewLetter.sender],
                  ['Organization', viewLetter.senderOrg],
                  ['Department', viewLetter.department],
                  ['Mode', viewLetter.mode],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>{k}</div>
                    <div style={{ fontSize:14, fontWeight:500 }}>{v}</div>
                  </div>
                ))}
                <div style={{ gridColumn:'1/-1' }}>
                  <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Subject</div>
                  <div style={{ fontSize:14, fontWeight:500 }}>{viewLetter.subject}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Priority</div>
                  <span className={`badge ${priorityColor[viewLetter.priority]}`}>{viewLetter.priority}</span>
                </div>
                <div>
                  <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Status</div>
                  <span className={`badge ${statusColor[viewLetter.status]}`}>{viewLetter.status}</span>
                </div>
                {viewLetter.remarks && (
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Remarks</div>
                    <div style={{ fontSize:13, color:'var(--text-muted)' }}>{viewLetter.remarks}</div>
                  </div>
                )}
                {viewLetter.attachment && (
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>Attached Document</div>
                    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', border:'1.5px solid var(--border)', borderRadius:10, background:'var(--surface-2)' }}>
                      <div style={{ fontSize:28 }}>{getIcon(viewLetter.attachment.type)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600 }}>{viewLetter.attachment.name}</div>
                        <div style={{ fontSize:11, color:'var(--text-faint)' }}>{fmt(viewLetter.attachment.size)}</div>
                      </div>
                      <a href={viewLetter.attachment.dataUrl} download={viewLetter.attachment.name}
                        className="btn btn-outline btn-sm" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
                        <Download size={13}/> Download
                      </a>
                      <a href={viewLetter.attachment.dataUrl} target="_blank" rel="noreferrer"
                        className="btn btn-ghost btn-sm" style={{ textDecoration:'none' }}>Open</a>
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
        </div>
      )}
    </div>
  );
}
"""

path = os.path.join(base, 'src', 'pages', 'IncomingLetters.jsx')
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Written IncomingLetters.jsx ({len(content)} bytes)')
print('ALL DONE')
