import { useState, useRef } from 'react';
import { Building2, MapPin, CheckCircle, Clock, Navigation, Ruler, Info, ExternalLink } from 'lucide-react';
import { CAMPUSES, AMU_STRUCTURE } from '../data/mockData';
import useScrollReveal from '../hooks/useScrollReveal';

// Real AMU campus coordinates — arranged by actual road distances from Main Campus
// Main Campus (north) → Sickla junction (5km) → road splits:
//   East branch: Sickla → Nech Sar (2.7km) → Teaching Hospital (0.9km) → Chamo (3.9km)
//   West branch: Sickla → Kulfo (3km)
//   Nech Sar → Abaya (2.2km, adjacent other side of road)
// 1 km ≈ 0.009° latitude, ≈ 0.011° longitude at this location
const CAMPUS_DATA = {
  main: {
    // North of town on Addis Ababa road — reference point
    lat: 6.0639, lng: 37.5614,
    location: 'North of Arba Minch, on Addis Ababa road',
    elevation: '1,285 m',
    description: 'Mother Campus — 5 km north of Sickla junction. Houses the President\'s Office, AMIT, Post Graduate School, and central administration.',
    distanceFromTown: '5 km north of Sickla (town center)',
    googleMaps: 'https://maps.google.com/?q=6.0639,37.5614',
  },
  kulfo: {
    // Main → Sickla (5km south) → Kulfo (3km further southwest)
    // Sickla ≈ 6.0189, Kulfo branches west from Sickla ~3km
    lat: 6.0000, lng: 37.5280,
    location: 'Kulfo area, southwest of Sickla junction, near Kulfo River',
    elevation: '1,270 m',
    description: 'Houses the College of Agricultural Sciences. Reached via Sickla junction — 5 km from Main Campus to Sickla, then 3 km southwest to Kulfo along the Kulfo River corridor.',
    distanceFromTown: '8 km from Main Campus (via Sickla)',
    googleMaps: 'https://maps.google.com/?q=6.0000,37.5280',
  },
  nechsar: {
    // Main → Sickla (5km) → Nech Sar (2.7km further south-east)
    // Sickla ≈ 6.0189, Nech Sar 2.7km south = 6.0189 - 0.024 ≈ 5.9950
    lat: 5.9950, lng: 37.5680,
    location: 'South of Sickla junction, 7.7 km from Main Campus',
    elevation: '1,260 m',
    description: 'Houses the College of Medicine and Health Science. Located 7.7 km from Main Campus: 5 km to Sickla junction, then 2.7 km south toward town.',
    distanceFromTown: '7.7 km from Main Campus (5 km to Sickla + 2.7 km)',
    googleMaps: 'https://maps.google.com/?q=5.9950,37.5680',
  },
  abaya: {
    // Nech Sar → Abaya: 2.2 km, adjacent on the other (west) side of the road
    lat: 5.9950, lng: 37.5440,
    location: 'Adjacent to Nech Sar Campus, west side of road (Secha sub-city)',
    elevation: '1,265 m',
    description: 'Houses the College of Natural Sciences. Located 2.2 km from Nech Sar Campus on the opposite (west) side of the road, in Secha sub-city.',
    distanceFromTown: '2.2 km from Nech Sar Campus',
    googleMaps: 'https://maps.google.com/?q=5.9950,37.5440',
  },
  hospital: {
    // Nech Sar → Teaching Hospital: 0.9 km further south toward Chamo
    lat: 5.9869, lng: 37.5660,
    location: 'Arba Minch town center, 0.9 km south of Nech Sar Campus toward Chamo',
    elevation: '1,258 m',
    description: 'AMU Comprehensive Specialized Teaching Hospital — upcoming campus. Located 0.9 km south of Nech Sar Campus on the road to Chamo, with Abaya Campus adjacent on the west side. Primary clinical training site for medical and health science students.',
    distanceFromTown: '0.9 km from Nech Sar, 3.9 km from Chamo',
    googleMaps: 'https://maps.google.com/?q=5.9869,37.5660',
  },
  chamo: {
    // Teaching Hospital → Chamo: 3.9 km further south
    lat: 5.9518, lng: 37.5620,
    location: 'Southern end of Arba Minch, overlooking Lake Chamo',
    elevation: '1,250 m',
    description: 'Houses College of Business & Economics and College of Social Science & Humanities. Located 3.9 km south of the Teaching Hospital, at the far southern end of Arba Minch with views of Lake Chamo.',
    distanceFromTown: '12.5 km from Main Campus (via Sickla road)',
    googleMaps: 'https://maps.google.com/?q=5.9518,37.5620',
  },
  sawla: {
    lat: 6.300, lng: 36.883,
    location: 'Sawla town, Gofa Zone',
    elevation: '1,395 m',
    description: 'Remote campus in Sawla, 250 km from Arba Minch by road. Serves students from Gofa Zone and surrounding areas.',
    distanceFromTown: '250 km from Arba Minch (road)',
    googleMaps: 'https://maps.google.com/?q=6.300,36.883',
  },
};

  // Motivational overlay removed (global overlay deleted)


