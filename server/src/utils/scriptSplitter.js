/**
 * Script Splitter - Rule-based splitting into scenes
 * Target: 6-10 seconds per scene
 * Note: targetDuration is a guideline, not a hard limit
 */

const WORDS_PER_SECOND = 2.5; // Average speaking rate
const MIN_SCENE_DURATION = 6;
const MAX_SCENE_DURATION = 10;

/**
 * Split script into scenes based on sentences and duration
 * @param {string} script - The input script
 * @param {number} targetDuration - Target total duration in seconds
 * @returns {Array} Array of scene objects
 */
export function splitScriptIntoScenes(script, targetDuration = 30) {
  // Clean and normalize script
  const cleanScript = script.trim().replace(/\s+/g, ' ');
  
  // Split into sentences (by period, exclamation, question mark)
  const sentences = cleanScript
    .split(/([.!?]+)/)
    .reduce((acc, part, i, arr) => {
      if (i % 2 === 0 && part.trim()) {
        const punctuation = arr[i + 1] || '';
        acc.push((part + punctuation).trim());
      }
      return acc;
    }, [])
    .filter(s => s.length > 0);

  if (sentences.length === 0) {
    throw new Error('Script is empty or invalid');
  }

  // Calculate duration for each sentence
  const sentencesWithDuration = sentences.map(text => ({
    text,
    wordCount: text.split(/\s+/).length,
    duration: text.split(/\s+/).length / WORDS_PER_SECOND
  }));

  // Group sentences into scenes
  const scenes = [];
  let currentScene = {
    texts: [],
    duration: 0,
    wordCount: 0
  };

  for (const sentence of sentencesWithDuration) {
    const potentialDuration = currentScene.duration + sentence.duration;

    // If adding this sentence exceeds max scene duration, start new scene
    if (currentScene.texts.length > 0 && potentialDuration > MAX_SCENE_DURATION) {
      scenes.push(currentScene);
      currentScene = {
        texts: [sentence.text],
        duration: sentence.duration,
        wordCount: sentence.wordCount
      };
    } else {
      currentScene.texts.push(sentence.text);
      currentScene.duration += sentence.duration;
      currentScene.wordCount += sentence.wordCount;
    }
  }

  // Add last scene
  if (currentScene.texts.length > 0) {
    scenes.push(currentScene);
  }

  // Merge very short scenes
  const mergedScenes = [];
  let tempScene = null;

  for (const scene of scenes) {
    if (scene.duration < MIN_SCENE_DURATION && tempScene) {
      // Merge with previous scene
      tempScene.texts.push(...scene.texts);
      tempScene.duration += scene.duration;
      tempScene.wordCount += scene.wordCount;
    } else if (scene.duration < MIN_SCENE_DURATION) {
      // Store for potential merge
      tempScene = scene;
    } else {
      if (tempScene) {
        mergedScenes.push(tempScene);
        tempScene = null;
      }
      mergedScenes.push(scene);
    }
  }

  if (tempScene) {
    if (mergedScenes.length > 0) {
      // Merge with last scene
      const lastScene = mergedScenes[mergedScenes.length - 1];
      lastScene.texts.push(...tempScene.texts);
      lastScene.duration += tempScene.duration;
      lastScene.wordCount += tempScene.wordCount;
    } else {
      mergedScenes.push(tempScene);
    }
  }

  // Calculate cumulative timing
  let cumulativeTime = 0;
  const finalScenes = mergedScenes.map((scene, index) => {
    const startTime = cumulativeTime;
    const endTime = startTime + scene.duration;
    cumulativeTime = endTime;

    return {
      index,
      text: scene.texts.join(' '),
      duration: scene.duration,
      startTime,
      endTime,
      wordCount: scene.wordCount,
      imagePrompt: generateImagePrompt(scene.texts.join(' '), index)
    };
  });

  // Check if script is within reasonable range of target
  const totalDuration = cumulativeTime;
  const targetMin = targetDuration * 0.9; // 90% of target
  const targetMax = targetDuration * 1.2; // 120% of target (flexible)
  
  if (totalDuration >= targetMin && totalDuration <= targetMax) {
    // Perfect! Within acceptable range
    console.log(`Script duration (${totalDuration.toFixed(1)}s) is within target range (${targetMin.toFixed(0)}-${targetMax.toFixed(0)}s)`);
  } else if (totalDuration > targetMax) {
    // Script is longer than expected, but that's OK - just inform
    console.log(`Script duration (${totalDuration.toFixed(1)}s) exceeds target (${targetDuration}s), but keeping full content`);
  } else {
    // Script is shorter than expected, that's fine too
    console.log(`Script duration (${totalDuration.toFixed(1)}s) is shorter than target (${targetDuration}s)`);
  }

  // Split single scenes into multiple scenes for variety
  if (finalScenes.length === 1 && totalDuration >= MIN_SCENE_DURATION) {
    console.log(`Single scene detected (${totalDuration.toFixed(1)}s), splitting into multiple scenes...`);
    
    const scene = finalScenes[0];
    const words = scene.text.split(/\s+/);
    
    // Calculate how many scenes we should create (aim for 6-10s per scene)
    const targetSceneCount = Math.max(2, Math.ceil(scene.duration / MAX_SCENE_DURATION));
    const wordsPerScene = Math.ceil(words.length / targetSceneCount);
    const durationPerScene = scene.duration / targetSceneCount;
    
    const splitScenes = [];
    let splitTime = 0;
    
    for (let i = 0; i < targetSceneCount; i++) {
      const sceneWords = words.slice(i * wordsPerScene, (i + 1) * wordsPerScene);
      if (sceneWords.length === 0) break;
      
      const sceneText = sceneWords.join(' ');
      const startTime = splitTime;
      const endTime = startTime + durationPerScene;
      
      splitScenes.push({
        index: i,
        text: sceneText,
        duration: durationPerScene,
        startTime,
        endTime,
        wordCount: sceneWords.length,
        imagePrompt: generateImagePrompt(sceneText, i)
      });
      
      splitTime = endTime;
    }
    
    console.log(`Split into ${splitScenes.length} scenes (${splitTime.toFixed(1)}s total)`);
    return splitScenes;
  }

  console.log(`Final: ${finalScenes.length} scenes, ${totalDuration.toFixed(1)}s total`);
  return finalScenes;
}

