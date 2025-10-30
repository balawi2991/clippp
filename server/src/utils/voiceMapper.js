/**
 * Voice Mapper - Maps UI voice names to Groq TTS voice IDs
 */

const VOICE_MAP = {
  // Male voices
  'male': 'Fritz-PlayAI',
  'male-deep': 'Thunder-PlayAI',
  'male-warm': 'Basil-PlayAI',
  'male-professional': 'Briggs-PlayAI',
  
  // Female voices
  'female': 'Arista-PlayAI',
  'female-elegant': 'Celeste-PlayAI',
  'female-energetic': 'Cheyenne-PlayAI',
  'female-professional': 'Gail-PlayAI',
  
  // Neutral voices
  'neutral': 'Quinn-PlayAI',
  'neutral-indigo': 'Indigo-PlayAI',
  
  // Direct Groq voice IDs (pass through)
  'Aaliyah-PlayAI': 'Aaliyah-PlayAI',
  'Adelaide-PlayAI': 'Adelaide-PlayAI',
  'Angelo-PlayAI': 'Angelo-PlayAI',
  'Arista-PlayAI': 'Arista-PlayAI',
  'Atlas-PlayAI': 'Atlas-PlayAI',
  'Basil-PlayAI': 'Basil-PlayAI',
  'Briggs-PlayAI': 'Briggs-PlayAI',
  'Calum-PlayAI': 'Calum-PlayAI',
  'Celeste-PlayAI': 'Celeste-PlayAI',
  'Cheyenne-PlayAI': 'Cheyenne-PlayAI',
  'Chip-PlayAI': 'Chip-PlayAI',
  'Cillian-PlayAI': 'Cillian-PlayAI',
  'Deedee-PlayAI': 'Deedee-PlayAI',
  'Eleanor-PlayAI': 'Eleanor-PlayAI',
  'Fritz-PlayAI': 'Fritz-PlayAI',
  'Gail-PlayAI': 'Gail-PlayAI',
  'Indigo-PlayAI': 'Indigo-PlayAI',
  'Jennifer-PlayAI': 'Jennifer-PlayAI',
  'Judy-PlayAI': 'Judy-PlayAI',
  'Mamaw-PlayAI': 'Mamaw-PlayAI',
  'Mason-PlayAI': 'Mason-PlayAI',
  'Mikail-PlayAI': 'Mikail-PlayAI',
  'Mitch-PlayAI': 'Mitch-PlayAI',
  'Nia-PlayAI': 'Nia-PlayAI',
  'Quinn-PlayAI': 'Quinn-PlayAI',
  'Ruby-PlayAI': 'Ruby-PlayAI',
  'Thunder-PlayAI': 'Thunder-PlayAI'
};

/**
 * Map UI voice name to Groq TTS voice ID
 * @param {string} voiceName - Voice name from UI (e.g., "female", "male")
 * @returns {string} Groq TTS voice ID (e.g., "Arista-PlayAI")
 */
export function mapVoiceToGroq(voiceName) {
  if (!voiceName) {
    return 'Fritz-PlayAI'; // Default
  }
  
  return VOICE_MAP[voiceName] || 'Fritz-PlayAI';
}

/**
 * Get all available voices
 * @returns {Object} Voice map
 */
export function getAvailableVoices() {
  return VOICE_MAP;
}
