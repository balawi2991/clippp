# Caption System Architecture

## Overview
The caption rendering system is designed to ensure **100% consistency** between Preview (Frontend) and Export (Backend).

## Key Principles

### 1. **Shared Constants**
All styling values are defined once and shared between Frontend and Backend:
- `src/constants/captionStyles.ts` (Frontend)
- `server/src/constants/captionStyles.js` (Backend)

⚠️ **IMPORTANT**: These files must be kept in sync!

### 2. **Separation of Concerns**
Each rendering mode has its own dedicated renderer:

**Frontend:**
- `FullTextRenderer.tsx` - Full text mode
- `KaraokeRenderer.tsx` - Karaoke mode
- `WordByWordRenderer.tsx` - Word-by-word mode

**Backend:**
- `fullTextRenderer.js` - Full text mode
- `karaokeRenderer.js` - Karaoke mode
- `wordByWordRenderer.js` - Word-by-word mode

### 3. **Shared Utilities**
Common functionality is extracted into reusable utilities:

**Frontend:**
- `useScaledValues.ts` - Calculate scaled CSS values
- `useTextShadow.ts` - Generate text shadow CSS
- `CaptionContainer.tsx` - Shared container component

**Backend:**
- `textEffects.js` - Text rendering utilities
- `captionStyles.js` - Style constants

## File Structure

```
Frontend:
src/
├── constants/
│   └── captionStyles.ts          ← Shared constants
├── components/player/
│   ├── CaptionOverlay.tsx        ← Main router
│   └── caption-renderers/
│       ├── FullTextRenderer.tsx
│       ├── KaraokeRenderer.tsx
│       ├── WordByWordRenderer.tsx
│       └── shared/
│           ├── CaptionContainer.tsx
│           ├── useScaledValues.ts
│           └── useTextShadow.ts

Backend:
server/src/
├── constants/
│   └── captionStyles.js          ← Shared constants (sync with Frontend!)
├── utils/
│   ├── canvasRenderer.js         ← Main entry point
│   └── renderers/
│       ├── fullTextRenderer.js
│       ├── karaokeRenderer.js
│       ├── wordByWordRenderer.js
│       └── shared/
│           └── textEffects.js
```

## How It Works

### Preview (Frontend)
1. `CaptionOverlay.tsx` receives caption data
2. Routes to appropriate renderer based on `displayMode`
3. Renderer uses shared constants and utilities
4. Renders caption with CSS transforms

### Export (Backend)
1. `canvasRenderer.js` receives caption data
2. Routes to appropriate renderer based on `displayMode`
3. Renderer uses **same constants** as Frontend
4. Renders caption to Canvas → WebP image
5. FFmpeg burns images to video

## Adding New Styles

### 1. Update Constants
```typescript
// src/constants/captionStyles.ts
export const CAPTION_STYLES = {
  // ... existing styles
  
  NEW_STYLE: {
    PADDING: { horizontal: 16, vertical: 6 },
    BORDER_RADIUS: 14,
  },
};
```

```javascript
// server/src/constants/captionStyles.js
// Copy the same values!
```

### 2. Update Renderers
Update both Frontend and Backend renderers to use the new constants.

### 3. Test Both
- Test in Preview (Frontend)
- Export and verify (Backend)
- Ensure they match perfectly!

## Maintenance Guidelines

### ✅ DO:
- Use shared constants for all styling values
- Keep Frontend and Backend constants in sync
- Extract common logic into utilities
- Document any changes

### ❌ DON'T:
- Use magic numbers directly in renderers
- Duplicate code between renderers
- Modify one side without updating the other
- Skip testing both Preview and Export

## Benefits

1. **No Code Duplication**: Each value defined once
2. **Perfect Consistency**: Preview = Export always
3. **Easy Maintenance**: Change once, applies everywhere
4. **Clear Organization**: Easy to find and modify code
5. **Testable**: Each component is small and focused

## Troubleshooting

### Preview and Export don't match?
1. Check if constants are in sync
2. Verify both renderers use the same logic
3. Check for hardcoded values

### Need to change padding/radius?
1. Update `captionStyles.ts` (Frontend)
2. Update `captionStyles.js` (Backend)
3. Test both Preview and Export

### Adding new display mode?
1. Add constants if needed
2. Create renderer in both Frontend and Backend
3. Update main router files
4. Test thoroughly
