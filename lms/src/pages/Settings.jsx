import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building2, FileText, GitBranch, HardDrive, Shield, Bell, Database, Info,
         Save, Lock, ChevronRight, Check, AlertTriangle, Clock, RotateCcw, X, Eye, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n, LANG_OPTIONS } from '../i18n/index.jsx';

const BASE_SECTIONS = [
  { id:'org',      icon:Building2,  label:'Organization Settings',    adminOnly:true  },
  { id:'letter',   icon:FileText,   label:'Letter Configuration',     adminOnly:true  },
  { id:'workflow', icon:GitBranch,  label:'Status Workflow',          adminOnly:true  },
  { id:'files',    icon:HardDrive,  label:'File Management',          adminOnly:true  },
  { id:'security', icon:Shield,     label:'Security Policy',          adminOnly:true  },
  { id:'notif',    icon:Bell,       label:'Notification Configuration',adminOnly:false },
  { id:'language', icon:Globe,      label:'Language',                 adminOnly:false },
  { id:'offices',  icon:Building2,  label:'Offices & Departments',    adminOnly:true  },
  { id:'backup',   icon:Database,   label:'Backup & Maintenance',     adminOnly:true  },
  { id:'sysinfo',  icon:Info,       label:'System Information',       adminOnly:false },
];

function Toggle({ value, onChange, disabled }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!value)} style={{
      width:44, height:24, borderRadius:99, border:'none', cursor:disabled?'not-allowed':'pointer',
      background:value?'#6366f1':'var(--border)', position:'relative', transition:'background .2s', flexShrink:0,
      opacity:disabled?.6:1,
    }}>
      <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:value?23:3, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
    </button>
  );
}

function Field({ label, desc, children }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, padding:'14px 0', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
      <div style={{ flex:1, minWidth:120 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{label}</div>
        {desc && <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:3 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink:0, maxWidth:'100%' }}>{children}</div>
    </div>
  );
}

