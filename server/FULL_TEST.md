# Full Backend Test - Generate & Export

## Complete Flow Test

### 1. Get Random Script
```bash
curl http://localhost:3001/api/scripts/random
```

Response:
```json
{
  "script": "Success is not final. Failure is not fatal..."
}
```

---

### 2. Create Project
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Test Video",
    "script": "Success is not final. Failure is not fatal. It is the courage to continue that counts. Every day is a new opportunity to grow and improve."
  }'
```

Response:
```json
{
  "id": "abc-123-def",
  "title": "My Test Video",
  "status": "draft",
  ...
}
```

**Save the `id`!**

---

### 3. Start Generation
```bash
curl -X POST http://localhost:3001/api/projects/abc-123-def/generate
```

Response:
```json
{
  "message": "Generation started",
  "jobId": "job-xyz",
  "job": {
    "id": "job-xyz",
    "status": "queued",
    "progress": 0,
    "steps": [...]
  }
}
```

**Save the `jobId`!**

---

### 4. Poll Job Progress
```bash
# Check every 2 seconds
curl http://localhost:3001/api/jobs/job-xyz
```

Progress updates:
```json
{
  "status": "running",
  "progress": 25,
  "currentStep": "voice",
  "steps": [
    { "id": "voice", "completed": true },
    { "id": "images", "completed": false },
    ...
  ]
}
```

Wait until `status: "completed"` and `progress: 100`

---

### 5. Get Generated Project
```bash
curl http://localhost:3001/api/projects/abc-123-def
```

Response:
```json
{
  "id": "abc-123-def",
  "status": "ready",
  "scenes": [
    {
      "index": 0,
      "text": "Success is not final. Failure is not fatal.",
      "duration": 6.8,
      "startTime": 0,
      "endTime": 6.8,
      "imagePrompt": "success final failure"
    },
    ...
  ],
  "captions": [
    {
      "index": 0,
      "text": "Success is",
      "startTime": 0,
      "endTime": 1.13,
      "words": [
        { "w": "Success", "s": 0, "e": 0.565 },
        { "w": "is", "s": 0.565, "e": 1.13 }
      ]
    },
    ...
  ]
}
```

---

### 6. Start Export
```bash
curl -X POST http://localhost:3001/api/projects/abc-123-def/export
```

Response:
```json
{
  "message": "Export started",
  "jobId": "export-job-xyz",
  "job": {
    "id": "export-job-xyz",
    "status": "queued",
    "progress": 0,
    "steps": [
      { "id": "burn_in", "label": "Burning captions", "completed": false },
      { "id": "export", "label": "Exporting video", "completed": false }
    ]
  }
}
```

---

### 7. Poll Export Progress
```bash
curl http://localhost:3001/api/jobs/export-job-xyz
```

Progress updates:
```json
{
  "status": "running",
  "progress": 50,
  "currentStep": "burn_in",
  "logs": [
    { "timestamp": "...", "level": "info", "message": "Rendering caption overlays..." },
    { "timestamp": "...", "level": "info", "message": "Rendered 12 overlays" }
  ]
}
```

---

### 8. Get Exported Project
```bash
curl http://localhost:3001/api/projects/abc-123-def
```

Response:
```json
{
  "id": "abc-123-def",
  "status": "exported",
  "captions": [
    {
      "index": 0,
      "text": "Success is",
      "overlayPath": "/path/to/storage/abc-123-def/overlays/block_0.webp"
    },
    ...
  ],
  "assets": [
    {
      "kind": "export",
      "path": "/path/to/storage/abc-123-def/exports/final.mp4",
      "filename": "final.mp4"
    }
  ]
}
```

---

## Automated Test Script

```bash
#!/bin/bash

echo "=== Full Backend Test ==="