/**
 * Calculate recommended word count for target duration
 * @param {number} targetDuration - Target duration in seconds
 * @returns {number} Recommended word count
 */
export function calculateRecommendedWordCount(targetDuration) {
  return Math.round(targetDuration * WORDS_PER_SECOND);
}

/**
 * Estimate duration from word count
 * @param {number} wordCount - Number of words
 * @returns {number} Estimated duration in seconds
 */
export function estimateDuration(wordCount) {
  return wordCount / WORDS_PER_SECOND;
}

/**
 * Generate image prompt from scene text
 * @param {string} text - Scene text
 * @param {number} index - Scene index
 * @returns {string} Image prompt
 */
function generateImagePrompt(text, index) {
  // Extract key nouns/concepts (simple approach)
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Take first few meaningful words
  const keywords = words.slice(0, 3).join(' ');
  
  return keywords || `scene ${index + 1}`;
}

/**
 * Split text into caption blocks (2-3 words each)
 * @param {string} text - Text to split
 * @param {number} startTime - Start time in seconds
 * @param {number} duration - Total duration in seconds
 * @returns {Array} Array of caption blocks
 */
export function splitIntoCaptionBlocks(text, startTime, duration) {
  const words = text.trim().split(/\s+/);
  const blocks = [];
  const wordsPerBlock = 2; // 2-3 words per block
  
  const totalBlocks = Math.ceil(words.length / wordsPerBlock);
  const timePerBlock = duration / totalBlocks;

  for (let i = 0; i < words.length; i += wordsPerBlock) {
    const blockWords = words.slice(i, i + wordsPerBlock);
    const blockIndex = Math.floor(i / wordsPerBlock);
    const blockStart = startTime + (blockIndex * timePerBlock);
    const blockEnd = blockStart + timePerBlock;

    blocks.push({
      index: blockIndex,
      text: blockWords.join(' '),
      startTime: blockStart,
      endTime: blockEnd,
      words: blockWords.map((word, wordIndex) => {
        const wordDuration = timePerBlock / blockWords.length;
        const wordStart = blockStart + (wordIndex * wordDuration);
        const wordEnd = wordStart + wordDuration;
        
        return {
          w: word,
          s: wordStart,
          e: wordEnd
        };
      })
    });
  }

  return blocks;
}

/**
 * Generate random script for testing
 * @returns {string} Random script
 */
export function generateRandomScript() {
  const templates = [
    "Success is not final. Failure is not fatal. It is the courage to continue that counts. Every day is a new opportunity to grow and improve.",
    "The future belongs to those who believe in the beauty of their dreams. Take action today and make your vision a reality.",
    "Innovation distinguishes between a leader and a follower. Think different and create something amazing that changes the world.",
    "Your time is limited. Don't waste it living someone else's life. Follow your passion and make every moment count.",
    "The only way to do great work is to love what you do. Find your purpose and pursue it with dedication and enthusiasm.",
    "Believe you can and you're halfway there. Confidence and determination are the keys to achieving your goals.",
    "Quality is not an act. It is a habit. Excellence comes from consistent effort and attention to detail every single day.",
    "The best time to plant a tree was twenty years ago. The second best time is now. Start today and build your future."
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}
