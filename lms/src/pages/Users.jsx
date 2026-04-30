import { useState } from 'react';
import { Plus, Edit2, Trash2, X, User, Shield, Search, KeyRound, CheckCircle, UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApp, ROLES, OFFICES } from '../context/AppContext';
import { useI18n } from '../i18n/index.jsx';
import { api } from '../lib/api';

const roleColor = {
  'Administrator':'badge-danger','Registrar':'badge-info','Finance Officer':'badge-success',
  'Record Officer':'badge-primary','Academic Staff':'badge-warning','Management':'badge-purple','Staff':'badge-gray',
};

const emptyForm = { username:'', password:'', name:'', email:'', role:'Staff', office:'', avatar:'' };

export default function Users() {
  const { users, addUser, updateUser, deleteUser, user: me, canManageUsers, isAdmin, myOffice, offices, departments } = useApp();
  const { t } = useI18n();
  const isAdminUser = me?.role === 'Administrative Staff';

  // non-admins always add users to their own office
  const fixedOffice = !isAdminUser ? myOffice : null;
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPw, setResetPw] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetDone, setResetDone] = useState(false);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.office.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setForm({ ...emptyForm, office: fixedOffice || '' });
    setEditUser(null); setErrors({}); setShowModal(true);
  };
  const openEdit = (u) => { setForm({ ...u, password: '' }); setEditUser(u); setErrors({}); setShowModal(true); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.username.trim()) e.username = 'Username is required';
    if (!editUser && !form.password.trim()) e.password = 'Password is required';
    if (!form.role) e.role = 'Role is required';
    const officeVal = fixedOffice && !editUser ? fixedOffice : form.office;
    if (!officeVal) e.office = 'Office is required';
    const dup = users.find(u => u.username === form.username.trim() && u.id !== editUser?.id);
    if (dup) e.username = 'Username already taken';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const initials = form.avatar.trim() || form.name.trim().split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    const officeVal = fixedOffice && !editUser ? fixedOffice : form.office;
    const data = { ...form, office: officeVal, avatar: initials, username: form.username.trim() };
    if (!data.password) delete data.password;
    if (editUser) updateUser(editUser.id, data);
    else addUser({ ...data, _invitedBy: me?.name, _invitedByOffice: myOffice });
    setShowModal(false);
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openReset = (u) => {
    setResetTarget(u);
    setResetPw('');
    setResetError('');
    setResetDone(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetError('');
    try {
      const data = await api.resetUserPassword(resetTarget.id);
      setResetPw(data.password);
      setResetDone(true);
    } catch (err) {
      setResetError(err.message || 'Reset failed.');
    }
  };

  const canReset = me?.role === 'Record Officer' || me?.role === 'admin' || me?.canResetPassword;

  if (!canManageUsers) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, color:'var(--text-faint)' }}>
        <Shield size={40} style={{ marginBottom:12, opacity:.3 }} />
        <div style={{ fontSize:15, fontWeight:600 }}>Access Restricted</div>
        <div style={{ fontSize:13, marginTop:6 }}>You don't have permission to manage users.</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700 }}>{t('user_management')}</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>{users.length} users registered</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> {t('add_user')}</button>
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ padding:'14px 20px', display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-faint)' }}/>
            <input className="form-control" placeholder={t('search_staff')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:32 }}/>
          </div>
          {search && <button className="btn btn-ghost btn-sm" onClick={()=>setSearch('')}><X size={14}/> Clear</button>}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>{t('username')}</th><th>{t('email')}</th><th>{t('user_role')}</th><th>{t('user_group')}</th><th>Added By</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-faint)' }}>{t('no_users_found')}</td></tr>
                : filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#1e40af,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
                          {u.avatar}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{u.name}</div>
                          {u.id === me?.id && <div style={{ fontSize:10, color:'#6366f1', fontWeight:600 }}>You</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily:'monospace', fontSize:12, color:'var(--text-muted)' }}>{u.username}</td>
                    <td style={{ fontSize:12, color:'var(--text-muted)' }}>{u.email || '—'}</td>
                    <td><span className={`badge ${roleColor[u.role]||'badge-gray'}`}>{u.role}</span></td>
                    <td style={{ fontSize:12 }}>{u.office}</td>
                    <td>
                      {u._invitedBy
                        ? <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <UserPlus size={12} color="#6366f1"/>
                            <div>
                              <div style={{ fontSize:11, fontWeight:600, color:'#3730a3' }}>{u._invitedBy}</div>
                              <div style={{ fontSize:10, color:'var(--text-faint)' }}>{u._invitedByOffice}</div>
                            </div>
                          </div>
                        : <span style={{ fontSize:11, color:'var(--text-faint)' }}>System</span>}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={()=>openEdit(u)}><Edit2 size={14}/></button>
                        {canReset && (
                          <button className="btn btn-ghost btn-icon btn-sm" title="Reset Password" style={{ color:'#f59e0b' }}
                            onClick={()=>openReset(u)}>
                            <KeyRound size={14}/>
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title={u.canResetPassword ? 'Revoke reset permission' : 'Grant reset permission'}
                            style={{ color: u.canResetPassword ? '#6366f1' : 'var(--text-faint)' }}
                            onClick={() => updateUser(u.id, { canResetPassword: !u.canResetPassword })}>
                            {u.canResetPassword ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
                          </button>
                        )}
                        {u.id !== me?.id && (
                          <button className="btn btn-ghost btn-icon btn-sm" title="Delete" style={{ color:'#ef4444' }}
                            onClick={()=>{ if(window.confirm(`Delete user "${u.name}"?`)) deleteUser(u.id); }}>
                            <Trash2 size={14}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', color:'var(--text-faint)', fontSize:12 }}>
          Showing {filtered.length} of {users.length} users
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setResetTarget(null)}>
          <div className="modal">
            <div className="modal-header">
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <KeyRound size={18} color="#f59e0b" />
                </div>
                <div>
                  <h2 style={{ fontSize:16, fontWeight:700 }}>{t('reset_password')}</h2>
                  <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>
                    Setting new password for <strong>{resetTarget.name}</strong> ({resetTarget.username})
                  </p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setResetTarget(null)}><X size={18}/></button>
            </div>
            {resetDone ? (
              <div className="modal-body" style={{ textAlign:'center', padding:'40px 24px' }}>
                <CheckCircle size={48} style={{ margin:'0 auto 16px', display:'block', color:'#10b981' }} />
                <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>Password Reset Successfully</div>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>
                  New temporary password for <strong>{resetTarget.name}</strong>. Share it securely — they will be prompted to change it on next login.
                </div>
                <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'14px 20px', fontSize:20, fontWeight:800, color:'#065f46', letterSpacing:4, fontFamily:'monospace' }}>
                  {resetPw}
                </div>
                <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:8 }}>
                  User must change this password on next login.
                </div>
                <div className="modal-footer" style={{ justifyContent:'center', marginTop:20 }}>
                  <button className="btn btn-primary" onClick={() => setResetTarget(null)}>Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReset}>
                <div className="modal-body">
                  <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400e', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                    <KeyRound size={14}/> A random password will be generated for <strong style={{ marginLeft:4 }}>{resetTarget.name}</strong>. They will be required to change it on next login.
                  </div>
                  {resetError && (
                    <div style={{ background:'#fee2e2', color:'#991b1b', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16, border:'1px solid #fecaca' }}>{resetError}</div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setResetTarget(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ background:'#f59e0b', borderColor:'#f59e0b' }}>
                    <KeyRound size={14}/> Generate & Reset Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 style={{ fontSize:17, fontWeight:700 }}>{editUser ? t('edit_user') : t('add_user_title')}</h2>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-2" style={{ gap:16 }}>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label className="form-label">{t('full_name')} *</label>
                    <input className="form-control" value={form.name} onChange={e=>f('name',e.target.value)} placeholder="e.g. Dr. James Wani"/>
                    {errors.name && <div style={{ fontSize:11, color:'#ef4444', marginTop:3 }}>{errors.name}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('username')} *</label>
                    <input className="form-control" value={form.username} onChange={e=>f('username',e.target.value)} placeholder="e.g. james.wani"/>
                    {errors.username && <div style={{ fontSize:11, color:'#ef4444', marginTop:3 }}>{errors.username}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">{editUser ? 'New Password (leave blank to keep)' : `${t('password')} *`}</label>
                    <input className="form-control" type="password" value={form.password} onChange={e=>f('password',e.target.value)} placeholder="••••••••"/>
                    {errors.password && <div style={{ fontSize:11, color:'#ef4444', marginTop:3 }}>{errors.password}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('email')}</label>
                    <input className="form-control" type="email" value={form.email} onChange={e=>f('email',e.target.value)} placeholder="name@university.edu"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Avatar Initials</label>
                    <input className="form-control" value={form.avatar} onChange={e=>f('avatar',e.target.value.toUpperCase().slice(0,2))} placeholder="e.g. JW (auto if blank)" maxLength={2}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('user_role')} *</label>
                    <select className="form-control" value={form.role} onChange={e=>f('role',e.target.value)}>
                      {ROLES.map(r=><option key={r}>{r}</option>)}
                    </select>
                    {errors.role && <div style={{ fontSize:11, color:'#ef4444', marginTop:3 }}>{errors.role}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('user_group')} *</label>
                    {fixedOffice && !editUser ? (
                      <div style={{
                        padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 6,
                        fontSize: 13, background: 'var(--surface-2)', color: 'var(--text)',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <Shield size={13} color="#6366f1" />
                        <span style={{ fontWeight: 600 }}>{fixedOffice}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 'auto' }}>Your office</span>
                      </div>
                    ) : (
                      <select className="form-control" value={form.office} onChange={e=>f('office',e.target.value)}>
                        <option value="">Select office</option>
                        {offices.map(o=><option key={o}>{o}</option>)}
                      </select>
                    )}
                    {errors.office && <div style={{ fontSize:11, color:'#ef4444', marginTop:3 }}>{errors.office}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department <span style={{ color:'var(--text-faint)', fontWeight:400 }}>(optional)</span></label>
                    <select className="form-control" value={form.department||''} onChange={e=>f('department',e.target.value)}>
                      <option value="">Select department</option>
                      {departments.map(d=><option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setShowModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{editUser ? t('save') : t('add_user')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
