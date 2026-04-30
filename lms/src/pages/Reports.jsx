import { useState, useMemo } from 'react';
import { Mail, Send, CheckCircle, Clock, AlertTriangle, TrendingUp, TrendingDown, BarChart2, PieChart, Activity, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/index.jsx';
import StatCard from '../components/StatCard';

// ── date helpers ──────────────────────────────────────────────────────────────
function startOf(period) {
  const now = new Date();
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === 'year') {
    return new Date(now.getFullYear(), 0, 1);
  }
  return null; // all time
}

function filterByPeriod(letters, period, dateField) {
  const from = startOf(period);
  if (!from) return letters;
  return letters.filter(l => {
    const d = new Date(l[dateField]);
    return !isNaN(d) && d >= from;
  });
}

// Build daily counts for the last N days
function dailyCounts(letters, dateField, days) {
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dateStr = d.toISOString().slice(0, 10);
    const value = letters.filter(l => (l[dateField] || '').slice(0, 10) === dateStr).length;
    result.push({ label, value });
  }
  return result;
}

// Build monthly counts for the last N months
function monthlyCounts(letters, dateField, months) {
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const value = letters.filter(l => {
      const ld = new Date(l[dateField]);
      return !isNaN(ld) && ld.getFullYear() === d.getFullYear() && ld.getMonth() === d.getMonth();
    }).length;
    result.push({ label, value });
  }
  return result;
}

// Build yearly counts
function yearlyCounts(letters, dateField) {
  const yearMap = {};
  letters.forEach(l => {
    const d = new Date(l[dateField]);
    if (!isNaN(d)) { const y = String(d.getFullYear()); yearMap[y] = (yearMap[y] || 0) + 1; }
  });
  return Object.entries(yearMap).sort().map(([label, value]) => ({ label, value }));
}

