import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import IncomingLetters from './pages/IncomingLetters';
import OutgoingLetters from './pages/OutgoingLetters';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Archive from './pages/Archive';
import Settings from './pages/Settings';
import Tracking from './pages/Tracking';
import Help from './pages/Help';
import Login from './pages/Login';
import RecycleBin from './pages/RecycleBin';
import Campuses from './pages/Campuses';
import ChangePassword from './pages/ChangePassword';
import Inbox from './pages/Inbox';

import Chat from './pages/Chat';

export default function App() {
  const { user, loading } = useApp();

  // Show spinner while restoring session on refresh
  if (loading && !user) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:40, height:40, border:'4px solid #e2e8f0', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
          <div style={{ fontSize:14, color:'#64748b' }}>Loading...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Force password change before accessing any other route
  if (user.mustChangePassword) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="*" element={<Navigate to="/change-password" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="incoming" element={<IncomingLetters />} />
          <Route path="outgoing" element={<OutgoingLetters />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="archive" element={<Archive />} />
          <Route path="settings" element={<Settings />} />
          <Route path="tracking" element={<Tracking />} />
          <Route path="help" element={<Help />} />
          <Route path="profile" element={<Profile />} />
          <Route path="recycle-bin" element={<RecycleBin />} />
          <Route path="campuses" element={<Campuses />} />
          <Route path="chat" element={<Chat />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
