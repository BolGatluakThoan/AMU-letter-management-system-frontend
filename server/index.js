require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      process.env.CLIENT_URL,
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' })); // allow base64 file attachments

// Serve uploaded files as static assets
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/incoming',    require('./routes/incoming'));
app.use('/api/outgoing',    require('./routes/outgoing'));
app.use('/api/audit',       require('./routes/audit'));
app.use('/api/chat',        require('./routes/chat'));
app.use('/api/groups',      require('./routes/groups'));
app.use('/api/upload',      require('./routes/upload'));
app.use('/api/inbox',       require('./routes/inbox'));
app.use('/api/offices',     require('./routes/offices'));
app.use('/api/departments', require('./routes/departments'));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log('✓ MongoDB connected');

    // ── Startup cleanup: remove duplicate ReceivedLetter records ──
    try {
      const ReceivedLetter = require('./models/ReceivedLetter');
      const all = await ReceivedLetter.find().sort({ createdAt: 1 }).lean();
      const seen = new Map();
      const toDelete = [];
      for (const r of all) {
        const key = `${r.userId}-${r.letterId}`;
        if (seen.has(key)) toDelete.push(r._id);
        else seen.set(key, r._id);
      }
      if (toDelete.length > 0) {
        await ReceivedLetter.deleteMany({ _id: { $in: toDelete } });
        console.log(`✓ Cleaned up ${toDelete.length} duplicate inbox records`);
      }
    } catch (e) { console.error('Inbox cleanup error:', e.message); }

    app.listen(process.env.PORT || 5000, () =>
      console.log(`✓ Server running on http://localhost:${process.env.PORT || 5000}`)
    );
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(() => {
      mongoose.connect(process.env.MONGO_URI)
        .then(() => {
          console.log('✓ MongoDB connected (retry)');
          app.listen(process.env.PORT || 5000, () =>
            console.log(`✓ Server running on http://localhost:${process.env.PORT || 5000}`)
          );
        })
        .catch(e => { console.error('Retry failed:', e.message); process.exit(1); });
    }, 5000);
  });
