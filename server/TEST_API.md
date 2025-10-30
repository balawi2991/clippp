# API Testing Guide

## Test the Backend APIs

### 1. Health Check
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-30T...",
  "features": {
    "groqTTS": false,
    "whisperLocal": false,
    "gladiaAlignment": false,
    "aiScriptSplitter": false
  }
}
```

---

### 2. Get Random Script
```bash
curl http://localhost:3001/api/scripts/random
```

Expected response:
```json
{
  "script": "Success is not final. Failure is not fatal..."
}
```

---

### 3. Create Project
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Video",
    "script": "Success is not final. Failure is not fatal. It is the courage to continue that counts. Every day is a new opportunity to grow and improve."
  }'
```

Expected response:
```json
{
  "id": "uuid-here",
  "title": "My First Video",
  "status": "draft",
  "style": { ... },
  "settings": { ... },
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Copy the `id` for next steps!**

---

### 4. List Projects
```bash
curl http://localhost:3001/api/projects
```

---

### 5. Get Project Details
```bash
curl http://localhost:3001/api/projects/{PROJECT_ID}
```

---

### 6. Start Generation
```bash
curl -X POST http://localhost:3001/api/projects/{PROJECT_ID}/generate
```

Expected response:
```json
{
  "message": "Generation started",
  "jobId": "job-uuid-here",
  "job": {
    "id": "...",
    "status": "queued",
    "progress": 0,
    "steps": [...]
  }
}
```

**Copy the `jobId` for next step!**

---

### 7. Check Job Progress
```bash
curl http://localhost:3001/api/jobs/{JOB_ID}
```

Expected response (while running):
```json
{
  "id": "...",
  "status": "running",
  "progress": 50,
  "currentStep": "subtitles",
  "steps": [
    { "id": "voice", "label": "Voice generation", "completed": true },
    { "id": "images", "label": "Images generation", "completed": true },
    { "id": "subtitles", "label": "Subtitle integration", "completed": false },
    { "id": "finalizing", "label": "Finalizing video edits", "completed": false }
  ],
  "logs": [...]
}
```

**Keep polling until `status: "completed"`**

---

### 8. Get Project After Generation
```bash
curl http://localhost:3001/api/projects/{PROJECT_ID}
```

Expected response:
```json
{
  "id": "...",
  "title": "My First Video",
  "status": "ready",
  "scenes": [
    {
      "index": 0,
      "text": "Success is not final. Failure is not fatal.",
      "duration": 6.5,
      "startTime": 0,
      "endTime": 6.5
    },
    ...
  ],
  "captions": [
    {
      "index": 0,
      "text": "Success is",
      "startTime": 0,
      "endTime": 1.08,
      "words": [
        { "w": "Success", "s": 0, "e": 0.54 },
        { "w": "is", "s": 0.54, "e": 1.08 }
      ]
    },
    ...
  ]
}
```

---

## Full Flow Test

```bash
# 1. Get random script
SCRIPT=$(curl -s http://localhost:3001/api/scripts/random | jq -r '.script')

# 2. Create project
PROJECT_ID=$(curl -s -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test Video\",\"script\":\"$SCRIPT\"}" \
  | jq -r '.id')

echo "Project ID: $PROJECT_ID"

# 3. Start generation
JOB_ID=$(curl -s -X POST http://localhost:3001/api/projects/$PROJECT_ID/generate \
  | jq -r '.jobId')

echo "Job ID: $JOB_ID"

# 4. Poll job status (every 2 seconds)
while true; do
  STATUS=$(curl -s http://localhost:3001/api/jobs/$JOB_ID | jq -r '.status')
  PROGRESS=$(curl -s http://localhost:3001/api/jobs/$JOB_ID | jq -r '.progress')
  echo "Status: $STATUS, Progress: $PROGRESS%"
  
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  
  sleep 2
done

# 5. Get final project
curl -s http://localhost:3001/api/projects/$PROJECT_ID | jq
```

---

## Expected Timeline

- **Voice generation**: ~2 seconds (placeholder)
- **Images generation**: ~2 seconds (placeholder)
- **Subtitle integration**: ~1 second
- **Finalizing**: ~1 second

**Total**: ~6-8 seconds for generation

---

## Troubleshooting

### Server not responding?
```bash
# Check if server is running
curl http://localhost:3001/api/health

# Check server logs
# (see terminal where you ran `npm run dev`)
```

### Job stuck?
```bash
# Check job logs
curl http://localhost:3001/api/jobs/{JOB_ID} | jq '.logs'
```

### Database issues?
```bash
cd server
npx prisma studio
# Opens database viewer in browser
```
