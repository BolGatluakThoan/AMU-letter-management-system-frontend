import { useState } from 'react';
import { Search, MapPin, Clock, CheckCircle, Send, Share2, Mail, AlertTriangle, X, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/index.jsx';

const steps = {
  Registered:    { label: 'Registered',    color: '#6366f1', icon: Mail },
  Forwarded:     { label: 'Forwarded',     color: '#f59e0b', icon: Share2 },
  'Under Review':{ label: 'Under Review',  color: '#0891b2', icon: Clock },
  Responded:     { label: 'Responded',     color: '#10b981', icon: Send },
  Closed:        { label: 'Closed',        color: '#94a3b8', icon: CheckCircle },
  Draft:         { label: 'Draft',         color: '#94a3b8', icon: Clock },
  Approved:      { label: 'Approved',      color: '#0891b2', icon: CheckCircle },
  Sent:          { label: 'Sent',          color: '#6366f1', icon: Send },
  Delivered:     { label: 'Delivered',     color: '#10b981', icon: CheckCircle },
};

const incomingFlow = ['Registered', 'Forwarded', 'Under Review', 'Responded', 'Closed'];
const outgoingFlow = ['Draft', 'Approved', 'Sent', 'Delivered'];

export default function Tracking() {
  const { incoming, outgoing } = useApp();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const search = (e) => {
    e.preventDefault();
    const q = query.trim().toUpperCase();
    if (!q) return;
    const inc = incoming.find(l => l.refNo?.toUpperCase() === q);
    const out = outgoing.find(l => l.refNo?.toUpperCase() === q);
    if (inc) { setResult({ ...inc, _dir: 'incoming' }); setNotFound(false); }
    else if (out) { setResult({ ...out, _dir: 'outgoing' }); setNotFound(false); }
    else { setResult(null); setNotFound(true); }
  };

  const flow = result?._dir === 'incoming' ? incomingFlow : outgoingFlow;
  const currentIdx = result ? flow.indexOf(result.status) : -1;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t('letter_tracking')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>
          Enter a reference number to track the status and history of any letter
        </p>
      </div>

      {/* Search box */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <form onSubmit={search} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input
              className="form-control"
              placeholder="Enter reference number e.g. INC-2026-001 or OUT-2026-001"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ paddingLeft: 44, height: 48, fontSize: 15 }}
              autoFocus
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setResult(null); setNotFound(false); }}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)' }}>
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: 48, padding: '0 28px', fontSize: 14 }}>
            <Search size={16} /> {t('track')}
          </button>
        </form>

        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Quick examples:</span>
          {[...incoming.slice(0, 3), ...outgoing.slice(0, 2)].map(l => (
            <button key={l.refNo} onClick={() => { setQuery(l.refNo); setResult({ ...l, _dir: incoming.includes(l) ? 'incoming' : 'outgoing' }); setNotFound(false); }}
              style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', color: '#6366f1', fontWeight: 600 }}>
              {l.refNo}
            </button>
          ))}
        </div>
      </div>

      {/* Not found */}
      {notFound && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <AlertTriangle size={40} style={{ margin: '0 auto 12px', color: '#f59e0b', display: 'block' }} />
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{t('not_found')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No letter found with reference <strong>{query}</strong>. Check the reference number and try again.</div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          {/* Header card */}
          <div className="card" style={{ marginBottom: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: result._dir === 'incoming' ? '#eef2ff' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {result._dir === 'incoming' ? <Mail size={20} color="#6366f1" /> : <Send size={20} color="#0891b2" />}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{result.refNo}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                      {result._dir === 'incoming' ? 'Incoming Letter' : 'Outgoing Letter'}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{result.subject}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {result._dir === 'incoming'
                    ? `From: ${result.sender} · ${result.senderOrg}`
                    : `To: ${result.recipient} · ${result.recipientOrg}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${result.priority === 'Urgent' ? 'badge-warning' : result.priority === 'Confidential' ? 'badge-danger' : 'badge-gray'}`} style={{ marginBottom: 8, display: 'block' }}>
                  {result.priority}
                </span>
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                  {result.dateReceived || result.datePrepared}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{result.department}</div>
              </div>
            </div>
          </div>

          {/* Progress tracker */}
          <div className="card" style={{ marginBottom: 16, padding: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} color="#6366f1" /> {t('letter_journey')}
            </div>
            <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content' }}>
              {flow.map((status, i) => {
                const done = i <= currentIdx;
                const current = i === currentIdx;
                const step = steps[status];
                const Icon = step?.icon || CheckCircle;
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', flex: i < flow.length - 1 ? 1 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done ? step.color : 'var(--border)',
                        boxShadow: current ? `0 0 0 4px ${step.color}30` : 'none',
                        transition: 'all .3s',
                      }}>
                        <Icon size={18} color={done ? '#fff' : 'var(--text-faint)'} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: current ? 700 : 400, color: done ? step.color : 'var(--text-faint)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {status}
                      </div>
                    </div>
                    {i < flow.length - 1 && (
                      <div style={{ flex: 1, height: 3, background: i < currentIdx ? step.color : 'var(--border)', margin: '0 4px', marginBottom: 28, transition: 'background .3s' }} />
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          </div>

          {/* Details */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{t('letter_details')}</div>
            <div className="grid grid-2" style={{ gap: 16 }}>
              {(result._dir === 'incoming' ? [
                ['Reference No.', result.refNo],
                ['Date Received', result.dateReceived],
                ['Sender', result.sender],
                ['Organization', result.senderOrg],
                ['Department', result.department],
                ['Mode', result.mode],
              ] : [
                ['Reference No.', result.refNo],
                ['Date Prepared', result.datePrepared],
                ['Recipient', result.recipient],
                ['Organization', result.recipientOrg],
                ['Department', result.department],
                ['Dispatch', result.dispatchMethod],
              ]).map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{v || '—'}</div>
                </div>
              ))}
              {result.remarks && (
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Remarks</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{result.remarks}</div>
                </div>
              )}
              {result.trackingNo && (
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Courier Tracking No.</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>{result.trackingNo}</div>
                </div>
              )}
              {result.relatedIncoming && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Related Incoming Ref</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0891b2' }}>{result.relatedIncoming}</div>
                </div>
              )}
              {result.stampedBy && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Dispatched By</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{result.stampedBy} · Record Office</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