// ── SVG Pie Chart ─────────────────────────────────────────────────────────────
function PieChartSVG({ data, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--border)' }} />;
  let angle = -90;
  const cx = size / 2, cy = size / 2, r = size / 2 - 10;
  const slices = data.map(d => {
    const pct = d.value / total;
    const start = angle;
    angle += pct * 360;
    return { ...d, pct, start, end: angle };
  });
  const arc = (cx, cy, r, s, e) => {
    const sr = (s * Math.PI) / 180, er = (e * Math.PI) / 180;
    const x1 = cx + r * Math.cos(sr), y1 = cy + r * Math.sin(sr);
    const x2 = cx + r * Math.cos(er), y2 = cy + r * Math.sin(er);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${e - s > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => (
        <path key={i} d={arc(cx, cy, r, s.start, s.end)} fill={s.color} opacity={0.9}
          onMouseEnter={e => e.target.setAttribute('opacity', '1')}
          onMouseLeave={e => e.target.setAttribute('opacity', '0.9')}>
          <title>{s.label}: {s.value} ({(s.pct * 100).toFixed(1)}%)</title>
        </path>
      ))}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--surface)" />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight={800} fill="var(--text)">{total}</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize={9} fill="var(--text-faint)">Total</text>
    </svg>
  );
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function BarChartSVG({ data, height = 140, inColor = '#6366f1', outColor = '#0891b2', dual = false }) {
  if (!data || data.length === 0) return null;
  const maxVal  = Math.max(1, ...data.map(d => dual ? Math.max(d.in || 0, d.out || 0) : d.value));
  const BAR_W   = dual ? 32 : 40;
  const GAP     = 10;
  const LABEL_H = 72; // space reserved below bars for rotated labels
  const chartH  = height;
  const barsH   = chartH - LABEL_H - 20; // usable bar height
  const totalW  = Math.max(data.length * (BAR_W + GAP) + GAP, 300);

  return (
    <div className="chart-scroll">
      <svg width={totalW} height={chartH + LABEL_H} style={{ display: 'block' }}>
        {data.map((d, i) => {
          const gx = i * (BAR_W + GAP) + GAP;
          const cx = gx + BAR_W / 2;

          if (dual) {
            const inH  = ((d.in  || 0) / maxVal) * barsH;
            const outH = ((d.out || 0) / maxVal) * barsH;
            const hw   = (BAR_W - 4) / 2;
            return (
              <g key={i}>
                <rect x={gx}          y={chartH - inH  - LABEL_H} width={hw} height={Math.max(inH,  1)} fill={inColor}  rx={2} opacity={0.85}><title>Incoming: {d.in}</title></rect>
                <rect x={gx + hw + 4} y={chartH - outH - LABEL_H} width={hw} height={Math.max(outH, 1)} fill={outColor} rx={2} opacity={0.85}><title>Outgoing: {d.out}</title></rect>
                {d.in  > 0 && <text x={gx + hw / 2}          y={chartH - inH  - LABEL_H - 3} textAnchor="middle" fontSize={9} fill={inColor}  fontWeight={700}>{d.in}</text>}
                {d.out > 0 && <text x={gx + hw + 4 + hw / 2} y={chartH - outH - LABEL_H - 3} textAnchor="middle" fontSize={9} fill={outColor} fontWeight={700}>{d.out}</text>}
                <text
                  x={cx} y={chartH - LABEL_H + 6}
                  textAnchor="end" fontSize={10} fill="var(--text-muted)"
                  transform={`rotate(-45, ${cx}, ${chartH - LABEL_H + 6})`}
                >{d.label}</text>
              </g>
            );
          }

          const bh = (d.value / maxVal) * barsH;
          return (
            <g key={i}>
              <rect x={gx} y={chartH - bh - LABEL_H} width={BAR_W} height={Math.max(bh, 1)} fill={d.color || inColor} rx={2} opacity={0.85}>
                <title>{d.label}: {d.value}</title>
              </rect>
              {d.value > 0 && <text x={cx} y={chartH - bh - LABEL_H - 3} textAnchor="middle" fontSize={9} fill="var(--text-muted)" fontWeight={700}>{d.value}</text>}
              <text
                x={cx} y={chartH - LABEL_H + 6}
                textAnchor="end" fontSize={10} fill="var(--text-muted)"
                transform={`rotate(-45, ${cx}, ${chartH - LABEL_H + 6})`}
              >{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HBar({ label, value, max, color, total }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const share = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{value}</span>
          <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{share}%</span>
        </div>
      </div>
      <div style={{ height: 7, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, background: color, width: pct + '%', transition: 'width .6s ease' }} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
  { key: 'all',   label: 'All Time' },
];

export default function Reports() {
  const navigate = useNavigate();
  const { incoming, outgoing } = useApp();
  const { t } = useI18n();
  const [period, setPeriod] = useState('month');

  const stats = useMemo(() => {
    // Exclude auto-delivered CC copies from incoming counts — they inflate the number
    const realIncoming = incoming.filter(l => !l._autoDelivered);
    const filtIn  = filterByPeriod(realIncoming, period, 'dateReceived');
    const filtOut = filterByPeriod(outgoing, period, 'datePrepared');

    const totalIn  = filtIn.length;
    const totalOut = filtOut.length;
    const pending  = filtIn.filter(l => ['Registered','Forwarded','Under Review'].includes(l.status)).length;
    const resolved = filtIn.filter(l => ['Responded','Closed'].includes(l.status)).length;
    const urgent   = filtIn.filter(l => l.priority === 'Urgent').length;
    const confidential = filtIn.filter(l => l.priority === 'Confidential').length;
    const withFiles = [...filtIn, ...filtOut].filter(l => l.attachment || (l.attachments?.length > 0)).length;
    const withCC    = filtOut.filter(l => (l.copies||[]).length > 0).length;
    const totalCC   = filtOut.reduce((s, l) => s + (l.copies||[]).length, 0);
    const resPct = totalIn > 0 ? Math.round((resolved / totalIn) * 100) : 0;

    const statusData = [
      { label: 'Registered', value: filtIn.filter(l=>l.status==='Registered').length, color: '#6366f1' },
      { label: 'Forwarded',  value: filtIn.filter(l=>l.status==='Forwarded').length,  color: '#06b6d4' },
      { label: 'In Review',  value: filtIn.filter(l=>l.status==='Under Review').length,color: '#f59e0b' },
      { label: 'Responded',  value: filtIn.filter(l=>l.status==='Responded').length,  color: '#10b981' },
      { label: 'Closed',     value: filtIn.filter(l=>l.status==='Closed').length,     color: '#94a3b8' },
    ];
    const priorityData = [
      { label: 'Normal',       value: filtIn.filter(l=>l.priority==='Normal').length,       color: '#6366f1' },
      { label: 'Urgent',       value: urgent,                                                color: '#ef4444' },
      { label: 'Confidential', value: confidential,                                          color: '#8b5cf6' },
    ];
    const outStatusData = [
      { label: 'Draft',     value: filtOut.filter(l=>l.status==='Draft').length,     color: '#94a3b8' },
      { label: 'Approved',  value: filtOut.filter(l=>l.status==='Approved').length,  color: '#06b6d4' },
      { label: 'Sent',      value: filtOut.filter(l=>l.status==='Sent').length,      color: '#6366f1' },
      { label: 'Delivered', value: filtOut.filter(l=>l.status==='Delivered').length, color: '#10b981' },
    ];

    const deptMap = {};
    [...filtIn, ...filtOut].forEach(l => { const d = l.department||'Unknown'; deptMap[d]=(deptMap[d]||0)+1; });
    const deptData = Object.entries(deptMap).sort((a,b)=>b[1]-a[1]).slice(0,8)
      .map(([label,value],i) => ({ label, value, color: ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#0891b2','#f97316'][i%8] }));
    const maxDept = Math.max(1, ...deptData.map(d=>d.value));

    // Trend chart data — dual bars (incoming + outgoing)
    let trendData = [];
    if (period === 'today') {
      // hourly buckets for today
      const hours = Array.from({ length: 24 }, (_, h) => {
        const label = h + ':00';
        const inCount  = filtIn.filter(l => new Date(l.dateReceived).getHours() === h).length;
        const outCount = filtOut.filter(l => new Date(l.datePrepared).getHours() === h).length;
        return { label, in: inCount, out: outCount };
      }).filter(d => d.in > 0 || d.out > 0);
      trendData = trendData.length ? trendData : hours.length ? hours : [{ label: 'Today', in: totalIn, out: totalOut }];
    } else if (period === 'week') {
      trendData = dailyCounts(realIncoming, 'dateReceived', 7).map((d, i) => ({
        label: d.label,
        in: d.value,
        out: dailyCounts(outgoing, 'datePrepared', 7)[i]?.value || 0,
      }));
    } else if (period === 'month') {
      trendData = dailyCounts(realIncoming, 'dateReceived', 30).map((d, i) => ({
        label: d.label,
        in: d.value,
        out: dailyCounts(outgoing, 'datePrepared', 30)[i]?.value || 0,
      }));
    } else if (period === 'year') {
      trendData = monthlyCounts(realIncoming, 'dateReceived', 12).map((d, i) => ({
        label: d.label,
        in: d.value,
        out: monthlyCounts(outgoing, 'datePrepared', 12)[i]?.value || 0,
      }));
    } else {
      // all time — yearly
      const inYears  = yearlyCounts(realIncoming, 'dateReceived');
      const outYears = yearlyCounts(outgoing, 'datePrepared');
      const allYears = [...new Set([...inYears.map(d=>d.label), ...outYears.map(d=>d.label)])].sort();
      trendData = allYears.map(y => ({
        label: y,
        in:  inYears.find(d=>d.label===y)?.value  || 0,
        out: outYears.find(d=>d.label===y)?.value || 0,
      }));
    }

    return { totalIn, totalOut, pending, resolved, urgent, confidential, withFiles, withCC, totalCC, resPct, statusData, priorityData, outStatusData, deptData, maxDept, trendData };
  }, [incoming, outgoing, period]);

  const periodLabel = PERIODS.find(p => p.key === period)?.label || '';

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700 }}>{t('reports_analytics')}</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:3 }}>
            {t('showing_data')}: <strong>{periodLabel}</strong>
          </p>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={{
              padding:'6px 14px', borderRadius:7, border:'1.5px solid var(--border)', cursor:'pointer', fontSize:12, fontWeight:600,
              background: period===p.key ? '#1e40af' : 'var(--surface)', color: period===p.key ? '#fff' : 'var(--text-muted)',
              display:'flex', alignItems:'center', gap:5,
            }}>
              {p.key === 'today' && <Calendar size={12}/>} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards — clickable to navigate */}
      <div className="grid grid-4" style={{ marginBottom:24 }}>
        <StatCard label={t('total_incoming')} value={stats.totalIn}  icon={Mail}         color="#6366f1" sub={periodLabel} trend={12} onClick={() => navigate('/incoming')} />
        <StatCard label={t('total_outgoing')} value={stats.totalOut} icon={Send}         color="#0891b2" sub={periodLabel} trend={8}  onClick={() => navigate('/outgoing')} />
        <StatCard label={t('pending_action')} value={stats.pending}  icon={Clock}        color="#f59e0b" sub="Awaiting response" trend={-5} onClick={() => navigate('/incoming')} />
        <StatCard label={t('resolved')}       value={stats.resolved} icon={CheckCircle}  color="#10b981" sub={stats.resPct + '% rate'} trend={15} onClick={() => navigate('/archive')} />
      </div>

      {/* Trend chart — dual bar incoming vs outgoing */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Activity size={16} color="#6366f1" />
            <span style={{ fontWeight:700, fontSize:14 }}>Incoming vs Outgoing — {periodLabel}</span>
          </div>
          <div style={{ display:'flex', gap:16, fontSize:11 }}>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:'#6366f1', display:'inline-block' }}/> Incoming</span>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:'#0891b2', display:'inline-block' }}/> Outgoing</span>
          </div>
        </div>
        <div className="card-body">
          {stats.trendData.length === 0
            ? <div style={{ textAlign:'center', padding:40, color:'var(--text-faint)', fontSize:13 }}>No data for this period</div>
            : <BarChartSVG data={stats.trendData} height={160} dual inColor="#6366f1" outColor="#0891b2" />
          }
        </div>
      </div>

      {/* Pie charts row */}
      <style>{`@media(max-width:700px){.reports-pie{grid-template-columns:1fr !important}.reports-dept{grid-template-columns:1fr !important}}`}</style>
      <div className="reports-pie" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:20 }}>
        <div className="card">
          <div className="card-header"><div style={{ display:'flex', alignItems:'center', gap:8 }}><PieChart size={15} color="#6366f1"/><span style={{ fontWeight:700, fontSize:14 }}>{t('incoming_by_status')}</span></div></div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
            <PieChartSVG data={stats.statusData} />
            <div style={{ width:'100%' }}>{stats.statusData.map(d=>(
              <div key={d.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:9, height:9, borderRadius:2, background:d.color }}/><span style={{ fontSize:12, color:'var(--text-muted)' }}>{d.label}</span></div>
                <span style={{ fontSize:12, fontWeight:700 }}>{d.value}</span>
              </div>
            ))}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div style={{ display:'flex', alignItems:'center', gap:8 }}><AlertTriangle size={15} color="#f59e0b"/><span style={{ fontWeight:700, fontSize:14 }}>{t('priority_dist')}</span></div></div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
            <PieChartSVG data={stats.priorityData} />
            <div style={{ width:'100%' }}>{stats.priorityData.map(d=>(
              <div key={d.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:9, height:9, borderRadius:2, background:d.color }}/><span style={{ fontSize:12, color:'var(--text-muted)' }}>{d.label}</span></div>
                <span style={{ fontSize:12, fontWeight:700 }}>{d.value}</span>
              </div>
            ))}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div style={{ display:'flex', alignItems:'center', gap:8 }}><Send size={15} color="#0891b2"/><span style={{ fontWeight:700, fontSize:14 }}>{t('outgoing_by_status')}</span></div></div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
            <PieChartSVG data={stats.outStatusData} />
            <div style={{ width:'100%' }}>{stats.outStatusData.map(d=>(
              <div key={d.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:9, height:9, borderRadius:2, background:d.color }}/><span style={{ fontSize:12, color:'var(--text-muted)' }}>{d.label}</span></div>
                <span style={{ fontSize:12, fontWeight:700 }}>{d.value}</span>
              </div>
            ))}</div>
          </div>
        </div>
      </div>

      {/* Department + resolution */}
      <div className="reports-dept" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>
        <div className="card">
          <div className="card-header"><div style={{ display:'flex', alignItems:'center', gap:8 }}><BarChart2 size={15} color="#6366f1"/><span style={{ fontWeight:700, fontSize:14 }}>{t('letters_by_dept')}</span></div></div>
          <div className="card-body">
            <div style={{ marginBottom:14 }}><BarChartSVG data={stats.deptData} height={130} /></div>
            {stats.deptData.map(d=>(
              <HBar key={d.label} label={d.label} value={d.value} max={stats.maxDept} color={d.color} total={stats.totalIn+stats.totalOut} />
            ))}
            {stats.deptData.length === 0 && <div style={{ textAlign:'center', padding:20, color:'var(--text-faint)', fontSize:13 }}>No data for this period</div>}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card">
            <div className="card-header"><div style={{ display:'flex', alignItems:'center', gap:8 }}><Activity size={15} color="#10b981"/><span style={{ fontWeight:700, fontSize:14 }}>{t('resolution_rate')}</span></div></div>
            <div className="card-body" style={{ textAlign:'center' }}>
              <div style={{ position:'relative', width:110, height:110, margin:'0 auto 12px' }}>
                <svg width={110} height={110} viewBox="0 0 110 110">
                  <circle cx={55} cy={55} r={46} fill="none" stroke="var(--border)" strokeWidth={9} />
                  <circle cx={55} cy={55} r={46} fill="none" stroke="#10b981" strokeWidth={9}
                    strokeDasharray={`${stats.resPct * 2.89} 289`}
                    strokeLinecap="round" transform="rotate(-90 55 55)"
                    style={{ transition:'stroke-dasharray .8s ease' }} />
                  <text x={55} y={50} textAnchor="middle" fontSize={20} fontWeight={900} fill="var(--text)">{stats.resPct}%</text>
                  <text x={55} y={66} textAnchor="middle" fontSize={9} fill="var(--text-faint)">Resolved</text>
                </svg>
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{stats.resolved} of {stats.totalIn} resolved</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span style={{ fontWeight:700, fontSize:14 }}>{t('quick_stats')}</span></div>
            <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label:'Urgent Letters',   value:stats.urgent,       color:'#ef4444' },
                { label:'Confidential',     value:stats.confidential, color:'#8b5cf6' },
                { label:t('with_attachments'), value:stats.withFiles,    color:'#6366f1' },
                { label:t('pending_action'),   value:stats.pending,      color:'#f59e0b' },
                { label:t('letters_with_cc'),  value:stats.withCC,       color:'#0891b2' },
                { label:t('total_cc_copies'),  value:stats.totalCC,      color:'#10b981' },
              ].map(s=>(
                <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', borderRadius:8, background:'var(--surface-2)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:s.color }} />
                    <span style={{ fontSize:12, color:'var(--text-muted)' }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize:14, fontWeight:800, color:s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
