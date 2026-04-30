import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight, KeyRound, Phone, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import bg1 from '../assets/bg1.jpg';
import bg2 from '../assets/bg2.jpg';
import bg3 from '../assets/bg3.jpg';
import bg4 from '../assets/bg4.jpg';
import bg5 from '../assets/bg5.jpg';
import bg6 from '../assets/bg6.jpg';

const BG_IMAGES = [bg1, bg2, bg3, bg4, bg5, bg6];

// ── Forgot Password Modal ─────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState(1); // 1=username, 2=otp, 3=new password, 4=done
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [otpInfo, setOtpInfo] = useState(null); // { maskedEmail, maskedPhone, otp, name }
  const [resetToken, setResetToken] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const inputStyle = {
    width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid var(--border)',
    fontSize:14, background:'var(--surface-2)', color:'var(--text)', outline:'none', boxSizing:'border-box',
  };

  const step1 = async () => {
    if (!username.trim()) { setErr('Enter your username.'); return; }
    setLoading(true); setErr('');
    try {
      const data = await api.forgotPassword(username.trim());
      setOtpInfo(data);
      setStep(2);    } catch (e) { setErr(e.message || 'Username not found.'); }
    finally { setLoading(false); }
  };

  const step2 = async () => {
    if (otp.length !== 6) { setErr('Enter the 6-digit code.'); return; }
    setLoading(true); setErr('');
    try {
      const data = await api.verifyOtp(username.trim(), otp.trim());
      setResetToken(data.resetToken);
      setStep(3);
    } catch (e) { setErr(e.message || 'Invalid or expired code.'); }
    finally { setLoading(false); }
  };

  const step3 = async () => {
    if (newPw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setErr('Passwords do not match.'); return; }
    setLoading(true); setErr('');
    try {
      await api.resetPassword(resetToken, newPw);
      setStep(4);
    } catch (e) { setErr(e.message || 'Reset failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:3000, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', borderRadius:18, padding:32, width:420, maxWidth:'100%', boxShadow:'0 24px 64px rgba(0,0,0,.3)', position:'relative' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <KeyRound size={20} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize:17, fontWeight:800 }}>Reset Password</div>
            <div style={{ fontSize:12, color:'var(--text-faint)' }}>
              {step===1&&<span>For <strong>Record Officer</strong> accounts only</span>}
              {step===2&&'Enter the verification code'}
              {step===3&&'Set your new password'}
              {step===4&&'Password reset complete'}
            </div>
          </div>
        </div>

        {/* Step indicator */}
        {step < 4 && (
          <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:24 }}>
            {[1,2,3].map((s,i) => (
              <div key={s} style={{ display:'flex', alignItems:'center', flex: i<2 ? 1 : 'none' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700,
                  background: step>s ? '#10b981' : step===s ? '#6366f1' : 'var(--surface-2)',
                  color: step>=s ? '#fff' : 'var(--text-faint)', border: step<s ? '2px solid var(--border)' : 'none' }}>
                  {step>s ? '✓' : s}
                </div>
                {i<2 && <div style={{ flex:1, height:2, background: step>s ? '#10b981' : 'var(--border)', margin:'0 6px' }}/>}
              </div>
            ))}
          </div>
        )}

        {err && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 }}>{err}</div>}

        {/* Step 1 — username */}
        {step===1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#1e40af', display:'flex', alignItems:'flex-start', gap:8 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>🔐</span>
              <span>This reset flow is restricted to the <strong>Record Officer (System Admin)</strong> account. Other users should contact the Record Office to have their password reset.</span>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Username</label>
              <input style={inputStyle} autoFocus placeholder="Your login username" value={username}
                onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==='Enter'&&step1()}/>
            </div>
            <button onClick={step1} disabled={loading} style={{ padding:'12px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {loading ? <><RefreshCw size={14} style={{ animation:'spin .7s linear infinite' }}/> Checking...</> : <><ArrowRight size={14}/> Send Code</>}
            </button>
          </div>
        )}

        {/* Step 2 — OTP */}
        {step===2 && otpInfo && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Contact info */}
            <div style={{ background:'var(--surface-2)', borderRadius:10, padding:'14px 16px', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Hi, {otpInfo.name}</div>
              {otpInfo.maskedEmail && (
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>
                  <Mail size={13} color="#6366f1"/> Email: <span style={{ fontWeight:600 }}>{otpInfo.maskedEmail}</span>
                </div>
              )}
              {otpInfo.maskedPhone && (
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text-muted)' }}>
                  <Phone size={13} color="#10b981"/> Phone: <span style={{ fontWeight:600 }}>{otpInfo.maskedPhone}</span>
                </div>
              )}
              {/* Show OTP directly for local/offline systems */}
              <div style={{ marginTop:12, padding:'10px 14px', borderRadius:8, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', textAlign:'center' }}>
                {otpInfo.offlineMode ? (
                  <>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.7)', marginBottom:4 }}>Your verification code</div>
                    <div style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:8, fontFamily:'monospace' }}>{otpInfo.otp}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,.6)', marginTop:4 }}>Valid for 15 minutes</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,.85)', marginBottom:4 }}>✉️ Code sent to your email</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,.6)' }}>Check your inbox — valid for 15 minutes</div>
                  </>
                )}
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Enter 6-digit code</label>
              <input style={{ ...inputStyle, textAlign:'center', fontSize:22, fontWeight:800, letterSpacing:10, fontFamily:'monospace' }}
                maxLength={6} placeholder="000000" value={otp}
                onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} onKeyDown={e=>e.key==='Enter'&&step2()}/>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{setStep(1);setErr('');setOtp('');}} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid var(--border)', cursor:'pointer', background:'none', color:'var(--text-muted)', fontWeight:600, fontSize:13 }}>← Back</button>
              <button onClick={step2} disabled={loading||otp.length!==6} style={{ flex:2, padding:'11px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:otp.length!==6?0.6:1 }}>
                {loading ? <><RefreshCw size={14} style={{ animation:'spin .7s linear infinite' }}/> Verifying...</> : <><ArrowRight size={14}/> Verify Code</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — new password */}
        {step===3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:6 }}>New Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPw?'text':'password'} style={{ ...inputStyle, paddingRight:40 }} autoFocus
                  placeholder="Min. 6 characters" value={newPw} onChange={e=>setNewPw(e.target.value)}/>
                <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-faint)' }}>
                  {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Confirm Password</label>
              <input type={showPw?'text':'password'} style={inputStyle} placeholder="Repeat new password"
                value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&step3()}/>
            </div>
            <button onClick={step3} disabled={loading} style={{ padding:'12px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {loading ? <><RefreshCw size={14} style={{ animation:'spin .7s linear infinite' }}/> Saving...</> : <><CheckCircle size={14}/> Reset Password</>}
            </button>
          </div>
        )}

        {/* Step 4 — done */}
        {step===4 && (
          <div style={{ textAlign:'center', padding:'10px 0 6px' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <CheckCircle size={32} color="#fff"/>
            </div>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Password Reset!</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>Your password has been updated. You can now sign in with your new password.</div>
            <button onClick={onClose} style={{ padding:'12px 32px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:700, fontSize:14 }}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useApp();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bgIdx, setBgIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // Auto-rotate background every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setBgIdx(i => (i + 1) % BG_IMAGES.length);
        setFading(false);
      }, 600);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const validImages = BG_IMAGES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim()) { setError('Please enter your username.'); return; }
    if (!form.password)        { setError('Please enter your password.'); return; }
    setLoading(true);
    try {
      const result = await login(form.username.trim(), form.password);
      const ok = result?.ok ?? result; // support both old bool and new object
      if (!ok) setError('Incorrect username or password. Please try again.');
      // mustChangePassword redirect is handled by App.jsx routing
    } catch {
      setError('Unable to connect to server. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u) => {
    setForm({ username: u.username, password: u.password });
    setError('');
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

      {/* Background image with crossfade */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `url(${validImages[bgIdx % validImages.length] || BG_IMAGES[0]})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}/>

      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(135deg, rgba(15,23,42,.4) 0%, rgba(30,64,175,.3) 100%)' }}/>

      {/* Dot indicators */}
      <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
        {validImages.map((_, i) => (
          <button key={i} onClick={() => { setFading(true); setTimeout(() => { setBgIdx(i); setFading(false); }, 300); }}
            style={{ width: i === bgIdx % validImages.length ? 24 : 8, height: 8, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0,
              background: i === bgIdx % validImages.length ? '#fff' : 'rgba(255,255,255,.4)', transition: 'all .3s' }}/>
        ))}
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>

        {/* Centered login card */}
        <div style={{
          width: 400, minWidth: 320,
          background: 'rgba(0,0,0,.18)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,.18)',
          borderRadius: 24,
          padding: 36,
          boxShadow: '0 8px 32px rgba(0,0,0,.18)',
          animation: 'slideUp .4s ease',
        }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Lock size={18} color="#fff"/>
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, opacity: .65, textTransform: 'uppercase', color: '#fff' }}>Arba Minch University</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Letter Management System</div>
              </div>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Welcome Back</h2>
            <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 13 }}>Sign in to access your office dashboard</p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,.2)', color: '#fecaca', borderRadius: 10,
              padding: '12px 16px', fontSize: 13, marginBottom: 20,
              border: '1px solid rgba(239,68,68,.4)',
              display: 'flex', alignItems: 'center', gap: 10,
              animation: 'slideUp .2s ease',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <span style={{ fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>            {/* Username */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.8)', display: 'block', marginBottom: 6 }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.5)' }}/>
                <input
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  autoFocus
                  style={{
                    width: '100%', padding: '12px 14px 12px 38px',
                    background: 'rgba(0,0,0,.25)', border: '1.5px solid rgba(255,255,255,.3)',
                    borderRadius: 10, fontSize: 14, color: '#fff', outline: 'none',
                    boxSizing: 'border-box', transition: 'border .2s, background .2s',
                    caretColor: '#a5b4fc',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,.7)'; e.target.style.background = 'rgba(0,0,0,.35)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,.3)'; e.target.style.background = 'rgba(0,0,0,.25)'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.8)', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.5)' }}/>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{
                    width: '100%', padding: '12px 40px 12px 38px',
                    background: 'rgba(0,0,0,.25)', border: '1.5px solid rgba(255,255,255,.3)',
                    borderRadius: 10, fontSize: 14, color: '#fff', outline: 'none',
                    boxSizing: 'border-box', transition: 'border .2s, background .2s',
                    caretColor: '#a5b4fc',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,.7)'; e.target.style.background = 'rgba(0,0,0,.35)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,.3)'; e.target.style.background = 'rgba(0,0,0,.25)'; }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.5)', padding: 4,
                }}>
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{              padding: '13px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(255,255,255,.2)' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
              color: '#fff', fontSize: 14, fontWeight: 700, marginTop: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,.5)',
              transition: 'all .2s',
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              {loading
                ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }}/> Signing in...</>
                : <><ArrowRight size={16}/> Sign In</>}
            </button>

            {/* Forgot password — admin/record officer only */}
            <button type="button" onClick={() => setShowForgot(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,.5)', fontSize: 11, textAlign: 'center',
              padding: '4px 0', transition: 'color .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.8)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}>
              🔐 Forgot password? <span style={{ textDecoration:'underline' }}>Record Officer only</span>
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.15)', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.4)' }}>
            Arba Minch University · Letter Management System
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder { color: rgba(255,255,255,.55) !important; font-size: 13px; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px rgba(0,0,0,.35) inset !important; -webkit-text-fill-color: #fff !important; }
      `}</style>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}
