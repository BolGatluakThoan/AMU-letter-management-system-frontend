import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Printer, Mail, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';

const statusColor = {
  Registered: 'badge-primary', Forwarded: 'badge-info', 'Under Review': 'badge-warning',
  Responded: 'badge-success', Closed: 'badge-gray',
  Draft: 'badge-gray', Approved: 'badge-info', Sent: 'badge-primary', Delivered: 'badge-success',
};
const priorityColor = { Normal: 'badge-gray', Urgent: 'badge-warning', Confidential: 'badge-danger' };

export default function LetterDetail({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { incoming, outgoing } = useApp();
  const isIncoming = type === 'incoming';
  const data = isIncoming ? incoming : outgoing;
  const letter = data.find(l => l.id === id || l.id === Number(id));

  if (!letter) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <p style={{ color: '#64748b', marginBottom: 16 }}>Letter not found.</p>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Go Back
        </button>
      </div>
    );
  }

  const fields = isIncoming
    ? [
        ['Reference No.', letter.refNo],
        ['Date Received', letter.dateReceived],
        ['Sender', letter.sender],
        ['Organization', letter.senderOrg],
        ['Department', letter.department],
        ['Mode of Delivery', letter.mode],
        ['Subject', letter.subject, true],
        ['Remarks', letter.remarks || '—', true],
      ]
    : [
        ['Reference No.', letter.refNo],
        ['Date Prepared', letter.datePrepared],
        ['Recipient', letter.recipient],
        ['Organization', letter.recipientOrg],
        ['Department', letter.department],
        ['Dispatch Method', letter.dispatchMethod],
        ['Responsible Officer', letter.responsibleOfficer],
        ['Tracking No.', letter.trackingNo || '—'],
        ['Related Incoming', letter.relatedIncoming || '—'],
        ['Subject', letter.subject, true],
      ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>{letter.refNo}</h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>{isIncoming ? 'Incoming' : 'Outgoing'} Letter Details</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
            <Printer size={14} /> Print
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(isIncoming ? '/incoming' : '/outgoing')}>
            <Edit2 size={14} /> Edit
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        {/* Main details */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isIncoming ? <Mail size={16} color="#1e40af" /> : <Send size={16} color="#0891b2" />}
              <span style={{ fontWeight: 600 }}>Letter Information</span>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-2" style={{ gap: 20 }}>
              {fields.map(([key, val, full]) => (
                <div key={key} style={full ? { gridColumn: '1 / -1' } : {}}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>{key}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 600, fontSize: 14 }}>Status</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Current Status</div>
                <span className={`badge ${statusColor[letter.status]}`} style={{ fontSize: 13, padding: '4px 14px' }}>{letter.status}</span>
              </div>
              {isIncoming && (
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Priority</div>
                  <span className={`badge ${priorityColor[letter.priority]}`} style={{ fontSize: 13, padding: '4px 14px' }}>{letter.priority}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 600, fontSize: 14 }}>Actions</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }}
                onClick={() => navigate(isIncoming ? '/incoming' : '/outgoing')}>
                <Edit2 size={14} /> Edit Letter
              </button>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }}
                onClick={() => navigate(-1)}>
                <ArrowLeft size={14} /> Back to List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
