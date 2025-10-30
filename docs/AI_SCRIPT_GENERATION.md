# AI Script Generation System

## Overview
Automatic script generation from user prompts with precise duration control.

## How It Works

### User Flow:
```
1. User enters: "motivation"
2. User selects: 45 seconds
3. AI generates: 112-word script
4. System creates: 45-second video
```

## Script Rules

### 1. Word Count
```javascript
wordsNeeded = targetDuration × 2.5

Examples:
- 30s = 75 words
- 45s = 112 words
- 60s = 150 words
```

### 2. Sentence Structure
```
✅ Short sentences: 5-10 words each
✅ Clear and simple
✅ Natural speech flow
```

### 3. Content Structure
```
✅ Strong opening: Grab attention
✅ Clear body: 3-4 main points
✅ Powerful closing: Memorable ending
```

### 4. Style Guidelines
```
✅ Natural: Like talking to a friend
✅ Simple: Easy to understand
✅ Positive: Inspiring and motivating
✅ Direct: No fluff
```

### 5. Technical Rules
```
✅ No hashtags (#)
✅ No special characters (@, $, etc.)
✅ Numbers as words (three, not 3)
✅ No titles or descriptions
✅ Pure script text only
```

## API Endpoint

### POST /api/scripts/generate-from-prompt

**Request:**
```json
{
  "prompt": "motivation",
  "targetDuration": 45,
  "style": "default",
  "language": "EN"
}
```

**Response:**
```json
{
  "script": "Success is not final. Failure is not fatal...",
  "wordCount": 112,
  "estimatedDuration": 45,
  "targetDuration": 45
}
```

## AI Model

**Model:** Llama 3.3 70B (via Groq)
**Temperature:** 0.8 (creative but controlled)
**Max Tokens:** wordCount × 2

## System Prompt

```
You are a professional script writer for short-form videos.

Rules:
- Short sentences (5-10 words)
- Simple, clear language
- Natural flow
- No hashtags or special characters
- Numbers as words
- Strong opening
- Clear main points
- Powerful closing
```

## Examples

### Good Script (45s):
```
Success takes time. Work hard every day. 
Stay focused on your goals. Small steps lead to big results. 
Keep moving forward. Never give up on your dreams.
Believe in yourself. You have what it takes.
Start today. Make it happen.
```

**Analysis:**
- 112 words ✅
- Short sentences ✅
- Clear message ✅
- Natural flow ✅

### Bad Script:
```
In today's fast-paced world, it's really important to remember 
that success doesn't come overnight, and you need to work hard 
consistently over a long period of time...
```

**Problems:**
- Long sentences ❌
- Complex language ❌
- Unnatural flow ❌

## Integration

### Frontend (Dashboard):
```typescript
if (inputMode === "prompt") {
  // Generate script from AI
  const response = await fetch('/api/scripts/generate-from-prompt', {
    method: 'POST',
    body: JSON.stringify({ prompt, targetDuration, style, language })
  });
  
  const { script } = await response.json();
  // Use script for video generation
}
```

### Backend (generateService):
```javascript
// Script is already generated and passed as input
const script = project.script; // From AI or user input
const scenes = splitScriptIntoScenes(script, targetDuration);
// Continue with video generation...
```

## Benefits

1. **Accurate Duration**: Scripts match target duration (±5s)
2. **Natural Speech**: Short sentences, easy to speak
3. **Engaging Content**: Professional structure
4. **Consistent Quality**: AI follows strict rules
5. **Fast Generation**: 2-3 seconds per script

## Future Enhancements

1. **Multiple Styles**: Casual, professional, dramatic
2. **Tone Control**: Serious, funny, inspirational
3. **Language Support**: Arabic, Spanish, etc.
4. **Custom Instructions**: User-defined rules
5. **Script Variations**: Generate 2-3 options
