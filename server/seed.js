/**
 * Run once to seed the database with initial users and letters.
 * Usage: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const IncomingLetter = require('./models/IncomingLetter');
const OutgoingLetter = require('./models/OutgoingLetter');

const USERS = [
  { username:'president',    password:'pass123', name:'Dr. Damtew Darza',          role:'University President',  office:'University President Office',           avatar:'DD', email:'president@amu.edu.et',      canAddUsers:true  },
  { username:'vp.academic',  password:'pass123', name:'Dr. Yechale Kebede',         role:'Vice President',        office:'Academic Affairs VP Office',            avatar:'YK', email:'vp.academic@amu.edu.et',    canAddUsers:true  },
  { username:'vp.admin',     password:'pass123', name:'Dr. Melkamu Mada',           role:'Vice President',        office:'Administration Affairs VP Office',       avatar:'MM', email:'vp.admin@amu.edu.et',       canAddUsers:true  },
  { username:'vp.research',  password:'pass123', name:'Dr. Simon Shibru',           role:'Vice President',        office:'Research & Community Service VP Office', avatar:'SS', email:'vp.research@amu.edu.et',    canAddUsers:true  },
  { username:'vp.business',  password:'pass123', name:'Mrs. Tariku W/Medihen',      role:'Vice President',        office:'Business & Development VP Office',      avatar:'TW', email:'vp.business@amu.edu.et',    canAddUsers:true  },
  { username:'dir.students', password:'pass123', name:'Mr. Ayelign Gota',           role:'Director',              office:'Students Service Center',               avatar:'AG', email:'students@amu.edu.et',       canAddUsers:true  },
  { username:'dir.research', password:'pass123', name:'Dr. Teshome Yirgu',          role:'Director',              office:'Research Core Process',                 avatar:'TY', email:'research@amu.edu.et',       canAddUsers:true  },
  { username:'dir.academic', password:'pass123', name:'Dr. Nigusie Tadege',         role:'Director',              office:'Academic Program Eval. Office',         avatar:'NT', email:'acad.eval@amu.edu.et',      canAddUsers:true  },
  { username:'registrar',    password:'pass123', name:'Dr. Belete Yilma',           role:'University Registrar',  office:'University Registrar Office',           avatar:'BY', email:'registrar@amu.edu.et',      canAddUsers:true  },
  { username:'library',      password:'pass123', name:'Mr. Alemseged Kassahun',     role:'Library Staff',         office:'Library & Documentation',               avatar:'AK', email:'library@amu.edu.et',        canAddUsers:false },
  { username:'dean.amit',    password:'pass123', name:'Dr. Alemayehu Chufamo',      role:'Dean',                  office:'Arba Minch Institute of Technology',    avatar:'AC', email:'dean.amit@amu.edu.et',      canAddUsers:true  },
  { username:'dean.cbe',     password:'pass123', name:'Dr. Abdella Kemal',          role:'Dean',                  office:'College of Business and Economics',     avatar:'AK', email:'dean.cbe@amu.edu.et',       canAddUsers:true  },
  { username:'dean.cns',     password:'pass123', name:'Mr. Getasew Yaregal',        role:'Dean',                  office:'College of Natural Sciences',           avatar:'GY', email:'dean.cns@amu.edu.et',       canAddUsers:true  },
  { username:'dean.cssh',    password:'pass123', name:'Dr. Alemayehu Hailemicheal', role:'Dean',                  office:'College of Social Science & Humanities',avatar:'AH', email:'dean.cssh@amu.edu.et',      canAddUsers:true  },
  { username:'dean.cas',     password:'pass123', name:'Mr. Mulugeta Debele',        role:'Dean',                  office:'College of Agricultural Sciences',      avatar:'MD', email:'dean.cas@amu.edu.et',       canAddUsers:true  },
  { username:'dean.cmhs',    password:'pass123', name:'Dr. Yishak Kachero',         role:'Dean',                  office:'College of Medicine and Health Science', avatar:'YK', email:'dean.cmhs@amu.edu.et',     canAddUsers:true  },
  { username:'dir.postgrad', password:'pass123', name:'Dr. Tamiru Shibiru',         role:'Director',              office:'School of Post Graduate Study',         avatar:'TS', email:'postgrad@amu.edu.et',       canAddUsers:true  },
  { username:'dean.distance',password:'pass123', name:'Dr. Abera Uncha',            role:'Dean',                  office:'College of Distance and Continuing',    avatar:'AU', email:'distance@amu.edu.et',       canAddUsers:true  },
  { username:'dir.sawla',    password:'pass123', name:'Dr. Serekeberhane Takele',   role:'Director',              office:'Sawla Campus Directorate',              avatar:'ST', email:'sawla@amu.edu.et',          canAddUsers:true  },
  { username:'record',       password:'pass123', name:'Mr. Gebremedhin Chameno',    role:'Record Officer',        office:'Record Office',                         avatar:'GC', email:'record@amu.edu.et',         canAddUsers:true  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Drop and recreate to ensure clean state
  await User.deleteMany({});

  // Insert with pre-hashed passwords directly (bypass model hook to avoid double-hash)
  const bcrypt = require('bcryptjs');
  const hashed123  = await bcrypt.hash('pass123',  10);
  const hashedAdmin = await bcrypt.hash('admin123', 10);

  await User.insertMany(USERS.map(u => ({
    ...u,
    password: u.password === 'admin123' ? hashedAdmin : hashed123,
  })));
  console.log(`✓ Seeded ${USERS.length} users`);

  await IncomingLetter.deleteMany({});
  await IncomingLetter.insertMany([
    { refNo:'INC-2026-001', sender:'Ministry of Education', senderOrg:'Federal Government of Ethiopia', subject:'University Accreditation Review 2026', department:'Academic Affairs', priority:'Urgent', mode:'Email', dateReceived:'2026-03-01', status:'Under Review', remarks:'Forwarded to Academic Affairs VP' },
    { refNo:'INC-2026-002', sender:'HERQA', senderOrg:'HERQA', subject:'Quality Assurance Audit Schedule', department:'Academic Affairs', priority:'Normal', mode:'Courier', dateReceived:'2026-03-05', status:'Registered', remarks:'' },
    { refNo:'INC-2026-003', sender:'Ministry of Finance', senderOrg:'Federal Government of Ethiopia', subject:'Annual Budget Disbursement Q1 2026', department:'Finance', priority:'Confidential', mode:'Hand', dateReceived:'2026-03-08', status:'Forwarded', remarks:'Forwarded to Finance Office' },
  ]);
  console.log('✓ Seeded incoming letters');

  await OutgoingLetter.deleteMany({});
  await OutgoingLetter.insertMany([
    { refNo:'OUT-2026-001', recipient:'Ministry of Education', recipientOrg:'Federal Government of Ethiopia', subject:'Response to Accreditation Review', department:'Academic Affairs', datePrepared:'2026-03-03', dispatchMethod:'Email', responsibleOfficer:'Dr. Yechale Kebede', status:'Sent' },
    { refNo:'OUT-2026-002', recipient:'HERQA', recipientOrg:'HERQA', subject:'Quality Assurance Self-Assessment Report', department:'Academic Affairs', datePrepared:'2026-03-06', dispatchMethod:'Courier', trackingNo:'TRK-9921', responsibleOfficer:'Dr. Yechale Kebede', status:'Delivered' },
  ]);
  console.log('✓ Seeded outgoing letters');

  await mongoose.disconnect();
  console.log('Done. Database seeded successfully.');
}

seed().catch(err => { console.error(err); process.exit(1); });
