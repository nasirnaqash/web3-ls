import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new Database(join(__dirname, 'linkio.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    short_code TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    creator TEXT DEFAULT 'anonymous',
    created_at INTEGER NOT NULL,
    clicks INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    short_code TEXT UNIQUE NOT NULL,
    ipfs_hash TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    creator TEXT DEFAULT 'anonymous',
    created_at INTEGER NOT NULL,
    views INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_links_creator ON links(creator);
  CREATE INDEX IF NOT EXISTS idx_media_creator ON media(creator);
  CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
  CREATE INDEX IF NOT EXISTS idx_media_short_code ON media(short_code);
`);

// Generate random short code
function generateShortCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// ============ LINK ROUTES ============

// Create short link
app.post('/api/links', (req, res) => {
  try {
    const { originalUrl, creator } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: 'Original URL is required' });
    }

    // Generate unique short code
    let shortCode = generateShortCode();
    const checkStmt = db.prepare('SELECT 1 FROM links WHERE short_code = ?');
    while (checkStmt.get(shortCode)) {
      shortCode = generateShortCode();
    }

    const createdAt = Math.floor(Date.now() / 1000);
    const stmt = db.prepare(`
      INSERT INTO links (short_code, original_url, creator, created_at, clicks)
      VALUES (?, ?, ?, ?, 0)
    `);

    stmt.run(shortCode, originalUrl, creator || 'anonymous', createdAt);

    res.json({
      shortCode,
      originalUrl,
      creator: creator || 'anonymous',
      createdAt,
      clicks: 0
    });
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({ error: 'Failed to create short link' });
  }
});

// Get link data
app.get('/api/links/:shortCode', (req, res) => {
  try {
    const { shortCode } = req.params;
    const stmt = db.prepare('SELECT * FROM links WHERE short_code = ?');
    const link = stmt.get(shortCode);

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({
      shortCode: link.short_code,
      originalUrl: link.original_url,
      creator: link.creator,
      createdAt: link.created_at,
      clicks: link.clicks
    });
  } catch (error) {
    console.error('Error getting link:', error);
    res.status(500).json({ error: 'Failed to get link' });
  }
});

// Increment link clicks and redirect
app.get('/api/links/:shortCode/redirect', (req, res) => {
  try {
    const { shortCode } = req.params;
    const stmt = db.prepare('SELECT * FROM links WHERE short_code = ?');
    const link = stmt.get(shortCode);

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Increment clicks
    const updateStmt = db.prepare('UPDATE links SET clicks = clicks + 1 WHERE short_code = ?');
    updateStmt.run(shortCode);

    res.json({
      originalUrl: link.original_url
    });
  } catch (error) {
    console.error('Error redirecting:', error);
    res.status(500).json({ error: 'Failed to redirect' });
  }
});

// Get user's links
app.get('/api/users/:walletAddress/links', (req, res) => {
  try {
    const { walletAddress } = req.params;
    const stmt = db.prepare(`
      SELECT * FROM links
      WHERE creator = ?
      ORDER BY created_at DESC
      LIMIT 10
    `);
    const links = stmt.all(walletAddress);

    res.json(links.map(link => ({
      shortCode: link.short_code,
      originalUrl: link.original_url,
      creator: link.creator,
      createdAt: link.created_at,
      clicks: link.clicks
    })));
  } catch (error) {
    console.error('Error getting user links:', error);
    res.status(500).json({ error: 'Failed to get user links' });
  }
});

// ============ MEDIA ROUTES ============

// Save media metadata
app.post('/api/media', (req, res) => {
  try {
    const { ipfsHash, fileName, fileType, fileSize, creator } = req.body;

    if (!ipfsHash || !fileName || !fileType || !fileSize) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique short code
    let shortCode = generateShortCode();
    const checkStmt = db.prepare('SELECT 1 FROM media WHERE short_code = ?');
    while (checkStmt.get(shortCode)) {
      shortCode = generateShortCode();
    }

    const createdAt = Math.floor(Date.now() / 1000);
    const stmt = db.prepare(`
      INSERT INTO media (short_code, ipfs_hash, file_name, file_type, file_size, creator, created_at, views)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);

    stmt.run(shortCode, ipfsHash, fileName, fileType, fileSize, creator || 'anonymous', createdAt);

    res.json({
      shortCode,
      ipfsHash,
      fileName,
      fileType,
      fileSize,
      creator: creator || 'anonymous',
      createdAt,
      views: 0
    });
  } catch (error) {
    console.error('Error saving media:', error);
    res.status(500).json({ error: 'Failed to save media metadata' });
  }
});

