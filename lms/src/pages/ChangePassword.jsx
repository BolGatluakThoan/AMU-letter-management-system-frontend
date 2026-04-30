import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';

export default function ChangePassword() {
  const { logout } = useApp();
  const navigate = useNavigate();
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPw.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.changePassword(newPw);
      // Update session so mustChangePassword is cleared
      const raw = localStorage.getItem('lms-session');
      if (raw) {
        const s = JSON.parse(raw);
        s.mustChangePassword = false;
        localStorage.setItem('lms-session', JSON.stringify(s));
      }
      setDone(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid var(--border)', fontSize: 14,
    background: 'var(--surface-2)', color: 'var(--text)',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: 420, maxWidth: '100%', background: 'var(--surface)', borderRadius: 18, padding: 36, boxShadow: '0 8px 40px rgba(0,0,0,.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Change Password</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>You must set a new password before continuing</div>
          </div>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: 16, fontWeight: 700 }}>Password updated!</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Redirecting to dashboard...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>{error}</div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 40 }}
                  autoFocus placeholder="Min. 6 characters" value={newPw} onChange={e => setNewPw(e.target.value)} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Confirm Password</label>
              <input type={showPw ? 'text' : 'password'} style={inputStyle}
                placeholder="Repeat new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} style={{
              padding: '12px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {loading ? 'Saving...' : <><CheckCircle size={15} /> Set New Password</>}
            </button>
            <button type="button" onClick={logout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 12, textAlign: 'center' }}>
              Sign out instead
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
