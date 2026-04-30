import { useRef, useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import useScrollReveal from '../hooks/useScrollReveal';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  // push-and-reveal: 'idle' | 'exit' | 'enter'
  const [phase, setPhase] = useState('idle');
  const mainRef = useRef(null);
  const location = useLocation();
  const sw = collapsed ? 68 : 256;

  useScrollReveal(mainRef);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    // schedule state updates asynchronously to avoid synchronous setState in effect
    const timers = [];
    const t0 = setTimeout(() => {
      setMobileOpen(false);
      // Push-and-reveal: exit current → scroll top → enter new
      setPhase('exit');
      const t1 = setTimeout(() => {
        if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
        setPhase('enter');
        const t2 = setTimeout(() => setPhase('idle'), 320);
        timers.push(t2);
      }, 200);
      timers.push(t1);
    }, 0);
    timers.push(t0);
    return () => timers.forEach(t => clearTimeout(t));
  }, [location.pathname]);

  // exit: slide out to left + fade; enter: slide in from right + fade
  const getStyle = () => {
    if (phase === 'exit')  return { opacity: 0, transform: 'translateX(-28px)', pointerEvents: 'none' };
    if (phase === 'enter') return { opacity: 0, transform: 'translateX(28px)',  pointerEvents: 'none' };
    return { opacity: 1, transform: 'translateX(0)' };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', overflow: 'clip' }}>

      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 298, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(3px)' }}
        />
      )}

      <Sidebar
        collapsed={isMobile ? false : collapsed}
        onToggle={() => isMobile ? setMobileOpen(false) : setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        isMobile={isMobile}
      />

      <div style={{
        marginLeft: isMobile ? 0 : sw,
        flex: 1, display: 'flex', flexDirection: 'column',
        height: isMobile ? 'auto' : '100vh',
        maxHeight: isMobile ? 'none' : '100vh',
        minHeight: isMobile ? '100vh' : undefined,
        transition: 'margin-left .22s ease', minWidth: 0,
      }}>

        {isMobile ? (
          <header style={{
            height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12,
            position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 1px 4px rgba(0,0,0,.07)',
          }}>
            <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Menu size={22} />
            </button>
            <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>LMS Portal</div>
            <Navbar mobileCompact />
          </header>
        ) : (
          <Navbar />
        )}

        <main
          ref={mainRef}
          style={{
            flex: 1,
            padding: isMobile ? '14px 12px' : '28px',
            overflowY: isMobile ? 'visible' : 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            ...getStyle(),
            transition: phase === 'idle'
              ? 'none'
              : 'opacity 0.22s cubic-bezier(.4,0,.2,1), transform 0.22s cubic-bezier(.4,0,.2,1)',
            position: 'relative',
          }}
        >
          {/* Decorative background orbs */}
          <div style={{ position:'fixed', top:80, right:'10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,.06) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }}/>
          <div style={{ position:'fixed', bottom:'15%', left:'5%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,.05) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }}/>
          <div style={{ position:'fixed', top:'40%', left:'30%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,.04) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }}/>
          <div style={{ position:'relative', zIndex:1 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
