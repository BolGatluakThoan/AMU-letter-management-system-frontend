import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight, Mail, Send, Share2, Archive,
         Users, Settings, Bell, FileText, Search, BookOpen, MessageCircle,
         MessageSquare, Trash2, Clock, LayoutDashboard, MapPin, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/index.jsx';

const TOPICS = [
  { id:'getting-started', icon:BookOpen,      color:'#6366f1', gradient:'linear-gradient(135deg,#6366f1,#8b5cf6)', emoji:'🚀', title:'Getting Started', items:[
    { q:'How do I log in?', a:'Go to the login page and enter your username and password provided by your system administrator. Contact the Record Office if you do not have credentials yet.' },
    { q:'What is my role and what can I do?', a:'Your role determines what you can see and do. The Record Officer is the system administrator with full access. Deans and Directors can manage users in their office. All staff can register letters, use Messages, and view their own office letters.' },
    { q:'How do I change my password?', a:'Go to My Profile (sidebar or top-right avatar) → Change Password tab. Enter your current password, then your new password twice and save. If you forgot your password, contact the Record Officer.' },
    { q:'What if I forget my password?', a:'Contact the Record Officer. They can reset your password from User Management → click the 🔑 key icon next to your name. You will receive a temporary password and must change it on your next login.' },
    { q:'How do I upload a profile photo?', a:'Go to My Profile → Personal Info tab. Click the camera icon on your avatar or the "Upload Photo" button to select an image from your device.' },
    { q:'How do I switch between light and dark mode?', a:'Click the sun/moon icon in the top navigation bar. Your preference is saved automatically and persists across sessions.' },
  ]},
  { id:'dashboard', icon:LayoutDashboard, color:'#0891b2', gradient:'linear-gradient(135deg,#0891b2,#06b6d4)', emoji:'📊', title:'Dashboard', items:[
    { q:'What does the Dashboard show?', a:'The Dashboard shows your key stats: Total Incoming, Total Outgoing, Pending Action letters, and Urgent Unread letters. It also shows a status breakdown chart, recent letters, and quick action buttons.' },
    { q:'What is "Urgent Unread"?', a:'This card counts urgent letters that have been sent to your office but not yet read. When you click it, all urgent letters are automatically marked as read and the count resets to 0. It will go back up only when a new urgent letter arrives.' },
    { q:'How do I act on pending letters from the Dashboard?', a:'Click the "Pending Action" card or the "Review Pending" button in Quick Actions. A modal opens listing all pending letters where you can mark them as Responded or mark as Read.' },
  ]},
  { id:'incoming', icon:Mail,           color:'#6366f1', gradient:'linear-gradient(135deg,#6366f1,#a78bfa)', emoji:'📥', title:'Incoming Letters', items:[
    { q:'How do I register an incoming letter?', a:'Go to Incoming Letters → click "Register Letter". Fill in the sender, subject, department, date received, and priority. Optionally attach a document. Click Register Letter to save. All new letters land in Record Office first for routing.' },
    { q:"Why can't I see some letters?", a:'Letters are private — you only see letters sent TO your office or FROM your office. Record Officers see all letters. If you expect a letter, ask the sender to confirm they addressed it to your office.' },
    { q:'How does the Record Officer dispatch a letter?', a:'Record Officers see an orange banner when letters are waiting. Click the arrow (→) icon on any Registered letter to open the Dispatch modal. Select the destination office, add a note, enter the name of the physical collector, and click Stamp & Dispatch.' },
    { q:'How do I search for a letter?', a:'Use the search bar at the top of the Incoming Letters page. You can search by reference number, sender name, organization, or subject. Use the status and priority dropdowns to filter further.' },
    { q:'How do I know if the recipient read my letter?', a:'In the Incoming Letters table, the "Read" column shows a green "Seen" badge when the recipient office has opened the letter.' },
  ]},
  { id:'outgoing', icon:Send,           color:'#0891b2', gradient:'linear-gradient(135deg,#0891b2,#0ea5e9)', emoji:'📤', title:'Outgoing Letters', items:[
    { q:'How do I send a letter to another office?', a:"Go to Outgoing Letters → Register Letter. Fill in the recipient details, then select the destination from \"Deliver to Internal Office\". The letter will automatically appear in that office's Incoming Letters inbox." },
    { q:'Can I attach a document to an outgoing letter?', a:'Yes. In the Register Letter form, scroll to "Attach Document". You can drag & drop or click to upload any file up to 25 MB. The recipient can view, print, or download it from their inbox.' },
    { q:'How do I search outgoing letters?', a:'Use the search bar on the Outgoing Letters page to search by reference number, recipient name, organization, or subject. Filter by status using the dropdown.' },
    { q:'What does "External / No internal delivery" mean?', a:'If you leave the "Deliver to Internal Office" field empty, the letter is registered as an external outgoing letter (e.g. to a government ministry) and does not create an inbox entry for any internal office.' },
  ]},
  { id:'messages', icon:MessageSquare,  color:'#8b5cf6', gradient:'linear-gradient(135deg,#8b5cf6,#d946ef)', emoji:'💬', title:'Messages (Chat)', items:[
    { q:'How do I start a private chat?', a:'Click "Messages" in the sidebar. All staff members are listed on the left panel. Click any name to open a private conversation. Messages are only visible to you and the recipient.' },
    { q:'How do I send a message?', a:'Type your message in the input box at the bottom of the chat window and press Enter or click Send.' },
    { q:'How do I use Quick Messages?', a:'Click the "✨ Quick Messages" button below the chat input. A panel opens with ready-made messages organized by category: Morning Greetings, Afternoon Greetings, General, For Senior Staff, For Junior Staff, and Ethiopian Holidays. Click "Use" to load a message into the input for editing, or "All" to send it instantly to all colleagues.' },
    { q:'How do I send a message to all colleagues at once?', a:'Open Quick Messages → type in the "Send to ALL colleagues" box at the top and click "Send All". Or click "All" next to any ready-made message to broadcast it to everyone instantly.' },
    { q:'How do I get notified of new messages?', a:'A purple message bell icon appears in the top navigation bar. The badge shows how many unread messages you have across all conversations. It updates every 5 seconds automatically.' },
    { q:'How do I reply to a specific message?', a:'Hover over any message to reveal the ⋯ (three dots) button. Click it and select "Reply". A reply banner appears above the input. Type your reply and send.' },
    { q:'How do I edit or delete a message I sent?', a:'Hover over your sent message to reveal the ⋯ button. Click Edit to modify the text inline, or Delete to remove it. Deleted messages show "This message was deleted" to both parties.' },
    { q:'How do I react to a message with an emoji?', a:'Hover over any message and click the ⋯ button. The emoji row at the top lets you pick a reaction. Click the same emoji again on the reaction badge to remove it.' },
    { q:'How do I know if my message was read?', a:'A single checkmark (✓) means sent. A double checkmark (✓✓) means the recipient has opened the conversation and the message was marked as read.' },
    { q:"Why can't I see all staff in my Messages list?", a:'All registered staff appear in your Messages list regardless of office. If someone is missing, ask the Record Officer to check their account is active in User Management.' },
  ]},
  { id:'archive',  icon:Archive,        color:'#8b5cf6', gradient:'linear-gradient(135deg,#8b5cf6,#6366f1)', emoji:'🗂️', title:'Archive Records', items:[
    { q:'What is the Archive?', a:"The Archive shows all letters (incoming and outgoing) in one place with tabs for All, Incoming, Outgoing, Completed, Urgent, and With Files. It's a reference view for record-keeping." },
    { q:"How do I view a letter's full details in the Archive?", a:'Click the eye icon (👁) on any row, or click anywhere on the row. A full detail modal opens showing all fields, status, and any attached documents.' },
    { q:'Can I export archive records?', a:'Yes. Click "Export CSV" in the top-right of the Archive page to download all currently filtered records as a spreadsheet.' },
    { q:'How do I search the archive?', a:'Use the search bar to find letters by reference number, subject, sender/recipient name, or department. Filter by status and priority using the dropdowns. Use the tab buttons to filter by type.' },
    { q:'How does pagination work?', a:"The archive shows 15 records per page. Use First, Prev, page numbers, Next, and Last buttons at the bottom to navigate. The buttons are disabled when you're already at the first or last page." },
  ]},
  { id:'inbox-system', icon:MessageSquare, color:'#6366f1', gradient:'linear-gradient(135deg,#6366f1,#0891b2)', emoji:'📥', title:'My Inbox', items:[
    { q:'What is My Inbox?', a:'My Inbox is a personal letter inbox separate from the office incoming letters list. Letters are delivered here when the Record Officer explicitly selects you as a recipient during dispatch, or when a CC copy is sent directly to you.' },
    { q:'How is My Inbox different from Incoming Letters?', a:'Incoming Letters shows all letters addressed to your office. My Inbox shows letters specifically directed to you personally — either by name selection during dispatch or via inbox-only delivery mode.' },
    { q:'How do I view a letter in My Inbox?', a:'Click the "View" button on any inbox record. The letter detail opens directly in the inbox — no redirect to incoming letters. You can view attachments and download files from there.' },
    { q:'Does viewing a letter mark it as read?', a:'Yes. Clicking "View" automatically marks the inbox record as read and clears the unread badge.' },
    { q:'Can I delete letters from My Inbox?', a:'No. Inbox records are read-only for recipients. Only the Record Officer can manage inbox records.' },
    { q:'What does the Record Officer see in the Inbox section?', a:'The Record Officer sees two tabs: "My Inbox" (their own) and "All Staff Inboxes" which shows every inbox record across all staff — useful for tracking who received what and when.' },
  ]},
  { id:'recycle',  icon:Trash2,         color:'#ef4444', gradient:'linear-gradient(135deg,#ef4444,#f97316)', emoji:'🗑️', title:'Recycle Bin', items:[    { q:'What is the Recycle Bin?', a:'Deleted letters are moved to the Recycle Bin instead of being permanently removed. They are kept for a retention period (default 30 days) before being auto-purged.' },
    { q:'How do I restore a deleted letter?', a:'Go to Recycle Bin, find the letter, and click the Restore button. The letter returns to its original inbox.' },
    { q:'How do I permanently delete a letter?', a:'In the Recycle Bin, click the permanent delete (trash) icon. This cannot be undone. Record Officers can permanently delete any letter; other users can only delete their own.' },
    { q:'How many days before a deleted letter is auto-purged?', a:'The default retention period is 30 days. Each deleted letter shows a countdown badge (e.g. "7d left"). When it reaches 0, it is automatically and permanently removed.' },
  ]},
  { id:'audit',    icon:Clock,          color:'#f59e0b', gradient:'linear-gradient(135deg,#f59e0b,#fbbf24)', emoji:'🔍', title:'Audit Log', items:[
    { q:'What is the Audit Log?', a:'The Audit Log records every delete, restore, and permanent delete action performed in the system — who did it, which letter, from which office, and when.' },
    { q:'Who can see the Audit Log?', a:'Only the Record Officer (system administrator) can access the Audit Log. It is found in Settings → Audit Log tab.' },
    { q:'Can I restore a letter from the Audit Log?', a:'Yes. Click the eye icon on any "deleted" audit entry. A detail modal opens. If the letter is still in the Recycle Bin, a "Restore Item" button appears. If it has already been permanently deleted, the modal will say so.' },
  ]},
  { id:'tracking', icon:MapPin,         color:'#f59e0b', gradient:'linear-gradient(135deg,#f59e0b,#10b981)', emoji:'📍', title:'Tracking', items:[
    { q:'How do I track a letter?', a:"Go to Tracking in the sidebar. Enter the reference number (e.g. INC-2026-001 or OUT-2026-001) and click Track. You'll see the full journey with a visual progress tracker." },
    { q:'What do the status steps mean?', a:'Registered → letter received and logged. Forwarded → sent to another office. Under Review → being reviewed. Responded → reply sent. Closed → fully resolved. For outgoing: Draft → Approved → Sent → Delivered.' },
  ]},
  { id:'campuses', icon:Building2,      color:'#10b981', gradient:'linear-gradient(135deg,#10b981,#059669)', emoji:'🏛️', title:'Campuses', items:[
    { q:'What does the Campuses page show?', a:'The Campuses page lists all Arba Minch University campuses and their associated offices. It gives an overview of the university structure for reference when routing letters.' },
    { q:'Can I add or edit campus information?', a:'Campus information is managed by the Record Officer through the system configuration. Contact the Record Officer if campus details need to be updated.' },
  ]},
  { id:'notifications', icon:Bell,      color:'#ef4444', gradient:'linear-gradient(135deg,#ef4444,#ec4899)', emoji:'🔔', title:'Notifications', items:[
    { q:'When do I get a letter notification?', a:'You receive a bell notification (top navbar) when a letter is sent directly TO your office. Record Officers are notified of all unrouted letters waiting in the Record Office inbox.' },
    { q:'When do I get a chat notification?', a:'A purple message icon in the top navbar shows your unread chat count. It updates every 5 seconds. Click it to go directly to Messages.' },
    { q:'How do I mark letter notifications as read?', a:'Click any notification to open the letter — it is automatically marked as read. Or click "Mark all read" in the notification dropdown header.' },
    { q:'The notification badge shows a number — what does it mean?', a:'The red badge on the bell = unread letters in your inbox. The purple badge on the message icon = unread chat messages. Both decrease as you open them.' },
  ]},
  { id:'users',    icon:Users,          color:'#10b981', gradient:'linear-gradient(135deg,#10b981,#0891b2)', emoji:'👥', title:'User Management', items:[
    { q:'Who can add users?', a:'The Record Officer (system administrator) can add users across all offices. Deans and Directors can add users within their own office only.' },
    { q:'How do I add a new user?', a:'Go to User Management in the sidebar → click "Add User". Fill in the name, username, password, email, role, and office. The user can log in immediately with those credentials.' },
    { q:'Can I delete a user?', a:'Yes, click the trash icon next to any user. You cannot delete your own account. Deleted users lose access immediately.' },
    { q:'Why does a new user not appear in Messages?', a:'All active users automatically appear in the Messages staff list. If a user is missing, ensure their account was saved correctly in User Management.' },
    { q:'How do I reset a staff member\'s password?', a:'Go to User Management → click the 🔑 key icon next to the user → click "Generate & Reset Password". A temporary password is generated and shown. The staff member will be required to change it on their next login.' },
    { q:'How do I grant password reset rights to a staff member?', a:'Go to User Management → click the toggle icon (⬜/🟦) next to the user to enable or disable their canResetPassword permission. Users with this permission can reset passwords for other staff.' },
  ]},
  { id:'settings', icon:Settings,       color:'#64748b', gradient:'linear-gradient(135deg,#64748b,#475569)', emoji:'⚙️', title:'Settings', items:[
    { q:'Who can change system settings?', a:'Only the Record Officer (system administrator) can edit system-wide settings such as Organization details, Letter Configuration, Security Policy, Backup, and Audit Log. Other users can view settings but not change them.' },
    { q:'Where is the Audit Log in Settings?', a:'Log in as Record Officer → go to Settings → scroll to the bottom of the left sidebar and click "Audit Log". This tab is only visible to the Record Officer.' },
    { q:'Where are my personal notification preferences?', a:'Go to Settings → Notification Configuration. You can toggle bell notifications, email alerts, and what events trigger notifications.' },
    { q:'How do I perform a manual backup?', a:'Go to Settings → Backup & Maintenance → click "Download Backup". Note: full backup requires server-side configuration by the system administrator.' },
    { q:'How do I add or manage Offices and Departments?', a:'Go to Settings → Offices & Departments (Record Officer only). You can add new offices by typing the name and clicking "+ Add Office". Add departments the same way and optionally link them to an office. These will appear in the user registration form and user profiles.' },
    { q:'How do I remove an office or department?', a:'Go to Settings → Offices & Departments → click the × button next to the office or department you want to remove. Note: the server must be running with the latest version for this to work.' },
  ]},
];

