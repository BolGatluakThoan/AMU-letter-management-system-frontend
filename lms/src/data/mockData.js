// ── Campus registry ───────────────────────────────────────────────────────
export const CAMPUSES = [
  { id: 'main',     name: 'Main Campus',      location: 'Arba Minch',  status: 'active' },
  { id: 'abaya',    name: 'Abaya Campus',      location: 'Arba Minch',  status: 'active' },
  { id: 'chamo',    name: 'Chamo Campus',      location: 'Arba Minch',  status: 'active' },
  { id: 'kulfo',    name: 'Kulfo Campus',      location: 'Arba Minch',  status: 'active' },
  { id: 'nechsar',  name: 'Nech Sar Campus',   location: 'Arba Minch',  status: 'active' },
  { id: 'sawla',    name: 'Sawla Campus',      location: 'Sawla',       status: 'active' },
  { id: 'hospital', name: 'Teaching Hospital', location: 'Arba Minch',  status: 'upcoming' },
];

// ── Office structure (fallback — replaced by DB values at runtime) ────────
export const AMU_STRUCTURE = {
  'University President Office':              ['University President'],
  'Academic Affairs VP Office':              ['Academic Affairs Vice President'],
  'Administration Affairs VP Office':        ['Administration Affair Vice President'],
  'Research & Community Service VP Office':  ['Research and Community Service Vice President'],
  'Business & Development VP Office':        ['A/Business and Development Vice President'],
  'Students Service Center':                 ['Director of Students Service Center'],
  'Research Core Process':                   ['Director of Research Core process'],
  'Academic Program Eval. Office':           ['Director of Academic Program Eval. & Impl.'],
  'University Registrar Office':             ['University Registrar'],
  'Library & Documentation':                 ['Library & Documentation Head'],
  'Record Office':                           ['Record Officer'],
  'Arba Minch Institute of Technology':      ['Dean - AMIT'],
  'College of Business and Economics':       ['Dean - CBE'],
  'College of Natural Sciences':             ['Dean - CNS'],
  'College of Social Science & Humanities':  ['Dean - CSSH'],
  'College of Agricultural Sciences':        ['Dean - CAS'],
  'College of Medicine and Health Science':  ['Dean - CMHS'],
  'School of Post Graduate Study':           ['Director - Post Graduate'],
  'College of Distance and Continuing':      ['Dean - Distance'],
  'Main Campus Directorate':                 ['Campus Director - Main'],
  'Abaya Campus Directorate':                ['Campus Director - Abaya'],
  'Chamo Campus Directorate':                ['Campus Director - Chamo'],
  'Kulfo Campus Directorate':                ['Campus Director - Kulfo'],
  'Nech Sar Campus Directorate':             ['Campus Director - Nech Sar'],
  'Sawla Campus Directorate':                ['Campus Director - Sawla'],
};

export const OFFICES = Object.keys(AMU_STRUCTURE);

export const ROLES = [
  'University President',
  'Vice President',
  'Director',
  'Dean',
  'University Registrar',
  'Record Officer',
  'Academic Staff',
  'Administrative Staff',
  'Finance Officer',
  'Library Staff',
  'IT Staff',
  'Staff',
];

export const priorities     = ['Normal', 'Urgent', 'Confidential'];
export const deliveryModes  = ['Hand', 'Courier', 'Email', 'Fax'];
export const dispatchMethods = ['Email', 'Courier', 'Hand Delivery', 'Fax'];
export const incomingStatuses = ['Registered', 'Forwarded', 'Under Review', 'Responded', 'Closed'];
export const outgoingStatuses = ['Draft', 'Approved', 'Sent', 'Delivered'];

// ── Departments (fallback list — replaced by DB values at runtime) ────────
export const departments = [
  'University President Office',
  'Academic Affairs',
  'Administration',
  'Research & Community',
  'Business & Development',
  'Students Service',
  'Registrar',
  'Library',
  'Record Office',
  'Finance',
  'IT',
  'HR',
  'Arba Minch Institute of Technology',
  'College of Business and Economics',
  'College of Natural Sciences',
  'College of Social Science & Humanities',
  'College of Agricultural Sciences',
  'College of Medicine and Health Science',
  'School of Post Graduate Study',
  'College of Distance and Continuing',
  'Main Campus',
  'Abaya Campus',
  'Chamo Campus',
  'Kulfo Campus',
  'Nech Sar Campus',
  'Sawla Campus',
];
