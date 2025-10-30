# Visual Voicemail Maker - Backend

Local-only backend for generating videos with captions.

## Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Setup Database
```bash
npm run db:generate
npm run db:push
```

### 3. Configure Environment
Copy `.env` and adjust settings if needed.

### 4. Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on: **http://localhost:3001**

---

## API Endpoints

### Projects

#### `GET /api/projects`
List all projects

#### `GET /api/projects/:id`
Get project details with scenes, captions, assets, and jobs

#### `POST /api/projects`
Create new project
```json
{
  "title": "My Video",
  "script": "This is my script...",
  "settings": { ... },
  "style": { ... }
}
```

#### `PATCH /api/projects/:id`
Update project
```json
{
  "title": "Updated Title",
  "status": "ready",
  "style": { ... }
}
```

#### `DELETE /api/projects/:id`
Delete project and all its files

---

### Jobs

#### `GET /api/jobs/:id`
Get job status and progress

---

### Uploads

#### `POST /api/uploads`
Upload file (image/audio)
- Form-data with `file` field
- Max size: 50MB
- Allowed: jpg, png, gif, mp3, wav, mp4, webm

---

## Storage Structure

```
storage/
├── {projectId}/
│   ├── inputs/
│   │   └── script.txt
│   ├── audio/
│   │   └── tts.mp3
│   ├── captions/
│   │   ├── blocks.json
│   │   └── words.json
│   ├── overlays/
│   │   ├── block_0.png
│   │   ├── block_1.png
│   │   └── ...
│   ├── temp/
│   ├── exports/
│   │   └── final.mp4
│   └── project.json
└── uploads/
    └── ...
```

---

## Feature Flags (.env)

```env
USE_GROQ_TTS=false           # Groq TTS for voice generation
USE_WHISPER_LOCAL=false      # Local Whisper for word timestamps
USE_GLADIA_ALIGNMENT=false   # Gladia API for alignment
USE_AI_SCRIPT_SPLITTER=false # AI-based script splitting
```

---

## Database Schema

### Project
- id, title, status, durationLimit
- styleJson (style snapshot from /edit/)
- settingsJson (generation settings)

### Scene
- id, projectId, index
- text, duration, startTime, endTime
- imagePrompt, imagePath

### Caption
- id, projectId, index
- text, startTime, endTime
- wordsJson (word-level timestamps)
- overlayPath (rendered PNG/WebP)

### Asset
- id, projectId, kind
- path, filename, mimeType, size

### Job
- id, projectId, type (generate/export)
- status, progress, currentStep
- stepsJson, logsJson

---

## Next Steps

1. ✅ Basic CRUD APIs
2. ⏳ Generate endpoint (script splitting + scenes)
3. ⏳ Canvas renderer (caption overlays)
4. ⏳ FFmpeg integration (video assembly)
5. ⏳ Export endpoint (burn-in)
6. ⏳ Random script feature
7. ⏳ TTS integration (optional)
8. ⏳ Whisper integration (optional)

---

## Development

### Database Studio
```bash
npm run db:studio
```

### Logs
Check console output for errors and progress.

### Testing
Use Postman/Insomnia or curl:
```bash
# Health check
curl http://localhost:3001/api/health

# List projects
curl http://localhost:3001/api/projects

# Create project
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","script":"Hello world"}'
```
