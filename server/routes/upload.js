const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
});

// POST /api/upload — upload one or more files, returns array of file metadata
router.post('/', auth, upload.array('files', 20), (req, res) => {
  try {
    const files = (req.files || []).map(f => ({
      name: f.originalname,
      size: f.size,
      type: f.mimetype,
      url: `/uploads/${f.filename}`,
      filename: f.filename,
    }));
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/upload/:filename — remove a file
router.delete('/:filename', auth, (req, res) => {
  try {
    const filePath = path.join(UPLOAD_DIR, req.params.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
