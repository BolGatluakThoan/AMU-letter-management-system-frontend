import { useState } from 'react';
import { Mail, Send, Clock, AlertTriangle, TrendingUp, Activity, ArrowRight,
         Building2, X, CheckCircle, Eye, FileText, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';
import { useI18n } from '../i18n/index.jsx';

const statusColor = {
  Registered:'badge-primary', Forwarded:'badge-info', 'Under Review':'badge-warning',
  Responded:'badge-success', Closed:'badge-gray',
};
const priorityColor = { Normal:'badge-gray', Urgent:'badge-warning', Confidential:'badge-danger' };

const STATUS_CFG = [
  { key:'Registered',   color:'#6366f1', bg:'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { key:'Forwarded',    color:'#06b6d4', bg:'linear-gradient(135deg,#0891b2,#06b6d4)' },
  { key:'Under Review', color:'#f59e0b', bg:'linear-gradient(135deg,#f59e0b,#f97316)' },
  { key:'Responded',    color:'#10b981', bg:'linear-gradient(135deg,#10b981,#059669)' },
  { key:'Closed',       color:'#94a3b8', bg:'linear-gradient(135deg,#94a3b8,#64748b)' },
];

const OFFICE_COLORS = {
  'Record Office':'#6366f1','Registrar Office':'#0891b2','Finance Office':'#10b981',
  'Academic/Faculty Office':'#f59e0b','Administration Office':'#8b5cf6','Management/Executive Office':'#ef4444',
};

function LetterActionModal({ title, letters, onClose, onMarkRead, onMarkResponded, color, icon: Icon, office }) {
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon size={18} color={color}/>
            </div>
            <div>
              <h2 style={{ fontSize:16, fontWeight:700 }}>{title}</h2>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>{letters.length} letter{letters.length!==1?'s':''} requiring attention</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body" style={{ padding:0 }}>
          {letters.length===0?(
            <div style={{ padding:40, textAlign:'center', color:'var(--text-faint)' }}>
              <CheckCircle size={36} style={{ margin:'0 auto 12px', display:'block', color:'#10b981' }}/>
              <div style={{ fontSize:15, fontWeight:600 }}>All clear!</div>
              <div style={{ fontSize:13, marginTop:4 }}>No letters require action right now.</div>
            </div>
          ):letters.map(l=>(
            <div key={l.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 24px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                  <span style={{ fontWeight:700, color:'#1e40af', fontSize:12 }}>{l.refNo}</span>
                  <span className={`badge ${priorityColor[l.priority]||'badge-gray'}`}>{l.priority}</span>
                  <span className={`badge ${statusColor[l.status]||'badge-gray'}`}>{l.status}</span>
                </div>
                <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.subject}</div>
                <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:2 }}>From: {l.sender} · {l.senderOrg} · {l.dateReceived}</div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                {l.status!=='Responded'&&l.status!=='Closed'&&(
                  <button className="btn btn-outline btn-sm" style={{ color:'#10b981', borderColor:'#10b981', fontSize:12 }} onClick={()=>onMarkResponded(l.id)}>
                    <CheckCircle size={13}/> Responded
                  </button>
                )}
                {!(l._readBy||[]).includes(office)?(
                  <button className="btn btn-ghost btn-sm" style={{ fontSize:12 }} onClick={()=>onMarkRead(l.id)}>
                    <Eye size={13}/> Mark Read
                  </button>
                ):(
                  <span style={{ fontSize:11, color:'#10b981', display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={12}/> Read</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { incoming, outgoing, user, readOnly, updateIncoming, markLetterRead } = useApp();
  const { t } = useI18n();
  const [modal, setModal] = useState(null);

  const totalIn = incoming.length;
  const totalOut = outgoing.length;
  const pendingLetters = incoming.filter(l=>['Registered','Forwarded','Under Review'].includes(l.status));
  const urgentLetters  = incoming.filter(l=>l.priority==='Urgent'&&l.status!=='Closed'&&!(l._readBy||[]).includes(user?.office));
  const pending = pendingLetters.length;
  const urgent  = urgentLetters.length;
  const recent  = [...incoming].reverse().slice(0,5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h<12) return t('good_morning');
    if (h<17) return t('good_afternoon');
    return t('good_evening');
  };

  return (
    <div>
      <style>{`
        @media(max-width:799px){.dash-main{grid-template-columns:1fr !important}}
        @media(max-width:600px){.dash-banner-right{display:none!important}.dash-banner{padding:18px 20px!important}}
      `}</style>

      {/* ── Welcome banner ── */}
      <div className="dash-banner" style={{
        background:'linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#312e81 100%)',
        borderRadius:16, padding:'26px 30px', marginBottom:24,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        color:'#fff', position:'relative', overflow:'hidden',
        boxShadow:'0 8px 32px rgba(99,102,241,.25)',
      }}>
        <div style={{ position:'absolute', right:-40, top:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.04)' }}/>
        <div style={{ position:'absolute', right:80, bottom:-50, width:140, height:140, borderRadius:'50%', background:'rgba(99,102,241,.15)' }}/>
        <div style={{ position:'absolute', left:'40%', top:-30, width:100, height:100, borderRadius:'50%', background:'rgba(139,92,246,.1)' }}/>
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:12, opacity:.6, marginBottom:4, letterSpacing:1, textTransform:'uppercase' }}>{greeting()}</div>
          <h1 style={{ fontSize:24, fontWeight:900, marginBottom:6, letterSpacing:'-0.5px' }}>{user?.name}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 6px #10b981' }}/>
            <span style={{ fontSize:13, opacity:.8 }}>{user?.role} · {user?.office}</span>
          </div>
        </div>
        <div className="dash-banner-right" style={{ textAlign:'right', position:'relative' }}>
          <div style={{ fontSize:11, opacity:.5, marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>Arba Minch University</div>
          <div style={{ fontSize:13, opacity:.75, marginBottom:10 }}>Letter Management System</div>
          <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
            {[{l:'Incoming',v:totalIn,c:'#6366f1'},{l:'Outgoing',v:totalOut,c:'#0891b2'},{l:'Pending',v:pending,c:'#f59e0b'}].map(s=>(
              <div key={s.l} style={{ textAlign:'center', padding:'6px 12px', borderRadius:10, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', backdropFilter:'blur(4px)' }}>
                <div style={{ fontSize:18, fontWeight:900, color:'#fff' }}>{s.v}</div>
                <div style={{ fontSize:10, opacity:.7 }}>{s.l}</div>
              </div>
            ))}
          </div>
          {readOnly&&<div style={{ marginTop:8, fontSize:11, background:'rgba(239,68,68,.2)', color:'#fca5a5', padding:'3px 10px', borderRadius:99, display:'inline-block' }}>View Only</div>}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-4" style={{ marginBottom:24 }}>
        <StatCard label={t('total_incoming')} value={totalIn}  icon={Mail}          color="#6366f1" sub="All registered letters"   trend={12} onClick={()=>navigate('/incoming')}/>
        <StatCard label={t('total_outgoing')} value={totalOut} icon={Send}          color="#0891b2" sub="Letters dispatched"        trend={8}  onClick={()=>navigate('/outgoing')}/>
        <StatCard label={t('pending_action')} value={pending}  icon={Clock}         color="#f59e0b" sub="Click to review & act"     trend={pending>0?-5:0} onClick={()=>setModal('pending')}/>
        <StatCard label="Urgent Unread"       value={urgent}   icon={AlertTriangle} color="#ef4444" sub="Needs immediate attention"  onClick={()=>{setModal('urgent');urgentLetters.forEach(l=>markLetterRead(l.id));}}/>
      </div>

      {/* ── Main grid ── */}
      <div className="dash-main" style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20 }}>

        {/* Recent letters table */}
        <div className="card" style={{ overflow:'hidden' }}>
          <div className="card-header" style={{ background:'linear-gradient(135deg,rgba(99,102,241,.06),rgba(139,92,246,.04))', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Mail size={16} color="#fff"/>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>Recent Incoming Letters</div>
                <div style={{ fontSize:11, color:'var(--text-faint)' }}>Latest registered correspondence</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/incoming')} style={{ gap:4, color:'#6366f1' }}>
              View all <ArrowRight size={13}/>
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Ref No.</th><th>Sender</th><th>Subject</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>
                {recent.length===0
                  ?<tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'var(--text-faint)' }}>No letters registered yet</td></tr>
                  :recent.map(l=>(
                    <tr key={l.id} style={{ cursor:'pointer' }} onClick={()=>navigate('/incoming')}>
                      <td><span style={{ fontWeight:700, color:'#6366f1', fontSize:12 }}>{l.refNo}</span></td>
                      <td style={{ fontWeight:500 }}>{l.sender}</td>
                      <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text-muted)' }}>{l.subject}</td>
                      <td><span className={`badge ${priorityColor[l.priority]}`}>{l.priority}</span></td>
                      <td><span className={`badge ${statusColor[l.status]}`}>{l.status}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Status breakdown — colorful cards */}
          <div className="card" style={{ overflow:'hidden' }}>
            <div className="card-header" style={{ background:'linear-gradient(135deg,rgba(99,102,241,.06),rgba(139,92,246,.04))' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Activity size={15} color="#6366f1"/>
                <span style={{ fontWeight:700, fontSize:13.5 }}>Status Breakdown</span>
              </div>
            </div>
            <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
              {STATUS_CFG.map(({ key, color, bg }) => {
                const count = incoming.filter(l=>l.status===key).length;
                const pct = totalIn>0 ? Math.round((count/totalIn)*100) : 0;
                return (
                  <div key={key} style={{ borderRadius:10, overflow:'hidden', background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}80` }}/>
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{key}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:11, color:'var(--text-faint)' }}>{pct}%</span>
                        <span style={{ fontSize:13, fontWeight:800, padding:'1px 8px', borderRadius:99, background:bg, color:'#fff', minWidth:28, textAlign:'center' }}>{count}</span>
                      </div>
                    </div>
                    <div style={{ height:3, background:'var(--border)' }}>
                      <div style={{ height:'100%', background:bg, width:pct+'%', transition:'width .6s ease' }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card" style={{ overflow:'hidden' }}>
            <div className="card-header" style={{ background:'linear-gradient(135deg,rgba(8,145,178,.06),rgba(6,182,212,.04))' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <FileText size={15} color="#0891b2"/>
                <span style={{ fontWeight:700, fontSize:13.5 }}>Quick Actions</span>
              </div>
            </div>
            <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'Register Incoming', icon:Mail,          color:'#6366f1', bg:'linear-gradient(135deg,#6366f1,#8b5cf6)', show:!readOnly, action:()=>navigate('/incoming') },
                { label:'Register Outgoing', icon:Send,          color:'#0891b2', bg:'linear-gradient(135deg,#0891b2,#06b6d4)', show:!readOnly, action:()=>navigate('/outgoing') },
                { label:'View Reports',      icon:TrendingUp,    color:'#10b981', bg:'linear-gradient(135deg,#10b981,#059669)', show:true,      action:()=>navigate('/reports') },
                { label:`Review Pending (${pending})`, icon:Clock, color:'#f59e0b', bg:'linear-gradient(135deg,#f59e0b,#f97316)', show:pending>0, action:()=>setModal('pending') },
                { label:`Urgent Unread (${urgent})`,   icon:AlertTriangle, color:'#ef4444', bg:'linear-gradient(135deg,#ef4444,#f43f5e)', show:urgent>0, action:()=>{setModal('urgent');urgentLetters.forEach(l=>markLetterRead(l.id));} },
              ].filter(a=>a.show).map(a=>(
                <button key={a.label} onClick={a.action} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                  borderRadius:10, border:'none', cursor:'pointer', textAlign:'left',
                  background:a.bg, color:'#fff', fontWeight:600, fontSize:13,
                  boxShadow:`0 3px 12px ${a.color}30`, transition:'transform .15s,box-shadow .15s',
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=`0 6px 18px ${a.color}45`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=`0 3px 12px ${a.color}30`;}}>
                  <a.icon size={15} color="#fff"/>
                  {a.label}
                  <ArrowRight size={13} style={{ marginLeft:'auto', opacity:.7 }}/>
                </button>
              ))}
            </div>
          </div>

          {/* Office legend */}
          <div className="card" style={{ overflow:'hidden' }}>
            <div className="card-header" style={{ background:'linear-gradient(135deg,rgba(139,92,246,.06),rgba(99,102,241,.04))' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Building2 size={15} color="#8b5cf6"/>
                <span style={{ fontWeight:700, fontSize:13.5 }}>University Offices</span>
              </div>
            </div>
            <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:6 }}>
              {Object.entries(OFFICE_COLORS).map(([office, color])=>{
                const cnt = incoming.filter(l=>l._toOffice===office||l.department===office).length;
                return (
                  <div key={office} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:8, background:'var(--surface-2)' }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:color, flexShrink:0, boxShadow:`0 0 5px ${color}60` }}/>
                    <span style={{ fontSize:11.5, color:'var(--text-muted)', flex:1 }}>{office}</span>
                    {cnt>0&&<span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:99, background:color+'20', color }}>{cnt}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {modal==='pending'&&<LetterActionModal title="Pending Action Letters" letters={pendingLetters} onClose={()=>setModal(null)} onMarkRead={id=>markLetterRead(id)} onMarkResponded={id=>updateIncoming(id,{status:'Responded'})} color="#f59e0b" icon={Clock} office={user?.office}/>}
      {modal==='urgent'&&<LetterActionModal title="Urgent Unread Letters" letters={urgentLetters} onClose={()=>setModal(null)} onMarkRead={id=>markLetterRead(id)} onMarkResponded={id=>updateIncoming(id,{status:'Responded'})} color="#ef4444" icon={AlertTriangle} office={user?.office}/>}
    </div>
  );
}
