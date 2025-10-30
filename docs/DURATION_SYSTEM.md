# Duration System - Flexible Target Approach

## Overview
The system uses a **flexible target duration** approach instead of hard limits.

## Philosophy

### Before:
```
User selects: 30 seconds
System enforces: EXACTLY 30 seconds (cuts content if needed) ❌
```

### Now:
```
User selects: 30 seconds
System understands: "approximately 30 seconds" ✅
Result: 30-36 seconds (natural, no cutting)
```

## How It Works

### 1. Script Estimation
```javascript
// Calculate recommended word count
targetDuration = 30s
recommendedWords = 30 * 2.5 = 75 words

// Flexible range
acceptable = 68-82 words (90%-110%)
```

### 2. Duration Calculation
```javascript
// Estimate from word count
wordCount = 75
estimatedDuration = 75 / 2.5 = 30s

// Flexible range
acceptable = 27-36s (90%-120%)
```

### 3. No Cutting
```
If script is 35s and target is 30s:
✅ Keep full content (within 120% of target)
❌ Don't cut or trim

If script is 50s and target is 30s:
⚠️ Inform user but keep full content
```

## API Endpoints

### POST /api/scripts/estimate
Estimate duration from script text.

**Request:**
```json
{
  "script": "Your script text here..."
}
```

**Response:**
```json
{
  "wordCount": 75,
  "estimatedDuration": 30,
  "estimatedRange": {
    "min": 27,
    "max": 33
  }
}
```

### GET /api/scripts/recommend-words?duration=30
Get recommended word count for target duration.

**Response:**
```json
{
  "targetDuration": 30,
  "recommendedWords": 75,
  "range": {
    "min": 68,
    "max": 82
  }
}
```

## Frontend Integration

### Script Estimator Component
Shows real-time duration estimation as user types:

```tsx
<ScriptEstimator script={inputText} targetDuration={30} />
```

**Display:**
```
75 words ≈ 27-33s ✅ (green if within target)
120 words ≈ 43-53s ⚠️ (orange if outside target)
```

## Benefits

1. **Natural Content**: No artificial cutting or trimming
2. **User-Friendly**: Clear expectations (approximate, not exact)
3. **Flexible**: Accommodates natural speech variations
4. **Transparent**: Shows estimation before generation

## Constants

```javascript
WORDS_PER_SECOND = 2.5  // Average speaking rate
MIN_SCENE_DURATION = 6  // Minimum scene length
MAX_SCENE_DURATION = 10 // Maximum scene length

// Flexible ranges
TARGET_MIN = targetDuration * 0.9   // 90% of target
TARGET_MAX = targetDuration * 1.2   // 120% of target
```

## Examples

### Example 1: Perfect Match
```
Target: 30s
Script: 75 words
Result: 30s ✅
```

### Example 2: Slightly Longer
```
Target: 30s
Script: 85 words
Result: 34s ✅ (within 120%)
```

### Example 3: Much Longer
```
Target: 30s
Script: 150 words
Result: 60s ⚠️ (user informed, but not cut)
```

## Future Enhancements

1. **AI Script Generation**: Generate scripts with exact word count
2. **Smart Suggestions**: "Your script is 50s, consider target of 45-60s"
3. **Voice Speed Adjustment**: Slight speed variations for better fit
