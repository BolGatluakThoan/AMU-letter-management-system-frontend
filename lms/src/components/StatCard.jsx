const GRADIENTS = {
  '#6366f1': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  '#0891b2': 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
  '#f59e0b': 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  '#ef4444': 'linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)',
  '#10b981': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  '#8b5cf6': 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
};

export default function StatCard({ label, value, icon: Icon, color, sub, trend, onClick }) {
  const gradient = GRADIENTS[color] || `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`;
  return (
    <div onClick={onClick} style={{
      background: gradient,
      borderRadius: 16,
      padding: '22px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      position: 'relative',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform .18s ease, box-shadow .18s ease',
      boxShadow: `0 4px 20px ${color}40`,
      color: '#fff',
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)'; e.currentTarget.style.boxShadow = `0 12px 32px ${color}55`; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 20px ${color}40`; }}
    >
      {/* Decorative circles */}
      <div style={{ position:'absolute', top:-28, right:-28, width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,.1)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-20, right:20, width:70, height:70, borderRadius:'50%', background:'rgba(255,255,255,.07)', pointerEvents:'none' }}/>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div style={{ width:46, height:46, borderRadius:13, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
          <Icon size={22} color="#fff" strokeWidth={2.2}/>
        </div>
        {trend !== undefined && (
          <span style={{ fontSize:11, fontWeight:700, padding:'4px 9px', borderRadius:99, background: trend >= 0 ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.2)', color:'#fff', display:'flex', alignItems:'center', gap:3 }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div>
        <div style={{ fontSize:34, fontWeight:900, color:'#fff', lineHeight:1, letterSpacing:'-1.5px', textShadow:'0 2px 8px rgba(0,0,0,.15)' }}>{value}</div>
        <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,.9)', marginTop:5 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:'rgba(255,255,255,.65)', marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}
