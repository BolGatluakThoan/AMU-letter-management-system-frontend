import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Search, Check, CheckCheck, X, Pencil, Trash2,
         Reply, MoreHorizontal, Sparkles, ChevronDown, ChevronUp, Users,
         Plus, Settings, UserPlus, Crown, LogOut, Smile } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { useI18n } from '../i18n/index.jsx';

const REACTIONS = ['👍','❤️','😂','😮','😢','🙏'];
const EMOJI_LIST = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇',
  '🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚',
  '😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸',
  '🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️',
  '😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡',
  '🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓',
  '🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄',
  '😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵',
  '👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞',
  '🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍',
  '👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝',
  '🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
  '✅','❌','⭐','🔥','💯','🎉','🎊','🏆','🥇','💡',
];

const QM = {
  morning:  { label:'🌅 Morning Greetings',  color:'#f59e0b', messages:['Good morning! Wishing you a productive and blessed day ahead.','Good morning! May your day be filled with success and positive energy.','Good morning colleague! Hope you have a wonderful and fruitful day.','Selam! Wishing you a great morning and a productive work day.','Good morning! Lets make today count. Have a great day at work!'] },
  afternoon:{ label:'☀️ Afternoon Greetings', color:'#0891b2', messages:['Good afternoon! Hope your morning was productive. Keep up the great work!','Good afternoon! Wishing you energy and focus for the rest of the day.','Good afternoon colleague! Hope the day is going well for you.','Selam! Good afternoon, stay strong and keep pushing forward.','Good afternoon! You are doing great. Keep it up!'] },
  general:  { label:'💬 General Messages',   color:'#6366f1', messages:['Thank you for your hard work and dedication. It is truly appreciated!','Great teamwork today! Together we achieve more.','Your contribution to our office makes a real difference. Thank you!','Wishing you continued success in all your endeavors.','It is a pleasure working alongside such a dedicated colleague.'] },
  senior:   { label:'🎖️ For Senior Staff',   color:'#7c3aed', messages:['Dear Professor/Dr., your leadership and guidance inspire us all. Thank you.','Respected Director, your vision and dedication are truly commendable.','Dear Dean, thank you for your continued support and mentorship.','Honorable VP, your commitment to excellence sets the standard for all of us.','Dear President, your leadership steers our university toward greatness.'] },
  junior:   { label:'🌱 For Junior Staff',   color:'#10b981', messages:['Keep up the great work! Your enthusiasm and effort are noticed and valued.','You are doing wonderfully. Keep learning and growing every day!','Your dedication and hard work will take you far. Keep it up!','Welcome to the team! We are glad to have you with us.','You have great potential. Keep pushing forward and never stop learning.'] },
  holidays: { label:'🎉 Ethiopian Holidays',  color:'#ef4444', messages:['Enkutatash - Melkam Addis Amet! May this new year bring you joy, health, and prosperity.','Timkat - Melkam Timkat! May this holy celebration bring blessings to you and your family.','Genna - Melkam Genna! Wishing you and your loved ones a joyful and blessed Christmas.','Eid Mubarak! May Allah bless you and your family with peace, happiness, and prosperity.','Fasika - Melkam Fasika! May the resurrection bring renewed hope and joy to your life.','Meskel - Melkam Meskel! May this celebration bring light and blessings to your home.','Irreecha - Nagaa fi fayyaa isiniif haa kennu! Wishing you peace and blessings.','Wishing you and your family a blessed and joyful holiday season.'] },
};

function avatar(n) { if(!n)return'?'; return n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function timeStr(d) { if(!d)return''; const dt=new Date(d),now=new Date(); if(dt.toDateString()===now.toDateString()) return dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); return dt.toLocaleDateString([],{month:'short',day:'numeric'}); }
function iStyle(c) { return{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'9px 14px',background:'none',border:'none',cursor:'pointer',fontSize:13,fontWeight:500,color:c,textAlign:'left'}; }

