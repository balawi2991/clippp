/**
 * Image Service - Fetch images from Pexels or create placeholders
 */

import { createClient } from 'pexels';
import fs from 'fs';
import path from 'path';
import https from 'https';
import sharp from 'sharp';

const pexelsClient = process.env.PEXELS_API_KEY 
  ? createClient(process.env.PEXELS_API_KEY)
  : null;

/**
 * Search and download image from Pexels
 * @param {string} query - Search query
 * @param {string} outputPath - Output file path
 * @param {Object} options - Image options
 * @returns {Promise<string>} Path to downloaded image
 */
export async function fetchImageFromPexels(query, outputPath, options = {}) {
  const {
    width = 1080,
    height = 1920,
    orientation = 'portrait'
  } = options;

  try {
    if (!pexelsClient || process.env.USE_PEXELS_API !== 'true') {
      console.log('Pexels API disabled, creating placeholder...');
      return createPlaceholderImage(outputPath, query);
    }

    console.log(`Searching Pexels for: "${query}"`);

    // Search for photos
    const result = await pexelsClient.photos.search({
      query,
      per_page: 5,
      orientation
    });

    if (!result.photos || result.photos.length === 0) {
      console.log('No images found, creating placeholder...');
      return createPlaceholderImage(outputPath, query);
    }

    // Get first photo
    const photo = result.photos[0];
    const imageUrl = photo.src.large2x || photo.src.large;

    console.log(`Downloading image: ${photo.photographer}`);

    // Download image
    await downloadImage(imageUrl, outputPath);

    // Resize to exact dimensions
    await sharp(outputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(outputPath + '.resized.png');

    // Replace original with resized
    fs.renameSync(outputPath + '.resized.png', outputPath);

    console.log(`Image saved: ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error('Pexels error:', error);
    console.log('Falling back to placeholder...');
    return createPlaceholderImage(outputPath, query);
  }
}

/**
 * Download image from URL
 * @param {string} url - Image URL
 * @param {string} outputPath - Output path
 * @returns {Promise<void>}
 */
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

/**
 * Create placeholder image with gradient and text
 * @param {string} outputPath - Output path
 * @param {string} text - Text to display
 * @returns {Promise<string>} Path to created image
 */
export async function createPlaceholderImage(outputPath, text = '') {
  const colors = [
    { r: 59, g: 130, b: 246 },   // Blue
    { r: 139, g: 92, b: 246 },   // Purple
    { r: 236, g: 72, b: 153 },   // Pink
    { r: 251, g: 146, b: 60 },   // Orange
    { r: 34, g: 197, b: 94 },    // Green
    { r: 239, g: 68, b: 68 },    // Red
    { r: 245, g: 158, b: 11 },   // Amber
    { r: 20, g: 184, b: 166 }    // Teal
  ];

  // Pick color based on text hash
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[hash % colors.length];

  // Create gradient (darker at top, lighter at bottom)
  const topColor = {
    r: Math.max(0, color.r - 30),
    g: Math.max(0, color.g - 30),
    b: Math.max(0, color.b - 30)
  };

  const bottomColor = {
    r: Math.min(255, color.r + 30),
    g: Math.min(255, color.g + 30),
    b: Math.min(255, color.b + 30)
  };

  // Create gradient image
  const width = 1080;
  const height = 1920;
  const gradient = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    const ratio = y / height;
    const r = Math.round(topColor.r + (bottomColor.r - topColor.r) * ratio);
    const g = Math.round(topColor.g + (bottomColor.g - topColor.g) * ratio);
    const b = Math.round(topColor.b + (bottomColor.b - topColor.b) * ratio);

    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 3;
      gradient[offset] = r;
      gradient[offset + 1] = g;
      gradient[offset + 2] = b;
    }
  }

  await sharp(gradient, {
    raw: {
      width,
      height,
      channels: 3
    }
  })
  .png()
  .toFile(outputPath);

  return outputPath;
}

/**
 * Fetch images for multiple scenes
 * @param {Array} scenes - Array of scene objects
 * @param {string} outputDir - Output directory
 * @param {Object} options - Image options
 * @returns {Promise<Array>} Array of image paths
 */
export async function fetchImagesForScenes(scenes, outputDir, options = {}) {
  const images = [];

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const imagePath = path.join(outputDir, `scene_${i}.png`);

    try {
      // Use imagePrompt or extract keywords from text
      const query = scene.imagePrompt || extractKeywords(scene.text);
      
      await fetchImageFromPexels(query, imagePath, options);
      images.push(imagePath);
    } catch (error) {
      console.error(`Failed to fetch image for scene ${i}:`, error);
      // Create placeholder on error
      await createPlaceholderImage(imagePath, scene.text);
      images.push(imagePath);
    }
  }

  return images;
}

/**
 * Extract keywords from text for image search
 * @param {string} text - Text to extract keywords from
 * @returns {string} Keywords for search
 */
function extractKeywords(text) {
  // Remove common words and punctuation
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
    'that', 'these', 'those', 'it', 'its', 'you', 'your', 'we', 'our'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Take first 2-3 meaningful words
  return words.slice(0, 3).join(' ') || 'abstract background';
}