// Calculate distance between two coordinates (Haversine formula)
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
}

const CAMPUS_OFFICES = {
  main: ['University President Office','Academic Affairs VP Office','Administration Affairs VP Office','Research & Community Service VP Office','Business & Development VP Office','Students Service Center','Research Core Process','Academic Program Eval. Office','University Registrar Office','Library & Documentation','Record Office','Arba Minch Institute of Technology','School of Post Graduate Study','College of Distance and Continuing','Main Campus Directorate'],
  abaya: ['College of Natural Sciences','Abaya Campus Directorate'],
  chamo: ['College of Business and Economics','College of Social Science & Humanities','Chamo Campus Directorate'],
  kulfo: ['College of Agricultural Sciences','Kulfo Campus Directorate'],
  nechsar: ['College of Medicine and Health Science','Nech Sar Campus Directorate'],
  sawla: ['Sawla Campus Directorate'],
  hospital: ['AMU Comprehensive Specialized Hospital', 'Clinical Training Center', 'Teaching Hospital Directorate'],
};

// Simple SVG map component (no external library needed)
function CampusMap({ campuses, selected, onSelect }) {
  // Bounding box for all campuses
  const lats = campuses.map(c => CAMPUS_DATA[c.id]?.lat).filter(Boolean);
  const lngs = campuses.map(c => CAMPUS_DATA[c.id]?.lng).filter(Boolean);
  const minLat = Math.min(...lats) - 0.05;
  const maxLat = Math.max(...lats) + 0.05;
  const minLng = Math.min(...lngs) - 0.05;
  const maxLng = Math.max(...lngs) + 0.05;

  const W = 600, H = 380;
  const toX = (lng) => ((lng - minLng) / (maxLng - minLng)) * (W - 60) + 30;
  const toY = (lat) => H - ((lat - minLat) / (maxLat - minLat)) * (H - 60) - 30;

  return (
    <div style={{ position: 'relative', background: '#e8f4f8', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {/* Map background */}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(f => (
          <g key={f}>
            <line x1={toX(minLng + f*(maxLng-minLng))} y1={30} x2={toX(minLng + f*(maxLng-minLng))} y2={H-30} stroke="#c8dce8" strokeWidth={1} strokeDasharray="4,4"/>
            <line x1={30} y1={toY(minLat + f*(maxLat-minLat))} x2={W-30} y2={toY(minLat + f*(maxLat-minLat))} stroke="#c8dce8" strokeWidth={1} strokeDasharray="4,4"/>
          </g>
        ))}

        {/* Connection lines between main campus and others */}
        {campuses.filter(c => c.id !== 'main').map(c => {
          const d = CAMPUS_DATA[c.id];
          const m = CAMPUS_DATA['main'];
          if (!d || !m) return null;
          return (
            <line key={c.id}
              x1={toX(m.lng)} y1={toY(m.lat)}
              x2={toX(d.lng)} y2={toY(d.lat)}
              stroke={c.status === 'upcoming' ? '#f59e0b' : '#6366f1'}
              strokeWidth={1.5} strokeDasharray={c.status === 'upcoming' ? '6,4' : ''}
              opacity={0.4}
            />
          );
        })}

        {/* Campus markers */}
        {campuses.map(c => {
          const d = CAMPUS_DATA[c.id];
          if (!d) return null;
          const x = toX(d.lng);
          const y = toY(d.lat);
          const isSelected = selected?.id === c.id;
          const isUpcoming = c.status === 'upcoming';
          const color = isUpcoming ? '#f59e0b' : '#6366f1';
          const r = isSelected ? 14 : 10;

          return (
            <g key={c.id} onClick={() => onSelect(c)} style={{ cursor: 'pointer' }}>
              {isSelected && <circle cx={x} cy={y} r={22} fill={color} opacity={0.15}/>}
              <circle cx={x} cy={y} r={r} fill={color} stroke="#fff" strokeWidth={2.5}/>
              <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle" fontSize={isSelected?8:7} fill="#fff" fontWeight={700}>
                {c.name.slice(0,1)}
              </text>
              {/* Label */}
              <text x={x} y={y + r + 12} textAnchor="middle" fontSize={9} fill="#334155" fontWeight={isSelected ? 700 : 500}>
                {c.name.replace(' Campus','').replace(' Directorate','')}
              </text>
            </g>
          );
        })}

        {/* Compass */}
        <g transform={`translate(${W-50}, 50)`}>
          <circle cx={0} cy={0} r={18} fill="white" stroke="#cbd5e1" strokeWidth={1}/>
          <text x={0} y={-6} textAnchor="middle" fontSize={10} fontWeight={700} fill="#ef4444">N</text>
          <polygon points="0,-14 3,-2 0,2 -3,-2" fill="#ef4444"/>
          <polygon points="0,14 3,2 0,-2 -3,2" fill="#94a3b8"/>
        </g>

        {/* Scale bar */}
        <g transform={`translate(30, ${H-18})`}>
          <line x1={0} y1={0} x2={60} y2={0} stroke="#64748b" strokeWidth={2}/>
          <line x1={0} y1={-4} x2={0} y2={4} stroke="#64748b" strokeWidth={2}/>
          <line x1={60} y1={-4} x2={60} y2={4} stroke="#64748b" strokeWidth={2}/>
          <text x={30} y={-6} textAnchor="middle" fontSize={8} fill="#64748b">~50 km</text>
        </g>
      </svg>

      {/* Map attribution */}
      <div style={{ position:'absolute', bottom:4, right:8, fontSize:9, color:'#94a3b8' }}>
        Coordinates: AMU Campus Network
      </div>
    </div>
  );
}

export default function Campuses() {
  const [selected, setSelected] = useState(CAMPUSES[0]);
  const containerRef = useRef(null);
  useScrollReveal(containerRef);

  const activeCampuses = CAMPUSES.filter(c => c.status === 'active');
  const upcomingCampuses = CAMPUSES.filter(c => c.status === 'upcoming');
  const selectedData = CAMPUS_DATA[selected?.id];
  const mainData = CAMPUS_DATA['main'];

  const distFromMain = selected?.id !== 'main' && selectedData && mainData
    ? calcDistance(mainData.lat, mainData.lng, selectedData.lat, selectedData.lng)
    : null;

  return (
    <div ref={containerRef}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Campuses & Map</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Arba Minch University — {activeCampuses.length} active campuses · {upcomingCampuses.length} upcoming · Coordinates: 6°3'50"N, 37°33'41"E
        </p>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { icon: Building2, color: '#6366f1', val: activeCampuses.length, label: 'Active Campuses' },
          { icon: Clock,     color: '#f59e0b', val: upcomingCampuses.length, label: 'Upcoming' },
          { icon: MapPin,    color: '#10b981', val: Object.keys(AMU_STRUCTURE).length, label: 'Total Offices' },
          { icon: Ruler,     color: '#0891b2', val: '~505 km', label: 'From Addis Ababa' },
        ].map((item) => {
          const IconComponent = item.icon;
          return (
          <div key={item.label} className="card" style={{ flex: 1, minWidth: 140, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconComponent size={18} color={item.color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{item.val}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.label}</div>
            </div>
          </div>
          );
        })}
      </div>

      <div className="campus-grid" style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,340px)', gap:16, alignItems:'start' }}>
        <style>{`@media(max-width:800px){.campus-grid{grid-template-columns:1fr !important}}`}</style>

        {/* Map */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} color="#6366f1"/>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Campus Network Map</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-faint)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }}/> Active</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}/> Upcoming</span>
            </div>
          </div>
          <div className="card-body" style={{ padding: 12 }}>
            <CampusMap campuses={CAMPUSES} selected={selected} onSelect={setSelected} />
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CAMPUSES.map(c => (
                <button key={c.id} onClick={() => setSelected(c)} style={{
                  padding: '5px 12px', borderRadius: 99, border: '1.5px solid',
                  borderColor: selected?.id === c.id ? '#6366f1' : 'var(--border)',
                  background: selected?.id === c.id ? '#6366f1' : 'transparent',
                  color: selected?.id === c.id ? '#fff' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                }}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected campus detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selected && selectedData && (
            <div className="card">
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: selected.status === 'upcoming' ? 'rgba(245,158,11,.12)' : 'rgba(99,102,241,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={20} color={selected.status === 'upcoming' ? '#f59e0b' : '#6366f1'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.name}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: selected.status === 'upcoming' ? 'rgba(245,158,11,.12)' : 'rgba(16,185,129,.12)', color: selected.status === 'upcoming' ? '#d97706' : '#059669' }}>
                    {selected.status === 'upcoming' ? 'Upcoming' : 'Active'}
                  </span>
                </div>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Coordinates */}
                <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>GPS Coordinates</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#6366f1' }}>
                    {selectedData.lat.toFixed(4)}°N, {selectedData.lng.toFixed(4)}°E
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                    {Math.floor(selectedData.lat)}°{Math.floor((selectedData.lat % 1) * 60)}'
                    {((selectedData.lat % 1 * 60) % 1 * 60).toFixed(1)}"N &nbsp;
                    {Math.floor(selectedData.lng)}°{Math.floor((selectedData.lng % 1) * 60)}'
                    {((selectedData.lng % 1 * 60) % 1 * 60).toFixed(1)}"E
                  </div>
                </div>

                {/* Key info */}
                {[
                  { label: 'Location', val: selectedData.location },
                  { label: 'Elevation', val: selectedData.elevation },
                  { label: distFromMain ? 'Straight-line from Main' : 'Distance from Addis', val: distFromMain ? `${distFromMain} km` : '~505 km' },
                  { label: 'From Town Center', val: selectedData.distanceFromTown },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 8 }}>
                    <span style={{ color: 'var(--text-faint)' }}>{label}</span>
                    <span style={{ fontWeight: 600, textAlign: 'right' }}>{val}</span>
                  </div>
                ))}

                {/* Description */}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8 }}>
                  {selectedData.description}
                </div>

                {/* Offices */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
                    Offices ({(CAMPUS_OFFICES[selected.id] || []).length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                    {(CAMPUS_OFFICES[selected.id] || []).map(o => (
                      <div key={o} style={{ fontSize: 11, padding: '4px 8px', background: 'var(--surface-2)', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }}/>
                        {o}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open in Google Maps */}
                <a href={selectedData.googleMaps} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '9px', borderRadius: 8, background: '#4285f4', color: '#fff',
                  textDecoration: 'none', fontSize: 13, fontWeight: 600,
                }}>
                  <Navigation size={14}/> Open in Google Maps
                  <ExternalLink size={12}/>
                </a>
              </div>
            </div>
          )}

          {/* Distance matrix */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ruler size={14} color="#0891b2"/>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Inter-Campus Distances</span>
              </div>
            </div>
            <div style={{ padding: '10px 14px' }}>
              {CAMPUSES.filter(c => c.id !== 'main').map(c => {
                const d = CAMPUS_DATA[c.id];
                const dist = d ? calcDistance(mainData.lat, mainData.lng, d.lat, d.lng) : '—';
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.status === 'upcoming' ? '#f59e0b' : '#6366f1' }}/>
                      <span>{c.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#0891b2', fontFamily: 'monospace' }}>{dist} km</span>
                  </div>
                );
              })}
              <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 8 }}>* Straight-line distances from Main Campus. Road route: Main → Sickla (5 km) → Nech Sar (+2.7 km) → Teaching Hospital (+0.9 km) → Chamo (+3.9 km). Kulfo: Sickla +3 km west. Abaya: 2.2 km from Nech Sar. Sawla road: ~250 km.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