// ── Emoji Picker ──────────────────────────────────────────────────────────────
function EmojiPicker({ onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ background: open ? 'rgba(99,102,241,.1)' : 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: open ? '#6366f1' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
        <Smile size={16} />
      </button>
      {open && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, zIndex: 300, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.18)', padding: 10, width: 280 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 2, maxHeight: 200, overflowY: 'auto' }}>
            {EMOJI_LIST.map((e, i) => (
              <button key={i} type="button" onClick={() => { onSelect(e); setOpen(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 3, borderRadius: 6, lineHeight: 1 }}
                onMouseEnter={ev => ev.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'none'}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Group Settings Panel ──────────────────────────────────────────────────────
function GroupSettings({ group, allStaff, user, onClose, onUpdate, onLeave, onDelete }) {
  const myId = String(user?.id || user?._id || '');
  const isAdmin = group.admins?.some(a => String(a._id || a) === myId);
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(group.name);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const members = group.members || [];
  const memberIds = members.map(m => String(m._id || m));
  const nonMembers = allStaff.filter(u => u.id !== myId && !memberIds.includes(u.id));
  const filtered = nonMembers.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.office?.toLowerCase().includes(search.toLowerCase())
  );

  const saveName = async () => {
    if (!name.trim() || name === group.name) { setEditName(false); return; }
    setSaving(true);
    try { const g = await api.updateGroup(group._id, { name: name.trim() }); onUpdate(g); setEditName(false); }
    finally { setSaving(false); }
  };

  const addMember = async (userId) => {
    try { const g = await api.addGroupMember(group._id, userId); onUpdate(g); } catch {}
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try { await api.removeGroupMember(group._id, userId); onUpdate({ ...group, members: members.filter(m => String(m._id || m) !== String(userId)) }); } catch {}
  };

  const makeAdmin = async (userId) => {
    try { const g = await api.assignGroupAdmin(group._id, userId); onUpdate(g); } catch {}
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 24, width: 420, maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Settings size={16} color="#6366f1" /> Group Settings</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)' }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Group name */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Group Name</div>
            {editName ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-control" autoFocus value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditName(false); }} style={{ flex: 1 }} />
                <button onClick={saveName} disabled={saving} className="btn btn-primary btn-sm">{saving ? '...' : 'Save'}</button>
                <button onClick={() => { setEditName(false); setName(group.name); }} className="btn btn-ghost btn-sm">Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{group.name}</span>
                {isAdmin && <button onClick={() => setEditName(true)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 12, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}><Pencil size={11} /> Edit</button>}
              </div>
            )}
          </div>

          {/* Members list */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Members ({members.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
              {members.map(m => {
                const mId = String(m._id || m);
                const mIsAdmin = group.admins?.some(a => String(a._id || a) === mId);
                const isMe = mId === myId;
                return (
                  <div key={mId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: 'var(--surface-2)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{avatar(m.name || '?')}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name || mId}{isMe && <span style={{ fontSize: 10, color: '#6366f1', marginLeft: 6 }}>(you)</span>}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{m.office || ''}</div>
                    </div>
                    {mIsAdmin && <Crown size={12} color="#f59e0b" title="Admin" />}
                    {isAdmin && !isMe && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!mIsAdmin && <button onClick={() => makeAdmin(mId)} title="Make admin" style={{ background: 'none', border: '1px solid #f59e0b', borderRadius: 5, padding: '2px 6px', cursor: 'pointer', fontSize: 11, color: '#f59e0b' }}><Crown size={10} /></button>}
                        <button onClick={() => removeMember(mId)} title="Remove" style={{ background: 'none', border: '1px solid #ef4444', borderRadius: 5, padding: '2px 6px', cursor: 'pointer', fontSize: 11, color: '#ef4444' }}><X size={10} /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add members (admin only) */}
          {isAdmin && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><UserPlus size={12} /> Add Members</div>
              <input className="form-control" placeholder="Search staff to add..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 8, fontSize: 12 }} />
              <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                {filtered.length === 0 && <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>No staff to add</div>}
                {filtered.map(u => (
                  <button key={u.id} onClick={() => addMember(u.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: 'none', cursor: 'pointer', textAlign: 'left', background: 'transparent', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{avatar(u.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{u.office}</div>
                    </div>
                    <UserPlus size={13} color="#6366f1" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Close</button>
          <button onClick={onLeave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #ef4444', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
            <LogOut size={14} /> Leave Group
          </button>
          {isAdmin && (
            <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#ef4444', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600 }}>
              <Trash2 size={14} /> Delete Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Quick Messages Panel ──────────────────────────────────────────────────────
function QuickMsgPanel({ onSelect, allStaff, user }) {
  const { t } = useI18n();
  const [open,setOpen]=useState(false);
  const [cat,setCat]=useState(null);
  const [bMsg,setBMsg]=useState('');
  const [bSending,setBSending]=useState(false);
  const [bSent,setBSent]=useState(false);
  const ref=useRef();
  useEffect(()=>{ const close=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);}; document.addEventListener('mousedown',close); return()=>document.removeEventListener('mousedown',close); },[]);
  const sendAll=async(msg)=>{ if(!msg.trim()||bSending)return; setBSending(true); try{ const myId=String(user?.id||user?._id||''); const targets=allStaff.filter(u=>u.id!==myId); await Promise.all(targets.map(u=>api.sendMessage(u.id,msg.trim()))); setBSent(true); setBMsg(''); setTimeout(()=>setBSent(false),2500); }finally{setBSending(false);} };
  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={()=>setOpen(v=>!v)} style={{background:open?'rgba(99,102,241,.08)':'none',border:'1px solid var(--border)',borderRadius:8,padding:'6px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:12,color:open?'#6366f1':'var(--text-muted)'}}>
        <Sparkles size={14}/> {t('quick_messages')}
      </button>
      {open&&(
        <div style={{position:'absolute',bottom:'calc(100% + 8px)',left:0,zIndex:200,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,.18)',width:340,maxHeight:460,overflowY:'auto'}}>
          <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'var(--surface)',zIndex:1}}>
            <span style={{fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:6}}><Sparkles size={14} color="#6366f1"/> {t('quick_messages')}</span>
            <button onClick={()=>setOpen(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-faint)'}}><X size={14}/></button>
          </div>
          <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',background:'rgba(99,102,241,.04)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#6366f1',marginBottom:6,display:'flex',alignItems:'center',gap:5}}><Users size={12}/> {t('send_to_all')}</div>
            <div style={{display:'flex',gap:6}}>
              <input className="form-control" placeholder={t('type_for_everyone')} value={bMsg} onChange={e=>setBMsg(e.target.value)} style={{flex:1,fontSize:12,height:32}}/>
              <button onClick={()=>sendAll(bMsg)} disabled={!bMsg.trim()||bSending} className="btn btn-primary btn-sm" style={{flexShrink:0,fontSize:11}}>{bSent?t('sent'):bSending?'...':t('send_all')}</button>
            </div>
          </div>
          {Object.entries(QM).map(([key,c])=>(
            <div key={key}>
              <button onClick={()=>setCat(cat===key?null:key)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'none',border:'none',cursor:'pointer',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:12,fontWeight:600,color:c.color}}>{c.label}</span>
                {cat===key?<ChevronUp size={13} color="var(--text-faint)"/>:<ChevronDown size={13} color="var(--text-faint)"/>}
              </button>
              {cat===key&&(<div style={{background:'var(--surface-2)'}}>
                {c.messages.map((msg,i)=>(
                  <div key={i} style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'flex-start',gap:8}}>
                    <div style={{flex:1,fontSize:12,color:'var(--text-muted)',lineHeight:1.5}}>{msg}</div>
                    <div style={{display:'flex',flexDirection:'column',gap:4,flexShrink:0}}>
                      <button onClick={()=>{onSelect(msg);setOpen(false);}} style={{fontSize:10,padding:'3px 8px',borderRadius:5,border:'1px solid #6366f1',background:'none',cursor:'pointer',color:'#6366f1',fontWeight:600}}>Use</button>
                      <button onClick={()=>sendAll(msg)} disabled={bSending} style={{fontSize:10,padding:'3px 8px',borderRadius:5,border:'none',background:'#6366f1',cursor:'pointer',color:'#fff',fontWeight:600}}>{bSent?'OK':'All'}</button>
                    </div>
                  </div>
                ))}
              </div>)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Create Group Modal ────────────────────────────────────────────────────────
function CreateGroupModal({ allStaff, user, onClose, onCreate }) {
  const [name,setName]=useState('');
  const [desc,setDesc]=useState('');
  const [selected,setSelected]=useState([]);
  const [search,setSearch]=useState('');
  const [saving,setSaving]=useState(false);
  const others=allStaff.filter(u=>u.id!==String(user?.id||user?._id||''));
  const filtered=others.filter(u=>u.name?.toLowerCase().includes(search.toLowerCase())||u.office?.toLowerCase().includes(search.toLowerCase()));
  const toggle=(id)=>setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const handleCreate=async()=>{
    if(!name.trim())return;
    setSaving(true);
    try{ const g=await api.createGroup({name,description:desc,memberIds:selected}); onCreate(g); onClose(); }
    finally{setSaving(false);}
  };
  return(
    <div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'var(--surface)',borderRadius:14,padding:24,width:440,maxWidth:'95vw',maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,.25)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:700}}>Create Group</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-faint)'}}><X size={18}/></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12,flex:1,overflowY:'auto'}}>
          <div className="form-group">
            <label className="form-label">Group Name *</label>
            <input className="form-control" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Finance Coordination Team" autoFocus/>
          </div>
          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <input className="form-control" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="What is this group for?"/>
          </div>
          <div className="form-group">
            <label className="form-label">Add Members ({selected.length} selected)</label>
            <input className="form-control" placeholder="Search staff..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:8}}/>
            <div style={{maxHeight:200,overflowY:'auto',border:'1px solid var(--border)',borderRadius:8}}>
              {filtered.map(u=>(
                <button key={u.id||u._id} onClick={()=>toggle(u.id||u._id)}
                  style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'8px 12px',border:'none',cursor:'pointer',textAlign:'left',background:selected.includes(u.id||u._id)?'rgba(99,102,241,.08)':'transparent',borderBottom:'1px solid var(--border)'}}>
                  <div style={{width:30,height:30,borderRadius:'50%',background:selected.includes(u.id||u._id)?'#6366f1':'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:selected.includes(u.id||u._id)?'#fff':'var(--text-muted)',flexShrink:0}}>{avatar(u.name)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{u.name}</div>
                    <div style={{fontSize:11,color:'var(--text-faint)'}}>{u.office}</div>
                  </div>
                  {selected.includes(u.id||u._id)&&<Check size={14} color="#6366f1"/>}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:16}}>
          <button onClick={onClose} className="btn btn-ghost" style={{flex:1}}>Cancel</button>
          <button onClick={handleCreate} disabled={!name.trim()||saving} className="btn btn-primary" style={{flex:1}}>
            {saving?'Creating...':'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MsgBubble({ m, mine, senderName, user, activeUser, activeGroup, menuFor, setMenuFor, handleReact, handleReply, handleEdit, handleDelete, editingId, editText, setEditText, submitEdit, setEditingId, isMobile, findMsg }) {
  const rc = m.reactions ? Object.values(m.reactions).reduce((a,e)=>{a[e]=(a[e]||0)+1;return a;},{}) : {};
  const replied = m.replyTo ? findMsg(m.replyTo) : null;
  const open = menuFor === m._id;
  const replyName = replied ? (String(replied.from)===String(user?.id) ? 'You' : (activeGroup ? (replied.senderName||'Member') : (activeUser?.name||'Them'))) : '';
  return (
    <div className="msg-row" style={{display:'flex',flexDirection:'column',alignItems:mine?'flex-end':'flex-start',position:'relative'}}>
      {!mine && activeGroup && senderName && (
        <div style={{fontSize:10,color:'#6366f1',fontWeight:600,marginBottom:2,paddingLeft:4}}>{senderName}</div>
      )}
      {!m.deleted&&(
        <div style={{alignSelf:mine?'flex-end':'flex-start',marginBottom:2,position:'relative'}}>
          <button className="dots-btn" onClick={e=>{e.stopPropagation();setMenuFor(open?null:m._id);}} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 5px',borderRadius:6,color:'var(--text-faint)',opacity:0,transition:'opacity .15s'}}><MoreHorizontal size={15}/></button>
          {open&&(
            <div onClick={e=>e.stopPropagation()} style={{position:'absolute',[mine?'right':'left']:0,top:0,zIndex:100,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,boxShadow:'0 6px 24px rgba(0,0,0,.15)',minWidth:150,overflow:'hidden'}}>
              <div style={{display:'flex',gap:4,padding:'8px 10px',borderBottom:'1px solid var(--border)'}}>
                {REACTIONS.map(emoji=>(<button key={emoji} onClick={()=>handleReact(m._id,emoji)} style={{background:'none',border:'none',cursor:'pointer',fontSize:17,padding:2,borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.3)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>{emoji}</button>))}
              </div>
              <button onClick={()=>handleReply(m)} style={iStyle('#6366f1')}><Reply size={13}/> Reply</button>
              {mine&&<button onClick={()=>handleEdit(m)} style={iStyle('#f59e0b')}><Pencil size={13}/> Edit</button>}
              {mine&&<button onClick={()=>handleDelete(m)} style={iStyle('#ef4444')}><Trash2 size={13}/> Delete</button>}
            </div>
          )}
        </div>
      )}
      <div style={{maxWidth:isMobile?'85%':'68%',padding:'9px 13px',borderRadius:mine?'14px 14px 4px 14px':'14px 14px 14px 4px',background:m.deleted?'rgba(241,245,249,.8)':mine?'linear-gradient(135deg,#0ea5e9,#38bdf8)':'#fff',color:m.deleted?'#94a3b8':mine?'#fff':'#1e293b',fontSize:13,lineHeight:1.5,boxShadow:m.deleted?'none':mine?'0 2px 12px rgba(14,165,233,.3)':'0 1px 4px rgba(0,0,0,.08)',fontStyle:m.deleted?'italic':'normal',border:mine?'none':'1px solid #e0f2fe'}}>
        {replied&&!m.deleted&&(<div style={{borderLeft:`3px solid ${mine?'rgba(255,255,255,.6)':'#38bdf8'}`,paddingLeft:8,marginBottom:6,opacity:.8,fontSize:11,background:mine?'rgba(255,255,255,.1)':'#f0f9ff',borderRadius:'0 6px 6px 0',padding:'4px 8px'}}><div style={{fontWeight:700,marginBottom:1,color:mine?'rgba(255,255,255,.9)':'#0369a1'}}>{replyName}</div><div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:200,color:mine?'rgba(255,255,255,.75)':'#64748b'}}>{replied.deleted?'deleted':replied.text}</div></div>)}
        {editingId===m._id?(
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <input autoFocus value={editText} onChange={e=>setEditText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submitEdit(m._id);if(e.key==='Escape')setEditingId(null);}} style={{flex:1,background:'rgba(255,255,255,.25)',border:'1px solid rgba(255,255,255,.5)',borderRadius:8,padding:'4px 8px',color:'#fff',fontSize:13,outline:'none'}} onClick={e=>e.stopPropagation()}/>
            <button onClick={()=>submitEdit(m._id)} style={{background:'rgba(255,255,255,.25)',border:'none',borderRadius:6,padding:'4px 8px',cursor:'pointer',color:'#fff',fontSize:12}}>Save</button>
            <button onClick={()=>setEditingId(null)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,.7)',fontSize:12}}>✕</button>
          </div>
        ):(
          <><div>{m.deleted?'This message was deleted':m.text}</div><div style={{fontSize:10,opacity:.65,marginTop:4,textAlign:'right',display:'flex',alignItems:'center',justifyContent:'flex-end',gap:4,color:mine?'rgba(255,255,255,.7)':'#94a3b8'}}>{m.editedAt&&!m.deleted&&<span style={{fontSize:9}}>edited</span>}{timeStr(m.createdAt)}{mine&&!activeGroup&&(m.readAt?<CheckCheck size={11}/>:<Check size={11}/>)}</div></>
        )}
      </div>
      {Object.keys(rc).length>0&&(<div style={{display:'flex',gap:4,marginTop:3,flexWrap:'wrap',justifyContent:mine?'flex-end':'flex-start'}}>{Object.entries(rc).map(([emoji,count])=>{const iM=m.reactions&&m.reactions[String(user?.id)]===emoji;return(<span key={emoji} onClick={e=>{e.stopPropagation();handleReact(m._id,emoji);}} title={iM?'Remove':'React'} style={{background:iM?'rgba(99,102,241,.15)':'var(--surface-2)',border:`1px solid ${iM?'#6366f1':'var(--border)'}`,borderRadius:99,padding:'2px 7px',fontSize:12,cursor:'pointer',fontWeight:iM?700:400}}>{emoji}{count>1?` ${count}`:''}</span>);})}</div>)}
    </div>
  );
}

// ── Main Chat Component ───────────────────────────────────────────────────────
export default function Chat() {
  const { user } = useApp();
  const { t } = useI18n();
  const [allStaff, setAllStaff] = useState([]);
  const [search, setSearch] = useState('');
  const [activeUser, setActiveUser] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [convos, setConvos] = useState({});
  const [groups, setGroups] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const [tab, setTab] = useState('dm');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const loadConvos = useCallback(async () => {
    try { setConvos(await api.getConversations()); } catch {}
  }, []);

  const loadGroups = useCallback(async () => {
    try { setGroups(await api.getGroups()); } catch {}
  }, []);

  useEffect(() => {
    api.getUserDirectory()
      .then(users => setAllStaff(users.map(u => ({ ...u, id: String(u._id || u.id) }))))
      .catch(err => console.error('Failed to load staff:', err));
    loadConvos();
    loadGroups();
  }, [loadConvos, loadGroups]);

  const myId = String(user?.id || user?._id || '');
  const otherUsers = allStaff.filter(u => u.id !== myId);
  const filteredUsers = search.trim()
    ? otherUsers.filter(u => (u.name||'').toLowerCase().includes(search.toLowerCase()) || (u.office||'').toLowerCase().includes(search.toLowerCase()))
    : otherUsers;
  const filteredGroups = groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()));

  const loadMessages = useCallback(async () => {
    if (!activeUser && !activeGroup) return;
    try {
      if (activeGroup) setMessages(await api.getGroupMessages(activeGroup._id));
      else setMessages(await api.getMessages(activeUser.id));
    } catch {}
  }, [activeUser, activeGroup]);

  useEffect(() => {
    if (!activeUser && !activeGroup) return;
    setLoading(true);
    loadMessages().finally(() => setLoading(false));
    pollRef.current = setInterval(() => { loadMessages(); loadConvos(); loadGroups(); }, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeUser, activeGroup, loadMessages, loadConvos, loadGroups]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { const close = () => setMenuFor(null); window.addEventListener('click', close); return () => window.removeEventListener('click', close); }, []);

  const openDM = (u) => { setActiveUser(u); setActiveGroup(null); setText(''); setMessages([]); setMenuFor(null); setEditingId(null); setReplyTo(null); setTimeout(loadConvos, 500); };
  const openGroup = (g) => {
    setActiveGroup(g); setActiveUser(null); setText(''); setMessages([]);
    setMenuFor(null); setEditingId(null); setReplyTo(null);
    // Mark all messages read when opening
    api.markGroupRead(g._id).then(() => {
      setGroups(prev => prev.map(gr => gr._id === g._id ? { ...gr, unread: 0 } : gr));
    }).catch(() => {});
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || (!activeUser && !activeGroup) || sending) return;
    setSending(true);
    try {
      let msg;
      if (activeGroup) {
        msg = await api.sendGroupMessage(activeGroup._id, text.trim(), replyTo?._id || null);
        // Sending = you've read everything up to now
        setGroups(prev => prev.map(g => g._id === activeGroup._id ? { ...g, unread: 0 } : g));
      }
      else msg = await api.sendMessage(activeUser.id, text.trim(), replyTo?._id || null);
      setMessages(prev => [...prev, msg]);
      setText(''); setReplyTo(null);
      if (!activeGroup) loadConvos();
    } finally { setSending(false); }
  };

  const handleEdit = (msg) => { setEditingId(msg._id); setEditText(msg.text); setMenuFor(null); };
  const submitEdit = async (id) => {
    if (!editText.trim()) return;
    try { const u = await api.editMessage(id, editText.trim()); setMessages(prev => prev.map(m => m._id === id ? u : m)); }
    finally { setEditingId(null); setEditText(''); }
  };
  const handleDelete = async (msg) => {
    setMenuFor(null);
    try { const u = await api.deleteMessage(msg._id); setMessages(prev => prev.map(m => m._id === msg._id ? u : m)); } catch {}
  };
  const handleReply = (msg) => { setReplyTo(msg); setMenuFor(null); inputRef.current?.focus(); };
  const handleReact = async (msgId, emoji) => {
    setMenuFor(null);
    try { const u = await api.reactMessage(msgId, emoji); setMessages(prev => prev.map(m => m._id === msgId ? u : m)); } catch {}
  };

  const handleGroupUpdate = (updated) => {
    setGroups(prev => prev.map(g => g._id === updated._id ? updated : g));
    setActiveGroup(updated);
  };

  const handleLeaveGroup = async () => {
    if (!activeGroup || !window.confirm('Leave this group?')) return;
    try {
      await api.removeGroupMember(activeGroup._id, myId);
      setGroups(prev => prev.filter(g => g._id !== activeGroup._id));
      setActiveGroup(null);
      setShowGroupSettings(false);
    } catch {}
  };

  const handleDeleteGroup = async () => {
    if (!activeGroup || !window.confirm(`Delete "${activeGroup.name}"? This will permanently remove the group and all its messages.`)) return;
    try {
      await api.deleteGroup(activeGroup._id);
      setGroups(prev => prev.filter(g => g._id !== activeGroup._id));
      setActiveGroup(null);
      setShowGroupSettings(false);
    } catch (e) { alert(e.message || 'Failed to delete group'); }
  };

  const unreadFor = (uid) => convos[uid]?.unread || 0;
  const findMsg = (id) => messages.find(m => String(m._id) === String(id));
  const showList = !isMobile || (!activeUser && !activeGroup);
  const showChat = !isMobile || !!(activeUser || activeGroup);
  const isGroupAdmin = activeGroup?.admins?.some(a => String(a._id || a) === myId);

  const getSenderName = (msg) => {
    if (!activeGroup) return '';
    const member = activeGroup.members?.find(m => String(m._id || m) === String(msg.from));
    return member?.name || 'Member';
  };

  return (
    <div style={{ display:'flex', height:'calc(100vh - 120px)', borderRadius:12, overflow:'hidden', border:'1px solid var(--border)', background:'var(--surface)' }}>
      <style>{`.msg-row:hover .dots-btn{opacity:1!important}`}</style>

      {showCreateGroup && <CreateGroupModal allStaff={allStaff} user={user} onClose={()=>setShowCreateGroup(false)} onCreate={(g)=>{ setGroups(prev=>[g,...prev]); openGroup(g); }}/>}
      {showGroupSettings && activeGroup && (
        <GroupSettings
          group={activeGroup} allStaff={allStaff} user={user}
          onClose={() => setShowGroupSettings(false)}
          onUpdate={handleGroupUpdate}
          onLeave={handleLeaveGroup}
          onDelete={handleDeleteGroup}
        />
      )}

      {/* Left panel */}
      {showList && (
        <div style={{ width:isMobile?'100%':280, flexShrink:0, borderRight:isMobile?'none':'1px solid var(--border)', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'12px 14px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}><MessageSquare size={16} color="#6366f1"/><span style={{ fontWeight:700, fontSize:14 }}>{t('messages_title')}</span></div>
              {tab==='groups' && <button onClick={()=>setShowCreateGroup(true)} style={{ background:'#6366f1', border:'none', borderRadius:6, padding:'4px 8px', cursor:'pointer', color:'#fff', fontSize:11, display:'flex', alignItems:'center', gap:4 }}><Plus size={12}/> New</button>}
            </div>
            <div style={{ display:'flex', gap:0, marginBottom:-1 }}>
              {[['dm','Direct'],['groups','Groups']].map(([key,label])=>{
                const totalGroupUnread = key === 'groups' ? groups.reduce((s, g) => s + (g.unread || 0), 0) : 0;
                return (
                  <button key={key} onClick={()=>setTab(key)} style={{ flex:1, padding:'7px 0', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background:'none', borderBottom:tab===key?'2px solid #6366f1':'2px solid transparent', color:tab===key?'#6366f1':'var(--text-muted)', transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    {label}
                    {totalGroupUnread > 0 && key === 'groups' && (
                      <span style={{ background:'#ef4444', color:'#fff', borderRadius:99, fontSize:10, fontWeight:700, padding:'1px 5px', minWidth:16, textAlign:'center' }}>{totalGroupUnread > 99 ? '99+' : totalGroupUnread}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ padding:'8px 14px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ position:'relative' }}><Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--text-faint)' }}/><input className="form-control" placeholder={t('search_staff')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:28, fontSize:12, height:32 }}/></div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {tab==='dm' && (
              <>
                {filteredUsers.length===0 && <div style={{ padding:24, textAlign:'center', color:'var(--text-faint)', fontSize:13 }}>No staff found</div>}
                {filteredUsers.map(u => {
                  const unread=unreadFor(u.id), latest=convos[u.id]?.latest, isActive=activeUser?.id===u.id;
                  return (
                    <button key={u.id} onClick={()=>openDM(u)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', border:'none', cursor:'pointer', textAlign:'left', background:isActive?'rgba(99,102,241,.1)':'transparent', borderLeft:isActive?'3px solid #6366f1':'3px solid transparent', transition:'all .15s' }}>
                      <div style={{ width:38, height:38, borderRadius:'50%', background:isActive?'#6366f1':'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:isActive?'#fff':'var(--text-muted)', flexShrink:0 }}>{avatar(u.name)}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}><span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{u.name}</span>{latest&&<span style={{ fontSize:10, color:'var(--text-faint)' }}>{timeStr(latest.createdAt)}</span>}</div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:2 }}><span style={{ fontSize:11, color:'var(--text-faint)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>{latest?(latest.deleted?'deleted':latest.text):u.office}</span>{unread>0&&<span style={{ background:'#6366f1', color:'#fff', borderRadius:99, fontSize:10, fontWeight:700, padding:'1px 6px', minWidth:18, textAlign:'center', flexShrink:0 }}>{unread}</span>}</div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
            {tab==='groups' && (
              <>
                {filteredGroups.length===0 && <div style={{ padding:24, textAlign:'center', color:'var(--text-faint)', fontSize:13 }}>No groups yet. Click "New" to create one.</div>}
                {filteredGroups.map(g => {
                  const isActive = activeGroup?._id === g._id;
                  const gIsAdmin = g.admins?.some(a => String(a._id||a)===myId);
                  const gUnread = isActive ? 0 : (g.unread || 0);
                  return (
                    <button key={g._id} onClick={()=>openGroup(g)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', border:'none', cursor:'pointer', textAlign:'left', background:isActive?'rgba(99,102,241,.1)':'transparent', borderLeft:isActive?'3px solid #6366f1':'3px solid transparent', transition:'all .15s' }}>
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <div style={{ width:38, height:38, borderRadius:10, background:isActive?'#6366f1':'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:isActive?'#fff':'var(--text-muted)' }}><Users size={16}/></div>
                        {gUnread > 0 && (
                          <span style={{ position:'absolute', top:-4, right:-4, background:'#ef4444', color:'#fff', borderRadius:99, fontSize:10, fontWeight:700, padding:'1px 5px', minWidth:17, textAlign:'center', lineHeight:'15px', border:'2px solid var(--surface)' }}>{gUnread > 99 ? '99+' : gUnread}</span>
                        )}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:13, fontWeight: gUnread > 0 ? 700 : 600, color:'var(--text)' }}>{g.name}</span>
                          {gIsAdmin && <Crown size={11} color="#f59e0b"/>}
                        </div>
                        <div style={{ fontSize:11, color: gUnread > 0 ? '#6366f1' : 'var(--text-faint)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight: gUnread > 0 ? 600 : 400 }}>
                          {gUnread > 0 ? `${gUnread} new message${gUnread > 1 ? 's' : ''}` : `${g.members?.length||0} members`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* Chat window */}
      {showChat && (!activeUser && !activeGroup ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)', color:'#64748b' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#bae6fd,#7dd3fc)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, boxShadow:'0 8px 24px rgba(14,165,233,.2)' }}>
            <MessageSquare size={36} color="#0ea5e9"/>
          </div>
          <div style={{ fontSize:16, fontWeight:700, color:'#0369a1' }}>{t('select_staff')}</div>
          <div style={{ fontSize:13, marginTop:6, color:'#64748b' }}>{t('private_messages')}</div>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

          {/* Chat header — light blue gradient */}
          <div style={{ padding:'10px 16px', background:'linear-gradient(135deg,#0ea5e9 0%,#38bdf8 100%)', display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 12px rgba(14,165,233,.25)' }}>
            {isMobile && <button onClick={()=>{setActiveUser(null);setActiveGroup(null);}} style={{ background:'rgba(255,255,255,.2)', border:'none', cursor:'pointer', color:'#fff', fontWeight:700, fontSize:13, padding:'4px 10px', borderRadius:8, flexShrink:0 }}>← Back</button>}
            <div style={{ width:36, height:36, borderRadius:activeGroup?10:'50%', background:'rgba(255,255,255,.25)', border:'2px solid rgba(255,255,255,.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0, backdropFilter:'blur(4px)' }}>
              {activeGroup ? <Users size={17}/> : avatar(activeUser?.name)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:14, color:'#fff' }}>{activeGroup?.name || activeUser?.name}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#86efac', display:'inline-block', boxShadow:'0 0 5px #86efac' }}/>
                {activeGroup ? `${activeGroup.members?.length||0} members${isGroupAdmin ? ' · Admin' : ''}` : `${activeUser?.role} · ${activeUser?.office}`}
              </div>
            </div>
            {activeGroup && (
              <button onClick={() => setShowGroupSettings(true)} title="Group Settings"
                style={{ background:'rgba(255,255,255,.2)', border:'1px solid rgba(255,255,255,.35)', borderRadius:8, padding:'5px 10px', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, backdropFilter:'blur(4px)' }}>
                <Settings size={14}/>{!isMobile && ' Settings'}
              </button>
            )}
            {!isMobile && <button onClick={()=>{setActiveUser(null);setActiveGroup(null);}} style={{ background:'rgba(255,255,255,.15)', border:'none', cursor:'pointer', color:'#fff', borderRadius:8, padding:6, display:'flex', alignItems:'center' }}><X size={16}/></button>}
          </div>

          {/* Messages area — light blue tinted background with subtle pattern */}
          <div style={{
            flex:1, overflowY:'auto', padding:'16px 16px', display:'flex', flexDirection:'column', gap:8,
            background:'linear-gradient(180deg,#f0f9ff 0%,#e0f2fe 60%,#f0f9ff 100%)',
            backgroundImage:`radial-gradient(circle at 20px 20px, rgba(14,165,233,.06) 1px, transparent 0)`,
            backgroundSize:'40px 40px',
          }}>
            {loading && (
              <div style={{ textAlign:'center', color:'#64748b', fontSize:13, marginTop:40 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #bae6fd', borderTopColor:'#0ea5e9', animation:'spin .7s linear infinite', margin:'0 auto 10px' }}/>
                Loading messages…
              </div>
            )}
            {!loading && messages.length===0 && (
              <div style={{ textAlign:'center', marginTop:60, color:'#64748b' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>💬</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#0369a1' }}>{t('no_messages')}</div>
                <div style={{ fontSize:12, marginTop:4, color:'#94a3b8' }}>Say hello to start the conversation!</div>
              </div>
            )}
            {messages.map((m, i) => {
              const mine = String(m.from)===String(user?.id);
              return (
                <MsgBubble key={m._id||i} m={m} mine={mine} senderName={getSenderName(m)}
                  user={user} activeUser={activeUser} activeGroup={activeGroup}
                  menuFor={menuFor} setMenuFor={setMenuFor}
                  handleReact={handleReact} handleReply={handleReply}
                  handleEdit={handleEdit} handleDelete={handleDelete}
                  editingId={editingId} editText={editText} setEditText={setEditText}
                  submitEdit={submitEdit} setEditingId={setEditingId}
                  isMobile={isMobile} findMsg={findMsg}/>
              );
            })}
            <div ref={bottomRef}/>
          </div>

          {/* Reply preview */}
          {replyTo && (
            <div style={{ padding:'8px 16px', background:'#e0f2fe', borderTop:'1px solid #bae6fd', display:'flex', alignItems:'center', gap:10 }}>
              <Reply size={13} color="#0ea5e9"/>
              <div style={{ flex:1, fontSize:12, color:'#0369a1', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                <span style={{ fontWeight:700, color:'#0ea5e9' }}>{t('replying_to')}: </span>{replyTo.text}
              </div>
              <button onClick={()=>setReplyTo(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}><X size={13}/></button>
            </div>
          )}

          {/* Input bar */}
          <div style={{ borderTop:'1px solid #bae6fd', padding:'10px 14px', background:'#f8fafc', display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <EmojiPicker onSelect={(emoji) => { setText(prev => prev + emoji); inputRef.current?.focus(); }} />
              <input ref={inputRef}
                placeholder={`Message ${activeGroup?.name||activeUser?.name}… 😊`}
                value={text} onChange={e=>setText(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey)send(e);}}
                style={{
                  flex:1, fontSize:13, padding:'10px 16px', borderRadius:24,
                  border:'1.5px solid #bae6fd', background:'#fff', outline:'none',
                  boxShadow:'0 1px 4px rgba(14,165,233,.1)', transition:'border .2s, box-shadow .2s',
                }}
                onFocus={e=>{e.target.style.borderColor='#0ea5e9';e.target.style.boxShadow='0 0 0 3px rgba(14,165,233,.15)';}}
                onBlur={e=>{e.target.style.borderColor='#bae6fd';e.target.style.boxShadow='0 1px 4px rgba(14,165,233,.1)';}}
                autoFocus/>
              <button onClick={send} disabled={!text.trim()||sending}
                style={{
                  flexShrink:0, display:'flex', alignItems:'center', gap:6,
                  padding:'10px 18px', borderRadius:24, border:'none', cursor: text.trim()&&!sending ? 'pointer' : 'not-allowed',
                  background: text.trim()&&!sending ? 'linear-gradient(135deg,#0ea5e9,#38bdf8)' : '#e2e8f0',
                  color: text.trim()&&!sending ? '#fff' : '#94a3b8',
                  fontWeight:700, fontSize:13, transition:'all .2s',
                  boxShadow: text.trim()&&!sending ? '0 4px 14px rgba(14,165,233,.35)' : 'none',
                }}>
                <Send size={14}/>{!isMobile&&' Send'}
              </button>
            </div>
            {!activeGroup && <QuickMsgPanel onSelect={(msg)=>{setText(msg);inputRef.current?.focus();}} allStaff={allStaff} user={user}/>}
          </div>
        </div>
      ))}
    </div>
  );
}
