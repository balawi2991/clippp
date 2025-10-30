/**
 * Job Service - Manages generation and export jobs
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// In-memory job queue (simple implementation)
const jobQueue = new Map();

/**
 * Create a new job
 * @param {string} projectId - Project ID
 * @param {string} type - Job type (generate/export)
 * @returns {Object} Created job
 */
export async function createJob(projectId, type) {
  const steps = type === 'generate' 
    ? [
        { id: 'voice', label: 'Voice generation', completed: false },
        { id: 'images', label: 'Images generation', completed: false },
        { id: 'subtitles', label: 'Subtitle integration', completed: false },
        { id: 'finalizing', label: 'Finalizing video edits', completed: false }
      ]
    : [
        { id: 'burn_in', label: 'Burning captions', completed: false },
        { id: 'export', label: 'Exporting video', completed: false }
      ];

  const job = await prisma.job.create({
    data: {
      id: uuidv4(),
      projectId,
      type,
      status: 'queued',
      progress: 0,
      currentStep: steps[0].id,
      stepsJson: JSON.stringify(steps),
      logsJson: JSON.stringify([])
    }
  });

  return {
    ...job,
    steps: JSON.parse(job.stepsJson),
    logs: []
  };
}

/**
 * Update job progress
 * @param {string} jobId - Job ID
 * @param {number} progress - Progress (0-100)
 * @param {number} stepIndex - Current step index
 * @param {string} status - Job status
 */
export async function updateJobProgress(jobId, progress, stepIndex, status = 'running') {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Job not found');

  const steps = JSON.parse(job.stepsJson);
  
  // Mark completed steps
  for (let i = 0; i <= stepIndex && i < steps.length; i++) {
    steps[i].completed = true;
  }

  const currentStep = steps[stepIndex]?.id || steps[steps.length - 1].id;

  await prisma.job.update({
    where: { id: jobId },
    data: {
      progress,
      currentStep,
      status,
      stepsJson: JSON.stringify(steps)
    }
  });
}

/**
 * Complete job
 * @param {string} jobId - Job ID
 * @param {boolean} success - Whether job succeeded
 * @param {string} errorText - Error message if failed
 */
export async function completeJob(jobId, success = true, errorText = null) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Job not found');

  const steps = JSON.parse(job.stepsJson);
  
  if (success) {
    // Mark all steps as completed
    steps.forEach(step => step.completed = true);
  }

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: success ? 'completed' : 'failed',
      progress: success ? 100 : job.progress,
      stepsJson: JSON.stringify(steps),
      errorText,
      completedAt: new Date()
    }
  });
  
  console.log(`Job ${jobId} ${success ? 'completed' : 'failed'}!`);
}

/**
 * Add log to job
 * @param {string} jobId - Job ID
 * @param {string} level - Log level (info/warn/error)
 * @param {string} message - Log message
 */
export async function addJobLog(jobId, level, message) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return;

  const logs = job.logsJson ? JSON.parse(job.logsJson) : [];
  logs.push({
    timestamp: new Date().toISOString(),
    level,
    message
  });

  await prisma.job.update({
    where: { id: jobId },
    data: {
      logsJson: JSON.stringify(logs)
    }
  });
}

/**
 * Get job by ID
 * @param {string} jobId - Job ID
 * @returns {Object} Job with parsed fields
 */
export async function getJob(jobId) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          status: true
        }
      }
    }
  });

  if (!job) return null;

  return {
    ...job,
    steps: JSON.parse(job.stepsJson),
    logs: job.logsJson ? JSON.parse(job.logsJson) : []
  };
}

/**
 * Simulate async job processing
 * @param {Function} processor - Async function to process
 * @param {string} jobId - Job ID
 */
export async function processJobAsync(processor, jobId) {
  // Run in background (non-blocking)
  setTimeout(async () => {
    try {
      console.log(`Starting job ${jobId}...`);
      await processor(jobId);
      console.log(`Job ${jobId} completed!`);
    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
      await completeJob(jobId, false, error.message);
    }
  }, 100); // Small delay to ensure response is sent first
}