function FAQItem({ q, a, color }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ borderRadius:12, marginBottom:10, border:`1px solid ${open?color+'40':'var(--border)'}`, overflow:'hidden', transition:'border-color .2s, box-shadow .2s', boxShadow:open?`0 4px 20px ${color}18`:hovered?'0 2px 8px rgba(0,0,0,.06)':'none' }}>
      <button onClick={()=>setOpen(v=>!v)} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, width:'100%', padding:'14px 18px', background:open?`${color}08`:hovered?'rgba(0,0,0,.02)':'transparent', border:'none', cursor:'pointer', textAlign:'left', borderLeft:`4px solid ${open?color:'transparent'}`, transition:'all .2s' }}>
        <span style={{ fontSize:14, fontWeight:600, color:open?color:'var(--text)', lineHeight:1.4, flex:1 }}>{q}</span>
        <span style={{ width:26, height:26, borderRadius:'50%', flexShrink:0, background:open?color:'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}>
          <ChevronDown size={14} color={open?'#fff':'var(--text-faint)'} style={{ transform:open?'rotate(0deg)':'rotate(-90deg)', transition:'transform .2s' }}/>
        </span>
      </button>
      {open && (
        <div style={{ padding:'4px 18px 18px 22px', background:`${color}06`, borderLeft:`4px solid ${color}` }}>
          <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.85, margin:0, paddingTop:10 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

function ContactAdmin() {
  const { user, isRecordOfficer, addIncoming } = useApp();
  const { t } = useI18n();
  const [form, setForm] = useState({ name:user?.name||'', email:user?.email||'', subject:'', message:'' });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);
  if (isRecordOfficer) return null;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Name is required';
    if (!form.email.trim())   e.email   = 'Email is required';
    else if (!EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.message.trim()) e.message = 'Message is required';
    setErrors(e); return Object.keys(e).length === 0;
  };
  const handleSend = async (ev) => {
    ev.preventDefault(); if (!validate()) return;
    await addIncoming({ sender:form.name, senderOrg:user?.office||'Unknown Office', subject:`[Support Request] ${form.subject}`, department:'Record Office', priority:'Normal', mode:'Internal', dateReceived:new Date().toISOString().slice(0,10), status:'Registered', remarks:`From: ${form.email}\n\n${form.message}`, attachments:[] });
    setSent(true); setTimeout(()=>{ setSent(false); setOpen(false); setForm(p=>({...p,subject:'',message:''})); },3000);
  };
  const f = (k,v) => { setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:''})); };
  return (
    <div style={{ marginTop:24, borderRadius:20, overflow:'hidden', background:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#0891b2 100%)', boxShadow:'0 8px 32px rgba(99,102,241,.25)' }}>
      <div style={{ padding:'28px 28px 24px', display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
        <div style={{ width:56, height:56, borderRadius:16, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, backdropFilter:'blur(8px)' }}>
          <MessageCircle size={26} color="#fff"/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:4 }}>Still stuck? We've got you! 🙌</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.8)', lineHeight:1.5 }}>Send a message directly to the Record Office — they'll get back to you fast.</div>
        </div>
        <button onClick={()=>setOpen(v=>!v)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 22px', background:'#fff', border:'none', borderRadius:12, cursor:'pointer', fontSize:14, fontWeight:700, color:'#6366f1', boxShadow:'0 4px 12px rgba(0,0,0,.15)', transition:'transform .15s, box-shadow .15s' }}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 6px 18px rgba(0,0,0,.2)';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,.15)';}}>
          <Mail size={15}/> {open?'Close Form':t('contact_admin')}
        </button>
      </div>
      {open && (
        <div style={{ background:'var(--surface)', margin:'0 4px 4px', borderRadius:16, padding:24 }}>
          {sent ? (
            <div style={{ textAlign:'center', padding:'28px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:17, fontWeight:800, color:'#10b981', marginBottom:6 }}>Message sent to Record Office!</div>
              <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>The Record Officer will see your request in their inbox.<br/>You can also reach them via Messages anytime.</div>
            </div>
          ) : (
            <form onSubmit={handleSend} noValidate>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:18, color:'var(--text)' }}>📝 Tell us what's going on</div>
              <div className="grid grid-2" style={{ gap:14, marginBottom:14 }}>
                <div className="form-group">
                  <label className="form-label">Your Name *</label>
                  <input className="form-control" value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Full name" style={{ borderColor:errors.name?'#ef4444':undefined }}/>
                  {errors.name&&<div style={{ fontSize:11, color:'#ef4444', marginTop:3 }}>{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Your Email *</label>
                  <input className="form-control" type="email" value={form.email} onChange={e=>f('email',e.target.value)} placeholder="your@email.com" style={{ borderColor:errors.email?'#ef4444':undefined }}/>
                  {errors.email&&<div style={{ fontSize:11, color:'#ef4444', marginTop:3 }}>{errors.email}</div>}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom:14 }}>
                <label className="form-label">Subject *</label>
                <input className="form-control" value={form.subject} onChange={e=>f('subject',e.target.value)} placeholder="Brief description of your issue" style={{ borderColor:errors.subject?'#ef4444':undefined }}/>
                {errors.subject&&<div style={{ fontSize:11, color:'#ef4444', marginTop:3 }}>{errors.subject}</div>}
              </div>
              <div className="form-group" style={{ marginBottom:20 }}>
                <label className="form-label">Message *</label>
                <textarea className="form-control" rows={4} value={form.message} onChange={e=>f('message',e.target.value)} placeholder="Describe your issue in detail..." style={{ borderColor:errors.message?'#ef4444':undefined }}/>
                {errors.message&&<div style={{ fontSize:11, color:'#ef4444', marginTop:3 }}>{errors.message}</div>}
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }}><Mail size={13}/> Send to Admin</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function Help() {
  const { isRecordOfficer } = useApp();
  const { t } = useI18n();
  const [active, setActive] = useState('getting-started');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const topic = TOPICS.find(tp => tp.id === active);
  const searchResults = search.trim()
    ? TOPICS.flatMap(tp => tp.items.filter(i => i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase())).map(i => ({ ...i, topic:tp.title, color:tp.color, gradient:tp.gradient, emoji:tp.emoji })))
    : [];

  return (
    <div style={{ maxWidth:1100, margin:'0 auto' }}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .help-fade { animation: fadeSlideIn .3s ease both; }
        @media(max-width:640px){ .topic-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ borderRadius:24, overflow:'hidden', marginBottom:28, background:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 40%,#0891b2 100%)', boxShadow:'0 12px 40px rgba(79,70,229,.3)', position:'relative' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-60, left:60, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }}/>
        <div style={{ padding:'40px 36px 36px', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <span style={{ fontSize:32 }}>🤝</span>
            <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.7)', letterSpacing:2, textTransform:'uppercase' }}>Help Center</span>
          </div>
          <h1 style={{ fontSize:28, fontWeight:900, color:'#fff', margin:'0 0 6px', lineHeight:1.2, WebkitTextFillColor:'#fff', backgroundClip:'unset', background:'none' }}>
            {t('how_can_we_help')}
          </h1>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.75)', margin:'0 0 24px', lineHeight:1.6 }}>
            Everything you need to master the AMU Letter Management System. You've got this 💪
          </p>
          <div style={{ position:'relative', maxWidth:560 }}>
            <Search size={18} style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:searchFocused?'#6366f1':'#94a3b8', transition:'color .2s' }}/>
            <input className="form-control" placeholder="Search questions, topics, features…" value={search}
              onChange={e=>setSearch(e.target.value)} onFocus={()=>setSearchFocused(true)} onBlur={()=>setSearchFocused(false)}
              style={{ paddingLeft:48, paddingRight:16, height:50, fontSize:15, background:'#fff', color:'#0f172a', borderRadius:14, border:'none', boxShadow:searchFocused?'0 0 0 3px rgba(99,102,241,.4)':'0 4px 16px rgba(0,0,0,.15)', transition:'box-shadow .2s' }}/>
            {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'#e2e8f0', border:'none', borderRadius:'50%', width:22, height:22, cursor:'pointer', fontSize:12, color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>}
          </div>
          <div style={{ display:'flex', gap:20, marginTop:20, flexWrap:'wrap' }}>
            {[{label:'Topics',value:TOPICS.length,emoji:'📚'},{label:'Articles',value:TOPICS.reduce((s,tp)=>s+tp.items.length,0),emoji:'📄'},{label:'Always available',value:'24/7',emoji:'⚡'}].map(s=>(
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:16 }}>{s.emoji}</span>
                <span style={{ fontSize:13, color:'rgba(255,255,255,.9)', fontWeight:700 }}>{s.value}</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.6)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search Results ── */}
      {search && (
        <div className="help-fade" style={{ marginBottom:24 }}>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14, fontWeight:600 }}>
            {searchResults.length>0 ? `✨ Found ${searchResults.length} result${searchResults.length!==1?'s':''} for "${search}"` : `😕 No results for "${search}" — try different keywords`}
          </div>
          {searchResults.length===0 ? (
            <div style={{ borderRadius:16, padding:'32px 24px', textAlign:'center', background:'var(--surface)', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Nothing found</div>
              <div style={{ fontSize:13, color:'var(--text-muted)' }}>Try searching for "login", "letter", "archive", or "messages"</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {searchResults.map((r,i)=>(
                <div key={i} className="help-fade" style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${r.color}30`, background:'var(--surface)', boxShadow:`0 2px 12px ${r.color}12`, animationDelay:`${i*.04}s` }}>
                  <div style={{ height:4, background:r.gradient }}/>
                  <div style={{ padding:'16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:14 }}>{r.emoji}</span>
                      <span style={{ fontSize:11, fontWeight:800, color:r.color, textTransform:'uppercase', letterSpacing:1.2 }}>{r.topic}</span>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:8, lineHeight:1.4 }}>{r.q}</div>
                    <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.75 }}>{r.a}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Topic Grid + FAQ ── */}
      {!search && (
        <>
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:12, fontWeight:800, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:2, marginBottom:14 }}>📚 Browse by Topic</div>
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {TOPICS.map(tp=>(
                <button key={tp.id} onClick={()=>setActive(tp.id)} style={{
                  display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px',
                  border:'none', cursor:'pointer', textAlign:'left', borderRadius:10,
                  background:active===tp.id?tp.gradient:'transparent',
                  borderLeft:active===tp.id?'none':'3px solid transparent',
                  boxShadow:active===tp.id?`0 4px 14px ${tp.color}30`:'none',
                  transition:'all .2s',
                }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{tp.emoji}</span>
                  <span style={{ flex:1, fontSize:13, fontWeight:active===tp.id?700:500, color:active===tp.id?'#fff':'var(--text-muted)' }}>{tp.title}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:active===tp.id?'rgba(255,255,255,.7)':'var(--text-faint)' }}>{tp.items.length}</span>
                </button>
              ))}
            </div>
          </div>

          {topic && (
            <div className="help-fade" key={active}>
              <div style={{ borderRadius:16, padding:'20px 24px', marginBottom:16, background:topic.gradient, boxShadow:`0 6px 24px ${topic.color}30`, display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, backdropFilter:'blur(8px)' }}>
                  <topic.icon size={22} color="#fff"/>
                </div>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:2 }}>{topic.emoji} {topic.title}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.75)' }}>{topic.items.length} helpful articles — we're here to help! 🌟</div>
                </div>
              </div>
              <div style={{ marginBottom:8 }}>
                {topic.items.map((item,i)=><FAQItem key={i} q={item.q} a={item.a} color={topic.color}/>)}
              </div>
              <ContactAdmin/>
            </div>
          )}
        </>
      )}
    </div>
  );
}
