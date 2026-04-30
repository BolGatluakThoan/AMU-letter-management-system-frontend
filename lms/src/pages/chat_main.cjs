const fs = require('fs');
const target = __dirname + '/Chat.jsx';
const current = fs.readFileSync(target, 'utf8');
if (current.includes('export default function Chat')) {
  console.log('Already has export default');
  process.exit(0);
}
const main = `
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
  const [tab, setTab] = useState('dm'); // 'dm' | 'groups'
  const [showCreateGroup, setShowCreateGroup] = useState(false);
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
    api.getUserDirectory().then(users => setAllStaff(users.map(u => ({ ...u, id: u._id || u.id })))).catch(() => {});
    loadConvos();
    loadGroups();
  }, [loadConvos, loadGroups]);

  const otherUsers = allStaff.filter(u => u.id !== user?.id && String(u._id) !== String(user?.id));
  const filteredUsers = otherUsers.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.office?.toLowerCase().includes(search.toLowerCase())
  );
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
  const openGroup = (g) => { setActiveGroup(g); setActiveUser(null); setText(''); setMessages([]); setMenuFor(null); setEditingId(null); setReplyTo(null); };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || (!activeUser && !activeGroup) || sending) return;
    setSending(true);
    try {
      let msg;
      if (activeGroup) msg = await api.sendGroupMessage(activeGroup._id, text.trim(), replyTo?._id || null);
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

  const unreadFor = (uid) => convos[uid]?.unread || 0;
  const findMsg = (id) => messages.find(m => String(m._id) === String(id));
  const showList = !isMobile || (!activeUser && !activeGroup);
  const showChat = !isMobile || !!(activeUser || activeGroup);

  // Get sender name for group messages
  const getSenderName = (msg) => {
    if (!activeGroup) return '';
    const member = activeGroup.members?.find(m => String(m._id || m) === String(msg.from));
    return member?.name || 'Member';
  };

  return (
    <div style={{ display:'flex', height:'calc(100vh - 120px)', borderRadius:12, overflow:'hidden', border:'1px solid var(--border)', background:'var(--surface)' }}>
      <style>{\`.msg-row:hover .dots-btn{opacity:1!important}\`}</style>

      {showCreateGroup && <CreateGroupModal allStaff={allStaff} user={user} onClose={()=>setShowCreateGroup(false)} onCreate={(g)=>{ setGroups(prev=>[g,...prev]); openGroup(g); }}/>}

      {/* Left panel */}
      {showList && (
        <div style={{ width:isMobile?'100%':280, flexShrink:0, borderRight:isMobile?'none':'1px solid var(--border)', display:'flex', flexDirection:'column' }}>
          {/* Header + tabs */}
          <div style={{ padding:'12px 14px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}><MessageSquare size={16} color="#6366f1"/><span style={{ fontWeight:700, fontSize:14 }}>{t('messages_title')}</span></div>
              {tab==='groups' && <button onClick={()=>setShowCreateGroup(true)} style={{ background:'#6366f1', border:'none', borderRadius:6, padding:'4px 8px', cursor:'pointer', color:'#fff', fontSize:11, display:'flex', alignItems:'center', gap:4 }}><Plus size={12}/> New</button>}
            </div>
            {/* DM / Groups tabs */}
            <div style={{ display:'flex', gap:0, marginBottom:-1 }}>
              {[['dm','Direct'],['groups','Groups']].map(([key,label])=>(
                <button key={key} onClick={()=>setTab(key)} style={{ flex:1, padding:'7px 0', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background:'none', borderBottom:tab===key?'2px solid #6366f1':'2px solid transparent', color:tab===key?'#6366f1':'var(--text-muted)', transition:'all .15s' }}>{label}</button>
              ))}
            </div>
          </div>
          {/* Search */}
          <div style={{ padding:'8px 14px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ position:'relative' }}><Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--text-faint)' }}/><input className="form-control" placeholder={t('search_staff')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:28, fontSize:12, height:32 }}/></div>
          </div>
          {/* List */}
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
                  const isAdmin = g.admins?.some(a => String(a._id||a)===String(user?.id));
                  return (
                    <button key={g._id} onClick={()=>openGroup(g)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', border:'none', cursor:'pointer', textAlign:'left', background:isActive?'rgba(99,102,241,.1)':'transparent', borderLeft:isActive?'3px solid #6366f1':'3px solid transparent', transition:'all .15s' }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:isActive?'#6366f1':'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:isActive?'#fff':'var(--text-muted)', flexShrink:0 }}><Users size={16}/></div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{g.name}</span>
                          {isAdmin && <Crown size={11} color="#f59e0b"/>}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text-faint)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.members?.length||0} members</div>
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
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-faint)' }}>
          <MessageSquare size={48} style={{ opacity:.2, marginBottom:12 }}/>
          <div style={{ fontSize:15, fontWeight:600 }}>{t('select_staff')}</div>
          <div style={{ fontSize:13, marginTop:4 }}>{t('private_messages')}</div>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          {/* Header */}
          <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
            {isMobile && <button onClick={()=>{setActiveUser(null);setActiveGroup(null);}} style={{ background:'none', border:'none', cursor:'pointer', color:'#6366f1', fontWeight:700, fontSize:13, padding:'4px 8px', borderRadius:6, flexShrink:0 }}>← Back</button>}
            <div style={{ width:34, height:34, borderRadius:activeGroup?10:'50%', background:'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {activeGroup ? <Users size={16}/> : avatar(activeUser?.name)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>{activeGroup?.name || activeUser?.name}</div>
              <div style={{ fontSize:11, color:'var(--text-faint)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {activeGroup ? \`\${activeGroup.members?.length||0} members\` : \`\${activeUser?.role} · \${activeUser?.office}\`}
              </div>
            </div>
            {!isMobile && <button onClick={()=>{setActiveUser(null);setActiveGroup(null);}} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={16}/></button>}
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:6 }}>
            {loading && <div style={{ textAlign:'center', color:'var(--text-faint)', fontSize:13 }}>Loading…</div>}
            {!loading && messages.length===0 && <div style={{ textAlign:'center', color:'var(--text-faint)', fontSize:13, marginTop:40 }}>{t('no_messages')}</div>}
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

          {/* Reply banner */}
          {replyTo && (
            <div style={{ padding:'6px 14px', background:'var(--surface-2)', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
              <Reply size={13} color="#6366f1"/>
              <div style={{ flex:1, fontSize:12, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                <span style={{ fontWeight:600, color:'#6366f1' }}>{t('replying_to')}: </span>{replyTo.text}
              </div>
              <button onClick={()=>setReplyTo(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-faint)' }}><X size={13}/></button>
            </div>
          )}

          {/* Input */}
          <div style={{ borderTop:'1px solid var(--border)', padding:'8px 14px', display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', gap:8 }}>
              <input ref={inputRef} className="form-control" placeholder={\`Message \${activeGroup?.name||activeUser?.name}…\`}
                value={text} onChange={e=>setText(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey)send(e);}}
                style={{ flex:1, fontSize:13 }} autoFocus/>
              <button onClick={send} disabled={!text.trim()||sending} className="btn btn-primary btn-sm"
                style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
                <Send size={13}/>{!isMobile&&' Send'}
              </button>
            </div>
            {!activeGroup && <QuickMsgPanel onSelect={(msg)=>{setText(msg);inputRef.current?.focus();}} allStaff={allStaff} user={user}/>}
          </div>
        </div>
      ))}
    </div>
  );
}
`;
fs.appendFileSync(target, main, 'utf8');
console.log('Done. Size:', fs.statSync(target).size);