# 1. Get random script
echo -e "\n1. Getting random script..."
SCRIPT=$(curl -s http://localhost:3001/api/scripts/random | jq -r '.script')
echo "Script: $SCRIPT"

# 2. Create project
echo -e "\n2. Creating project..."
PROJECT_ID=$(curl -s -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test Video\",\"script\":\"$SCRIPT\"}" \
  | jq -r '.id')
echo "Project ID: $PROJECT_ID"

# 3. Start generation
echo -e "\n3. Starting generation..."
GEN_JOB_ID=$(curl -s -X POST http://localhost:3001/api/projects/$PROJECT_ID/generate \
  | jq -r '.jobId')
echo "Generation Job ID: $GEN_JOB_ID"

# 4. Poll generation
echo -e "\n4. Polling generation progress..."
while true; do
  STATUS=$(curl -s http://localhost:3001/api/jobs/$GEN_JOB_ID | jq -r '.status')
  PROGRESS=$(curl -s http://localhost:3001/api/jobs/$GEN_JOB_ID | jq -r '.progress')
  STEP=$(curl -s http://localhost:3001/api/jobs/$GEN_JOB_ID | jq -r '.currentStep')
  
  echo "  Status: $STATUS | Progress: $PROGRESS% | Step: $STEP"
  
  if [ "$STATUS" = "completed" ]; then
    echo "  ✅ Generation completed!"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "  ❌ Generation failed!"
    exit 1
  fi
  
  sleep 2
done

# 5. Get project details
echo -e "\n5. Getting project details..."
SCENES_COUNT=$(curl -s http://localhost:3001/api/projects/$PROJECT_ID | jq '.scenes | length')
CAPTIONS_COUNT=$(curl -s http://localhost:3001/api/projects/$PROJECT_ID | jq '.captions | length')
echo "  Scenes: $SCENES_COUNT"
echo "  Captions: $CAPTIONS_COUNT"

# 6. Start export
echo -e "\n6. Starting export..."
EXPORT_JOB_ID=$(curl -s -X POST http://localhost:3001/api/projects/$PROJECT_ID/export \
  | jq -r '.jobId')
echo "Export Job ID: $EXPORT_JOB_ID"

# 7. Poll export
echo -e "\n7. Polling export progress..."
while true; do
  STATUS=$(curl -s http://localhost:3001/api/jobs/$EXPORT_JOB_ID | jq -r '.status')
  PROGRESS=$(curl -s http://localhost:3001/api/jobs/$EXPORT_JOB_ID | jq -r '.progress')
  STEP=$(curl -s http://localhost:3001/api/jobs/$EXPORT_JOB_ID | jq -r '.currentStep')
  
  echo "  Status: $STATUS | Progress: $PROGRESS% | Step: $STEP"
  
  if [ "$STATUS" = "completed" ]; then
    echo "  ✅ Export completed!"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "  ❌ Export failed!"
    exit 1
  fi
  
  sleep 2
done

# 8. Final check
echo -e "\n8. Final project status..."
FINAL_STATUS=$(curl -s http://localhost:3001/api/projects/$PROJECT_ID | jq -r '.status')
OVERLAYS_COUNT=$(curl -s http://localhost:3001/api/projects/$PROJECT_ID | jq '[.captions[] | select(.overlayPath != null)] | length')
echo "  Status: $FINAL_STATUS"
echo "  Overlays rendered: $OVERLAYS_COUNT"

echo -e "\n=== Test Complete! ==="
echo "Project ID: $PROJECT_ID"
echo "Check storage folder: ./storage/$PROJECT_ID/"
```

Save as `test.sh` and run:
```bash
chmod +x test.sh
./test.sh
```

---

## Expected Results

### Storage Structure After Test:
```
storage/
└── {PROJECT_ID}/
    ├── inputs/
    │   └── script.txt
    ├── captions/
    │   └── blocks.json
    ├── overlays/
    │   ├── block_0.webp
    │   ├── block_1.webp
    │   ├── block_2.webp
    │   └── ...
    ├── exports/
    │   └── final.mp4 (placeholder)
    └── project.json
```

### Database Records:
- 1 Project (status: exported)
- 3-5 Scenes (depending on script)
- 10-15 Captions (2-3 words each)
- 2 Jobs (generate + export, both completed)
- Multiple Assets (overlays + export)

---

## Troubleshooting

### Generation fails?
```bash
# Check logs
curl http://localhost:3001/api/jobs/{JOB_ID} | jq '.logs'
```

### Export fails?
```bash
# Check if project is ready
curl http://localhost:3001/api/projects/{PROJECT_ID} | jq '.status'

# Should be "ready" before export
```

### Canvas rendering issues?
```bash
# Check if overlays were created
ls -la storage/{PROJECT_ID}/overlays/

# Check caption overlay paths
curl http://localhost:3001/api/projects/{PROJECT_ID} | jq '.captions[0].overlayPath'
```

---

## Next Steps

1. ✅ Test generation flow
2. ✅ Test export flow
3. ✅ Verify overlay rendering
4. ⏳ Integrate FFmpeg for real video export
5. ⏳ Connect frontend to backend
