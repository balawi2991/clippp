import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Routes
import projectsRouter from './routes/projects.js';
import jobsRouter from './routes/jobs.js';
import uploadsRouter from './routes/uploads.js';
import scriptsRouter from './routes/scripts.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure storage directory exists
const storagePath = process.env.STORAGE_PATH || './storage';
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

// Static files (for serving generated videos/images)
app.use('/storage', (req, res, next) => {
  // Add headers for video streaming
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=0');
  next();
}, express.static(storagePath));

// Routes
app.use('/api/projects', projectsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/scripts', scriptsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    features: {
      groqTTS: process.env.USE_GROQ_TTS === 'true',
      whisperLocal: process.env.USE_WHISPER_LOCAL === 'true',
      gladiaAlignment: process.env.USE_GLADIA_ALIGNMENT === 'true',
      aiScriptSplitter: process.env.USE_AI_SCRIPT_SPLITTER === 'true',
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Storage path: ${storagePath}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
});