// Get media data
app.get('/api/media/:shortCode', (req, res) => {
  try {
    const { shortCode } = req.params;
    const stmt = db.prepare('SELECT * FROM media WHERE short_code = ?');
    const media = stmt.get(shortCode);

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json({
      shortCode: media.short_code,
      ipfsHash: media.ipfs_hash,
      fileName: media.file_name,
      fileType: media.file_type,
      fileSize: media.file_size,
      creator: media.creator,
      createdAt: media.created_at,
      views: media.views
    });
  } catch (error) {
    console.error('Error getting media:', error);
    res.status(500).json({ error: 'Failed to get media' });
  }
});

// Increment media views
app.get('/api/media/:shortCode/view', (req, res) => {
  try {
    const { shortCode } = req.params;
    const stmt = db.prepare('SELECT * FROM media WHERE short_code = ?');
    const media = stmt.get(shortCode);

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Increment views
    const updateStmt = db.prepare('UPDATE media SET views = views + 1 WHERE short_code = ?');
    updateStmt.run(shortCode);

    res.json({
      shortCode: media.short_code,
      ipfsHash: media.ipfs_hash,
      fileName: media.file_name,
      fileType: media.file_type,
      fileSize: media.file_size,
      creator: media.creator,
      createdAt: media.created_at,
      views: media.views + 1
    });
  } catch (error) {
    console.error('Error viewing media:', error);
    res.status(500).json({ error: 'Failed to view media' });
  }
});

// Get user's media
app.get('/api/users/:walletAddress/media', (req, res) => {
  try {
    const { walletAddress } = req.params;
    const stmt = db.prepare(`
      SELECT * FROM media
      WHERE creator = ?
      ORDER BY created_at DESC
      LIMIT 10
    `);
    const mediaList = stmt.all(walletAddress);

    res.json(mediaList.map(media => ({
      shortCode: media.short_code,
      ipfsHash: media.ipfs_hash,
      fileName: media.file_name,
      fileType: media.file_type,
      fileSize: media.file_size,
      creator: media.creator,
      createdAt: media.created_at,
      views: media.views
    })));
  } catch (error) {
    console.error('Error getting user media:', error);
    res.status(500).json({ error: 'Failed to get user media' });
  }
});

// ============ STATS ROUTES ============

app.get('/api/stats', (req, res) => {
  try {
    const linksStmt = db.prepare('SELECT COUNT(*) as count FROM links');
    const mediaStmt = db.prepare('SELECT COUNT(*) as count FROM media');

    const totalLinks = linksStmt.get().count;
    const totalMedia = mediaStmt.get().count;

    res.json({ totalLinks, totalMedia });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ ADMIN ROUTES ============

// Get all links (admin)
app.get('/api/admin/links', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM links ORDER BY created_at DESC LIMIT 100');
    const links = stmt.all();
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get links' });
  }
});

// Get all media (admin)
app.get('/api/admin/media', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM media ORDER BY created_at DESC LIMIT 100');
    const media = stmt.all();
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get media' });
  }
});

// Delete a link (admin)
app.delete('/api/admin/links/:shortCode', (req, res) => {
  try {
    const { shortCode } = req.params;
    const stmt = db.prepare('DELETE FROM links WHERE short_code = ?');
    const result = stmt.run(shortCode);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.json({ message: 'Link deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

// Delete media (admin)
app.delete('/api/admin/media/:shortCode', (req, res) => {
  try {
    const { shortCode } = req.params;
    const stmt = db.prepare('DELETE FROM media WHERE short_code = ?');
    const result = stmt.run(shortCode);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json({ message: 'Media deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log('  POST /api/links - Create short link');
  console.log('  GET  /api/links/:shortCode - Get link data');
  console.log('  GET  /api/links/:shortCode/redirect - Redirect and track click');
  console.log('  POST /api/media - Save media metadata');
  console.log('  GET  /api/media/:shortCode - Get media data');
  console.log('  GET  /api/media/:shortCode/view - View and track media');
  console.log('  GET  /api/users/:wallet/links - Get user links');
  console.log('  GET  /api/users/:wallet/media - Get user media');
  console.log('  GET  /api/stats - Get total counts');
});