// ── Office & Department Manager ───────────────────────────────────────────────
function OfficeDeptManager({ offices, departments, addOffice, deleteOffice, addDepartment, deleteDepartment, refreshOffices, refreshDepartments, locked }) {
  const [newOffice, setNewOffice] = useState('');
  const [newDept, setNewDept] = useState('');
  const [deptOffice, setDeptOffice] = useState('');
  const [saving, setSaving] = useState('');
  const [msg, setMsg] = useState('');
  const [officeObjs, setOfficeObjs] = useState([]);
  const [deptObjs, setDeptObjs] = useState([]);

  // Load full objects (with IDs) for delete operations
  useEffect(() => {
    import('../lib/api').then(({ api }) => {
      api.getOffices().then(setOfficeObjs).catch(()=>{});
      api.getDepartments().then(setDeptObjs).catch(()=>{});
    });
  }, [offices, departments]);

  const handleAddOffice = async () => {
    if (!newOffice.trim()) return;
    setSaving('office');
    try {
      await addOffice({ name: newOffice.trim() });
      setNewOffice('');
      setMsg('✓ Office added.');
      setTimeout(() => setMsg(''), 2500);
    } catch (e) { setMsg(e.message || 'Failed'); }
    finally { setSaving(''); }
  };

  const handleDeleteOffice = async (name) => {
    if (!window.confirm(`Remove office "${name}"?`)) return;
    const obj = officeObjs.find(o => o.name === name);
    if (obj) await deleteOffice(obj._id || obj.id);
    else setMsg('Office not found in DB — restart server to sync.');
  };

  const handleAddDept = async () => {
    if (!newDept.trim()) return;
    setSaving('dept');
    try {
      await addDepartment({ name: newDept.trim(), office: deptOffice });
      setNewDept(''); setDeptOffice('');
      setMsg('✓ Department added.');
      setTimeout(() => setMsg(''), 2500);
    } catch (e) { setMsg(e.message || 'Failed'); }
    finally { setSaving(''); }
  };

  const handleDeleteDept = async (name) => {
    if (!window.confirm(`Remove department "${name}"?`)) return;
    const obj = deptObjs.find(d => d.name === name);
    if (obj) await deleteDepartment(obj._id || obj.id);
    else setMsg('Department not found in DB — restart server to sync.');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
      {msg && <div style={{ background: msg.startsWith('✓') ? '#d1fae5' : '#fee2e2', border:`1px solid ${msg.startsWith('✓')?'#a7f3d0':'#fecaca'}`, borderRadius:8, padding:'10px 14px', fontSize:13, color: msg.startsWith('✓') ? '#065f46' : '#991b1b' }}>{msg}</div>}

      {/* Offices */}
      <div>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
          🏢 Offices <span style={{ fontSize:11, color:'var(--text-faint)', fontWeight:400 }}>({offices.length})</span>
        </div>
        {!locked && (
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <input className="form-control" placeholder="New office name..." value={newOffice} onChange={e=>setNewOffice(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleAddOffice()} style={{ flex:1 }}/>
            <button className="btn btn-primary btn-sm" onClick={handleAddOffice} disabled={saving==='office' || !newOffice.trim()}>
              {saving==='office' ? '...' : '+ Add Office'}
            </button>
          </div>
        )}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {offices.map(o => (
            <span key={o} style={{ display:'flex', alignItems:'center', gap:6, background:'#eef2ff', color:'#3730a3', borderRadius:99, padding:'4px 12px', fontSize:12, fontWeight:600, border:'1px solid #c7d2fe' }}>
              {o}
              {!locked && (
                <button onClick={()=>handleDeleteOffice(o)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#6366f1', padding:0, lineHeight:1, fontSize:14 }}>×</button>
              )}
            </span>
          ))}
          {offices.length === 0 && <div style={{ fontSize:12, color:'var(--text-faint)' }}>No offices yet. Add one above.</div>}
        </div>
      </div>

      {/* Departments */}
      <div>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
          📂 Departments <span style={{ fontSize:11, color:'var(--text-faint)', fontWeight:400 }}>({departments.length})</span>
        </div>
        {!locked && (
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            <input className="form-control" placeholder="New department name..." value={newDept} onChange={e=>setNewDept(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleAddDept()} style={{ flex:2, minWidth:160 }}/>
            <select className="form-control" value={deptOffice} onChange={e=>setDeptOffice(e.target.value)} style={{ flex:1, minWidth:140 }}>
              <option value="">Link to office (optional)</option>
              {offices.map(o=><option key={o}>{o}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={handleAddDept} disabled={saving==='dept' || !newDept.trim()}>
              {saving==='dept' ? '...' : '+ Add Department'}
            </button>
          </div>
        )}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {departments.map(d => (
            <span key={d} style={{ display:'flex', alignItems:'center', gap:6, background:'#f0fdf4', color:'#166534', borderRadius:99, padding:'4px 12px', fontSize:12, fontWeight:600, border:'1px solid #86efac' }}>
              {d}
              {!locked && (
                <button onClick={()=>handleDeleteDept(d)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#10b981', padding:0, lineHeight:1, fontSize:14 }}>×</button>
              )}
            </span>
          ))}
          {departments.length === 0 && <div style={{ fontSize:12, color:'var(--text-faint)' }}>No departments yet. Add one above.</div>}
        </div>
      </div>

      <div style={{ fontSize:12, color:'var(--text-faint)', padding:'10px 14px', background:'var(--surface-2)', borderRadius:8 }}>
        💡 Offices and departments added here appear in the user registration form and user profiles.
        {locked && ' Only the Record Officer can manage offices and departments.'}
        {offices.length === 0 && !locked && ' ⚠ Restart the server first to enable database-backed offices.'}
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, isRecordOfficer, auditLog, allDeletedIncoming, allDeletedOutgoing, restoreIncoming, restoreOutgoing, offices, departments, addOffice, deleteOffice, addDepartment, deleteDepartment, refreshOffices, refreshDepartments } = useApp();
  const { lang, setLang, t } = useI18n();
  const isAdmin = isRecordOfficer;
  const [active, setActive] = useState('org');
  const [saved, setSaved] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState('');

  const SECTIONS = isRecordOfficer
    ? [...BASE_SECTIONS, { id:'audit', icon:Clock, label:'Audit Log', adminOnly:false }]
    : BASE_SECTIONS;

  // Settings state
  const [org, setOrg] = useState({ name:'Arba Minch University', shortName:'AMU', address:'Arba Minch, Ethiopia', phone:'+251 46 881 0000', email:'info@amu.edu.et', website:'www.amu.edu.et', logo:'' });
  const [letter, setLetter] = useState({ refPrefix:'AMU', autoRef:true, yearInRef:true, maxAttachMB:25, allowedTypes:'All', requireSubject:true, requireDept:true });
  const [workflow, setWorkflow] = useState({ statuses:['Registered','Forwarded','Under Review','Responded','Closed'], autoClose:false, autoCloseAfterDays:30 });
  const [files, setFiles] = useState({ maxSizeMB:25, allowAll:true, storageType:'Local', compressionEnabled:false });
  const [security, setSecurity] = useState({ minPasswordLen:6, requireUppercase:false, sessionTimeoutMin:480, twoFactor:false, loginAttempts:5 });
  const [notif, setNotif] = useState({ emailNotif:false, bellNotif:true, notifyOnReceive:true, notifyOnForward:true, notifyOnClose:false });
  const [backup, setBackup] = useState({ autoBackup:false, backupFreq:'Daily', lastBackup:'Never' });

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const section = SECTIONS.find(s => s.id === active);
  const locked = section?.adminOnly && !isAdmin;

  return (
    <div style={{ display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' }}>
      <style>{`@media(max-width:640px){.settings-wrap{flex-direction:column}.settings-nav{max-width:100% !important;width:100% !important}}`}</style>
      {/* Sidebar nav */}
      <div className="card settings-nav" style={{ width:'100%', maxWidth:240, flexShrink:0, overflow:'hidden' }}>
        <div style={{ padding:'16px 18px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#fff', display:'flex', alignItems:'center', gap:8 }}>⚙️ System Settings</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.75)', marginTop:3 }}>
            {isAdmin ? '🔑 Administrator access' : '👁 View-only for some sections'}
          </div>
        </div>
        <nav style={{ padding:'8px 0' }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)} style={{
              display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 16px',
              background:active===s.id?'rgba(99,102,241,.08)':'none', border:'none', cursor:'pointer',
              borderLeft:active===s.id?'3px solid #6366f1':'3px solid transparent',
              color:active===s.id?'#6366f1':'var(--text-muted)', fontSize:13, fontWeight:active===s.id?600:400,
              textAlign:'left', transition:'all .15s',
            }}>
              <s.icon size={15} style={{ flexShrink:0 }}/>
              <span style={{ flex:1 }}>{s.label}</span>
              {s.adminOnly && !isAdmin && <Lock size={11} style={{ opacity:.4 }}/>}
              {active===s.id && <ChevronRight size={13}/>}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        {locked && (
          <div style={{ background:'linear-gradient(135deg,#fef3c7,#fde68a)', border:'1px solid #fde68a', borderRadius:12, padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12, fontSize:13, color:'#92400e', boxShadow:'0 2px 8px rgba(245,158,11,.15)' }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><AlertTriangle size={16} color="#fff"/></div>
            <div><div style={{ fontWeight:700 }}>View Only</div><div style={{ fontSize:12, marginTop:1 }}>This section can only be edited by an Administrator.</div></div>
          </div>
        )}

        {saved && (
          <div style={{ background:'linear-gradient(135deg,#d1fae5,#a7f3d0)', border:'1px solid #a7f3d0', borderRadius:12, padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12, fontSize:13, color:'#065f46', boxShadow:'0 2px 8px rgba(16,185,129,.15)' }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'#10b981', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Check size={16} color="#fff"/></div>
            <div><div style={{ fontWeight:700 }}>Saved! ✨</div><div style={{ fontSize:12, marginTop:1 }}>Settings updated successfully.</div></div>
          </div>
        )}

        <div className="card">
          <div className="card-header" style={{ background:'linear-gradient(135deg,rgba(99,102,241,.06),rgba(139,92,246,.04))' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {section && <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}><section.icon size={18} color="#fff"/></div>}
              <div>
                <div style={{ fontSize:15, fontWeight:700 }}>{section?.label}</div>
                {locked && <div style={{ fontSize:11, color:'#f59e0b', marginTop:1 }}>👁 View only</div>}
              </div>
            </div>
            {!locked && (
              <button className="btn btn-primary btn-sm" onClick={save} style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none' }}><Save size={13}/> Save Changes</button>
            )}
          </div>

          <div className="card-body">

            {/* Organization Settings */}
            {active === 'org' && (
              <div>
                <Field label="University Name" desc="Full official name of the institution">
                  <input className="form-control" value={org.name} onChange={e=>setOrg(p=>({...p,name:e.target.value}))} disabled={locked} style={{ width:260 }}/>
                </Field>
                <Field label="Short Name / Abbreviation" desc="Used in reference numbers and headers">
                  <input className="form-control" value={org.shortName} onChange={e=>setOrg(p=>({...p,shortName:e.target.value}))} disabled={locked} style={{ width:120 }}/>
                </Field>
                <Field label="Address" desc="Physical address of the university">
                  <input className="form-control" value={org.address} onChange={e=>setOrg(p=>({...p,address:e.target.value}))} disabled={locked} style={{ width:260 }}/>
                </Field>
                <Field label="Phone Number">
                  <input className="form-control" value={org.phone} onChange={e=>setOrg(p=>({...p,phone:e.target.value}))} disabled={locked} style={{ width:200 }}/>
                </Field>
                <Field label="Official Email">
                  <input className="form-control" type="email" value={org.email} onChange={e=>setOrg(p=>({...p,email:e.target.value}))} disabled={locked} style={{ width:240 }}/>
                </Field>
                <Field label="Website">
                  <input className="form-control" value={org.website} onChange={e=>setOrg(p=>({...p,website:e.target.value}))} disabled={locked} style={{ width:240 }}/>
                </Field>
              </div>
            )}

            {/* Letter Configuration */}
            {active === 'letter' && (
              <div>
                <Field label="Reference Number Prefix" desc="Prefix used in all letter reference numbers (e.g. AMU → AMU-2026-001)">
                  <input className="form-control" value={letter.refPrefix} onChange={e=>setLetter(p=>({...p,refPrefix:e.target.value}))} disabled={locked} style={{ width:100 }}/>
                </Field>
                <Field label="Auto-generate Reference Numbers" desc="Automatically assign sequential reference numbers">
                  <Toggle value={letter.autoRef} onChange={v=>setLetter(p=>({...p,autoRef:v}))} disabled={locked}/>
                </Field>
                <Field label="Include Year in Reference" desc="e.g. AMU-2026-001 vs AMU-001">
                  <Toggle value={letter.yearInRef} onChange={v=>setLetter(p=>({...p,yearInRef:v}))} disabled={locked}/>
                </Field>
                <Field label="Max Attachment Size (MB)" desc="Maximum file size allowed for letter attachments">
                  <input className="form-control" type="number" value={letter.maxAttachMB} onChange={e=>setLetter(p=>({...p,maxAttachMB:+e.target.value}))} disabled={locked} style={{ width:80 }}/>
                </Field>
                <Field label="Require Subject" desc="Make subject field mandatory when registering letters">
                  <Toggle value={letter.requireSubject} onChange={v=>setLetter(p=>({...p,requireSubject:v}))} disabled={locked}/>
                </Field>
                <Field label="Require Department" desc="Make department field mandatory">
                  <Toggle value={letter.requireDept} onChange={v=>setLetter(p=>({...p,requireDept:v}))} disabled={locked}/>
                </Field>
              </div>
            )}

            {/* Status Workflow */}
            {active === 'workflow' && (
              <div>
                <Field label="Active Statuses" desc="Statuses available for incoming letters">
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {workflow.statuses.map(s => (
                      <span key={s} style={{ padding:'4px 12px', borderRadius:99, background:'#eef2ff', color:'#3730a3', fontSize:12, fontWeight:600 }}>{s}</span>
                    ))}
                  </div>
                </Field>
                <Field label="Auto-close Inactive Letters" desc="Automatically close letters with no activity">
                  <Toggle value={workflow.autoClose} onChange={v=>setWorkflow(p=>({...p,autoClose:v}))} disabled={locked}/>
                </Field>
                {workflow.autoClose && (
                  <Field label="Auto-close After (days)" desc="Number of days of inactivity before auto-closing">
                    <input className="form-control" type="number" value={workflow.autoCloseAfterDays} onChange={e=>setWorkflow(p=>({...p,autoCloseAfterDays:+e.target.value}))} disabled={locked} style={{ width:80 }}/>
                  </Field>
                )}
              </div>
            )}

            {/* File Management */}
            {active === 'files' && (
              <div>
                <Field label="Maximum File Size (MB)" desc="Maximum size per uploaded document">
                  <input className="form-control" type="number" value={files.maxSizeMB} onChange={e=>setFiles(p=>({...p,maxSizeMB:+e.target.value}))} disabled={locked} style={{ width:80 }}/>
                </Field>
                <Field label="Allow All File Types" desc="If disabled, only PDF, Word, Excel, and images are allowed">
                  <Toggle value={files.allowAll} onChange={v=>setFiles(p=>({...p,allowAll:v}))} disabled={locked}/>
                </Field>
                <Field label="Storage Type" desc="Where uploaded files are stored">
                  <select className="form-control" value={files.storageType} onChange={e=>setFiles(p=>({...p,storageType:e.target.value}))} disabled={locked} style={{ width:140 }}>
                    <option>Local</option><option>Cloud</option>
                  </select>
                </Field>
                <Field label="Enable Compression" desc="Compress files on upload to save storage space">
                  <Toggle value={files.compressionEnabled} onChange={v=>setFiles(p=>({...p,compressionEnabled:v}))} disabled={locked}/>
                </Field>
              </div>
            )}

            {/* Security Policy */}
            {active === 'security' && (
              <div>
                <Field label="Minimum Password Length" desc="Minimum number of characters required for passwords">
                  <input className="form-control" type="number" value={security.minPasswordLen} onChange={e=>setSecurity(p=>({...p,minPasswordLen:+e.target.value}))} disabled={locked} style={{ width:80 }}/>
                </Field>
                <Field label="Require Uppercase Letter" desc="Passwords must contain at least one uppercase letter">
                  <Toggle value={security.requireUppercase} onChange={v=>setSecurity(p=>({...p,requireUppercase:v}))} disabled={locked}/>
                </Field>
                <Field label="Session Timeout (minutes)" desc="Automatically log out after this period of inactivity">
                  <input className="form-control" type="number" value={security.sessionTimeoutMin} onChange={e=>setSecurity(p=>({...p,sessionTimeoutMin:+e.target.value}))} disabled={locked} style={{ width:100 }}/>
                </Field>
                <Field label="Max Login Attempts" desc="Lock account after this many failed login attempts">
                  <input className="form-control" type="number" value={security.loginAttempts} onChange={e=>setSecurity(p=>({...p,loginAttempts:+e.target.value}))} disabled={locked} style={{ width:80 }}/>
                </Field>
                <Field label="Two-Factor Authentication" desc="Require 2FA for all users (future feature)">
                  <Toggle value={security.twoFactor} onChange={v=>setSecurity(p=>({...p,twoFactor:v}))} disabled={locked}/>
                </Field>
              </div>
            )}

            {/* Notification Configuration */}
            {active === 'notif' && (
              <div>
                <Field label="Bell Notifications" desc="Show letter notification bell in the top bar">
                  <Toggle value={notif.bellNotif} onChange={v=>setNotif(p=>({...p,bellNotif:v}))} disabled={locked}/>
                </Field>
                <Field label="Chat Message Notifications" desc="Show unread message count badge on the Messages icon in the top bar">
                  <Toggle value={notif.chatNotif ?? true} onChange={v=>setNotif(p=>({...p,chatNotif:v}))}/>
                </Field>
                <Field label="Email Notifications" desc="Send email alerts for new letters (requires email server setup)">
                  <Toggle value={notif.emailNotif} onChange={v=>setNotif(p=>({...p,emailNotif:v}))} disabled={locked}/>
                </Field>
                <Field label="Notify on Letter Received" desc="Alert when a new letter arrives in your inbox">
                  <Toggle value={notif.notifyOnReceive} onChange={v=>setNotif(p=>({...p,notifyOnReceive:v}))}/>
                </Field>
                <Field label="Notify on Forward" desc="Alert when a letter is forwarded to your office">
                  <Toggle value={notif.notifyOnForward} onChange={v=>setNotif(p=>({...p,notifyOnForward:v}))}/>
                </Field>
                <Field label="Notify on Letter Closed" desc="Alert when a letter you sent is marked as closed">
                  <Toggle value={notif.notifyOnClose} onChange={v=>setNotif(p=>({...p,notifyOnClose:v}))}/>
                </Field>
              </div>
            )}

            {/* Language */}
            {active === 'language' && (
              <div>
                <Field label="Interface Language" desc="Choose the language for the system interface">
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {LANG_OPTIONS.filter(opt => !opt.adminOnly || isAdmin).map(opt => (
                      <button key={opt.code} onClick={() => setLang(opt.code)}
                        style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, border:`2px solid ${lang===opt.code?'#6366f1':'var(--border)'}`, background:lang===opt.code?'rgba(99,102,241,.08)':'var(--surface)', cursor:'pointer', transition:'all .15s', textAlign:'left' }}>
                        <span style={{ fontSize:22 }}>{opt.flag}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:lang===opt.code?'#6366f1':'var(--text)', display:'flex', alignItems:'center', gap:8 }}>
                            {opt.label}
                            {opt.adminOnly && <span style={{ fontSize:10, background:'#fef3c7', color:'#92400e', padding:'1px 6px', borderRadius:99, fontWeight:600 }}>Admin</span>}
                          </div>
                          {lang===opt.code && <div style={{ fontSize:11, color:'#6366f1' }}>✓ Currently active</div>}
                          {opt.adminOnly && lang!==opt.code && <div style={{ fontSize:10, color:'var(--text-faint)' }}>Partial translation — falls back to English</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                </Field>
                <div style={{ marginTop:16, padding:'12px 14px', background:'var(--surface-2)', borderRadius:8, fontSize:12, color:'var(--text-muted)' }}>
                  {isAdmin
                    ? 'As administrator, you can access all available languages. Languages marked "Admin" have partial translations.'
                    : 'Contact the Record Officer to enable additional languages for the system.'}
                </div>
              </div>
            )}

            {/* Backup & Maintenance */}
            {active === 'backup' && (
              <div>
                <Field label="Automatic Backup" desc="Automatically backup all letter data">
                  <Toggle value={backup.autoBackup} onChange={v=>setBackup(p=>({...p,autoBackup:v}))} disabled={locked}/>
                </Field>
                {backup.autoBackup && (
                  <Field label="Backup Frequency">
                    <select className="form-control" value={backup.backupFreq} onChange={e=>setBackup(p=>({...p,backupFreq:e.target.value}))} disabled={locked} style={{ width:140 }}>
                      <option>Daily</option><option>Weekly</option><option>Monthly</option>
                    </select>
                  </Field>
                )}
                <Field label="Last Backup" desc="When the last backup was performed">
                  <span style={{ fontSize:13, color:'var(--text-muted)' }}>{backup.lastBackup}</span>
                </Field>
                <Field label="Manual Backup" desc="Download a backup of all letter data now">
                  <button className="btn btn-outline btn-sm" disabled={locked} onClick={() => {
                    alert('Backup feature requires server-side implementation.');
                  }}>Download Backup</button>
                </Field>
                <Field label="Clear Cache" desc="Clear temporary files and cached data">
                  <button className="btn btn-ghost btn-sm" disabled={locked} onClick={() => { localStorage.removeItem('lms-notif-read'); alert('Cache cleared.'); }}>Clear Cache</button>
                </Field>
              </div>
            )}

            {/* System Information */}
            {active === 'sysinfo' && (
              <div>
                {[
                  ['System Name', 'Arba Minch University LMS'],
                  ['Version', 'v2.0.0'],
                  ['Build Date', 'April 2026'],
                  ['Framework', 'React 19 + Vite + Node.js + MongoDB'],
                  ['Backend', 'Express.js on localhost:5000'],
                  ['Database', 'MongoDB Atlas'],
                  ['Environment', 'Development'],
                  ['Support', 'record@amu.edu.et'],
                ].map(([k, v]) => (
                  <Field key={k} label={k}>
                    <span style={{ fontSize:13, color:'var(--text-muted)', fontFamily:'monospace' }}>{v}</span>
                  </Field>
                ))}
              </div>
            )}

            {/* Offices & Departments — Record Officer only */}
            {active === 'offices' && (
              <OfficeDeptManager
                offices={offices} departments={departments}
                addOffice={addOffice} deleteOffice={deleteOffice}
                addDepartment={addDepartment} deleteDepartment={deleteDepartment}
                refreshOffices={refreshOffices} refreshDepartments={refreshDepartments}
                locked={locked}
              />
            )}

            {/* Audit Log — Record Officer only */}
            {active === 'audit' && (
              <div>
                {auditLog.length === 0 ? (
                  <div style={{ padding:'20px 0', color:'var(--text-muted)', fontSize:13 }}>No audit entries yet.</div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead>
                        <tr style={{ color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>
                          {['Action','Reference','Type','By','Office','Date Added',''].map(h => (
                            <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {auditLog.map((entry, i) => {
                          const isDeleted = entry.action === 'deleted';
                          const deletedItem = isDeleted
                            ? (entry.type === 'incoming'
                                ? allDeletedIncoming?.find(l => l.refNo === entry.refNo)
                                : allDeletedOutgoing?.find(l => l.refNo === entry.refNo))
                            : null;
                          return (
                            <tr key={entry._id || entry.id || i}
                              style={{ borderBottom:'1px solid var(--border)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg, rgba(99,102,241,.05))'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={{ padding:'9px 12px' }}>
                                <span style={{ fontWeight:600, color: isDeleted?'#ef4444':entry.action==='restored'?'#22c55e':'#f97316' }}>
                                  {entry.action}
                                </span>
                              </td>
                              <td style={{ padding:'9px 12px', fontFamily:'monospace' }}>{entry.refNo}</td>
                              <td style={{ padding:'9px 12px' }}>{entry.type}</td>
                              <td style={{ padding:'9px 12px' }}>{entry.by}</td>
                              <td style={{ padding:'9px 12px' }}>{entry.office}</td>
                              <td style={{ padding:'9px 12px' }}>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}</td>
                              <td style={{ padding:'9px 12px' }}>
                                <button
                                  onClick={() => { setRestoreMsg(''); setSelectedEntry({ entry, deletedItem }); }}
                                  style={{ background:'none', border:'none', cursor:'pointer', padding:4, borderRadius:6, color:'#6366f1', display:'flex', alignItems:'center' }}
                                  title="View details"
                                >
                                  <Eye size={14}/>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Detail / Restore Modal */}
                {selectedEntry && createPortal(
                  <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center' }}
                    onClick={() => { setSelectedEntry(null); setRestoreMsg(''); }}>
                    <div style={{ background:'var(--surface, #fff)', borderRadius:14, padding:28, width:480, maxWidth:'95vw', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}
                      onClick={e => e.stopPropagation()}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                        <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>Audit Entry Detail</div>
                        <button onClick={() => { setSelectedEntry(null); setRestoreMsg(''); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
                          <X size={18}/>
                        </button>
                      </div>

                      {/* Entry fields */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 20px', marginBottom:20 }}>
                        {[
                          ['Action',     selectedEntry.entry.action],
                          ['Reference',  selectedEntry.entry.refNo],
                          ['Type',       selectedEntry.entry.type],
                          ['By',         selectedEntry.entry.by],
                          ['Office',     selectedEntry.entry.office],
                          ['Date Added', selectedEntry.entry.createdAt ? new Date(selectedEntry.entry.createdAt).toLocaleString() : '—'],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>{k}</div>
                            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', fontFamily: k==='Reference'?'monospace':undefined }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* Restore option */}
                      {selectedEntry.entry.action === 'deleted' && (
                        <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
                          {selectedEntry.deletedItem ? (
                            <>
                              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
                                This item is still in the recycle bin and can be recovered.
                              </div>
                              {restoreMsg ? (
                                <div style={{ fontSize:13, color:'#22c55e', fontWeight:600 }}>{restoreMsg}</div>
                              ) : (
                                <button
                                  disabled={restoring}
                                  onClick={async () => {
                                    setRestoring(true);
                                    try {
                                      if (selectedEntry.entry.type === 'incoming') await restoreIncoming(selectedEntry.deletedItem.id);
                                      else await restoreOutgoing(selectedEntry.deletedItem.id);
                                      setRestoreMsg('✓ Item restored successfully.');
                                      setSelectedEntry(prev => ({ ...prev, deletedItem: null }));
                                    } finally { setRestoring(false); }
                                  }}
                                  style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:8, border:'none', cursor:'pointer', background:'#6366f1', color:'#fff', fontSize:13, fontWeight:600 }}
                                >
                                  <RotateCcw size={14}/> {restoring ? 'Restoring…' : 'Restore Item'}
                                </button>
                              )}
                            </>
                          ) : (
                            <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                              {restoreMsg || 'This item has already been restored or permanently deleted.'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
