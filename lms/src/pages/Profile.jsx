import { useState, useRef } from 'react';
import { Save, Eye, EyeOff, User, Mail, Lock, Camera, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/index.jsx';

function AvatarDisplay({ user, size = 72, fontSize = 24 }) {
  if (user?.avatarPhoto) {
    return (
      <img
        src={user.avatarPhoto}
        alt={user.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#1e40af,#3b82f6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 800, color: '#fff', flexShrink: 0,
    }}>
      {user?.avatar || '?'}
    </div>
  );
}

export default function Profile() {
  const { user, updateProfile, allUsers } = useApp();
  const { t } = useI18n();
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', avatar: user?.avatar || '' });
  const [photoPreview, setPhotoPreview] = useState(user?.avatarPhoto || null);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [saved, setSaved] = useState('');
  const [pwError, setPwError] = useState('');
  const [avatarMode, setAvatarMode] = useState(user?.avatarPhoto ? 'photo' : 'initials');
  const photoRef = useRef();

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Photo must be under 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      setAvatarMode('photo');
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setAvatarMode('initials');
    if (photoRef.current) photoRef.current.value = '';
  };

  const saveInfo = (e) => {
    e.preventDefault();
    const initials = form.avatar.trim() || form.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    updateProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      avatar: initials,
      avatarPhoto: avatarMode === 'photo' ? photoPreview : null,
    });
    setSaved('Profile updated successfully.');
    setTimeout(() => setSaved(''), 3000);
  };

  const savePassword = (e) => {
    e.preventDefault();
    setPwError('');
    const me = allUsers.find(u => u.id === user.id);
    if (!me || me.password !== pwForm.current) { setPwError('Current password is incorrect.'); return; }
    if (pwForm.newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
    updateProfile({ password: pwForm.newPw });
    setPwForm({ current: '', newPw: '', confirm: '' });
    setSaved('Password changed successfully.');
    setTimeout(() => setSaved(''), 3000);
  };

  // Live preview user object
  const previewUser = {
    ...user,
    name: form.name || user?.name,
    avatar: form.avatar.trim() || (form.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)) || user?.avatar,
    avatarPhoto: avatarMode === 'photo' ? photoPreview : null,
  };

  const tabStyle = (t) => ({
    padding: '9px 18px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent',
    color: tab === t ? '#6366f1' : 'var(--text-muted)',
    background: 'none', transition: 'all .15s',
  });

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t('my_profile')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>Manage your account details and password</p>
      </div>

      {/* Profile card with live preview */}
      <div className="card" style={{ marginBottom: 20, padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <AvatarDisplay user={previewUser} size={80} fontSize={26} />
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            title="Upload photo"
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: '50%',
              background: '#6366f1', border: '2px solid var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <Camera size={13} />
          </button>
          <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{previewUser.name}</div>
          <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, marginTop: 2 }}>{user?.role}</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 1 }}>{user?.office}</div>
          {user?.email && <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 1 }}>{user?.email}</div>}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 8px' }}>
          <button style={tabStyle('info')} onClick={() => setTab('info')}>
            <User size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />{t('personal_info')}
          </button>
          <button style={tabStyle('password')} onClick={() => setTab('password')}>
            <Lock size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />{t('change_password')}
          </button>
        </div>

        {saved && (
          <div style={{ margin: '16px 24px 0', background: '#d1fae5', color: '#065f46', borderRadius: 8, padding: '10px 14px', fontSize: 13, border: '1px solid #a7f3d0' }}>
            {saved}
          </div>
        )}

        {tab === 'info' && (
          <form onSubmit={saveInfo}>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" value={form.name} onChange={e => f('name', e.target.value)} required placeholder="Your full name" />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                    <input className="form-control" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="name@university.edu" style={{ paddingLeft: 34 }} />
                  </div>
                </div>

                {/* Avatar section */}
                <div className="form-group">
                  <label className="form-label">Profile Picture</label>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <button type="button" onClick={() => setAvatarMode('initials')} style={{
                      padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      background: avatarMode === 'initials' ? '#6366f1' : 'var(--surface-2)',
                      color: avatarMode === 'initials' ? '#fff' : 'var(--text-muted)',
                      border: avatarMode === 'initials' ? 'none' : '1.5px solid var(--border)',
                    }}>
                      Use Initials
                    </button>
                    <button type="button" onClick={() => photoRef.current?.click()} style={{
                      padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      background: avatarMode === 'photo' ? '#6366f1' : 'var(--surface-2)',
                      color: avatarMode === 'photo' ? '#fff' : 'var(--text-muted)',
                      border: avatarMode === 'photo' ? 'none' : '1.5px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <Camera size={14} /> Upload Photo
                    </button>
                    <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                  </div>

                  {avatarMode === 'initials' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <AvatarDisplay user={previewUser} size={48} fontSize={16} />
                      <div style={{ flex: 1 }}>
                        <input
                          className="form-control"
                          value={form.avatar}
                          onChange={e => f('avatar', e.target.value.toUpperCase().slice(0, 2))}
                          placeholder="e.g. JW"
                          maxLength={2}
                          style={{ width: 80 }}
                        />
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
                          2 letters · leave blank to auto-generate from name
                        </div>
                      </div>
                    </div>
                  )}

                  {avatarMode === 'photo' && photoPreview && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={photoPreview} alt="preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Photo uploaded</div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>JPG, PNG, GIF · Max 5 MB</div>
                        <button type="button" onClick={removePhoto} style={{ marginTop: 6, fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <X size={12} /> Remove photo
                        </button>
                      </div>
                    </div>
                  )}

                  {avatarMode === 'photo' && !photoPreview && (
                    <div
                      onClick={() => photoRef.current?.click()}
                      style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer', background: 'var(--surface-2)' }}>
                      <Camera size={24} style={{ margin: '0 auto 8px', color: 'var(--text-faint)', display: 'block' }} />
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Click to upload photo</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>JPG, PNG, GIF · Max 5 MB</div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input className="form-control" value={user?.role} disabled style={{ background: 'var(--surface-2)', color: 'var(--text-faint)', cursor: 'not-allowed' }} />
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Role can only be changed by an administrator</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Office</label>
                  <input className="form-control" value={user?.office} disabled style={{ background: 'var(--surface-2)', color: 'var(--text-faint)', cursor: 'not-allowed' }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary"><Save size={14} /> {t('save')}</button>
            </div>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={savePassword}>
            <div className="modal-body">
              {pwError && <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16, border: '1px solid #fecaca' }}>{pwError}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[['current', t('current_password')], ['newPw', t('new_password')], ['confirm', t('confirm_password')]].map(([key, label]) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label} *</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                      <input className="form-control" type={showPw[key] ? 'text' : 'password'} value={pwForm[key]} onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))} required style={{ paddingLeft: 34, paddingRight: 40 }} />
                      <button type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4 }}>
                        {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary"><Lock size={14} /> {t('change_password')}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
