import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/projects - List all projects
router.get('/', async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { scenes: true, captions: true }
        }
      }
    });

    // Parse JSON fields
    const projectsWithParsedData = projects.map(project => ({
      ...project,
      style: JSON.parse(project.styleJson),
      settings: JSON.parse(project.settingsJson),
    }));

    res.json(projectsWithParsedData);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get project details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        scenes: { orderBy: { index: 'asc' } },
        captions: { orderBy: { index: 'asc' } },
        assets: true,
        jobs: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Parse JSON fields
    const projectWithParsedData = {
      ...project,
      style: JSON.parse(project.styleJson),
      settings: JSON.parse(project.settingsJson),
      captions: project.captions.map(cap => ({
        ...cap,
        words: cap.wordsJson ? JSON.parse(cap.wordsJson) : null
      })),
      jobs: project.jobs.map(job => ({
        ...job,
        steps: JSON.parse(job.stepsJson),
        logs: job.logsJson ? JSON.parse(job.logsJson) : null
      }))
    };

    res.json(projectWithParsedData);
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Create new project
router.post('/', async (req, res, next) => {
  try {
    const { title, script, settings, style } = req.body;

    if (!title || !script) {
      return res.status(400).json({ error: 'Title and script are required' });
    }

    const projectId = uuidv4();

    // Create project directory structure
    const storagePath = process.env.STORAGE_PATH || './storage';
    const projectPath = path.join(storagePath, projectId);
    
    ['inputs', 'audio', 'captions', 'overlays', 'temp', 'exports'].forEach(dir => {
      fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
    });

    // Save script to inputs
    fs.writeFileSync(
      path.join(projectPath, 'inputs', 'script.txt'),
      script,
      'utf-8'
    );

    // Default style (from current /edit/ page)
    const defaultStyle = style || {
      fontFamily: 'Inter',
      fontWeight: 900,
      fontSize: 85,
      textColor: '#FFFFFF',
      highlightColor: '#00FF00',
      strokeWidth: 4,
      strokeColor: '#000000',
      shadowBlur: 12,
      shadowColor: 'rgba(0, 0, 0, 0.9)',
      yPercent: 50,
      displayMode: 'karaoke',
      highlightMode: 'word-highlight'
    };

    // Default settings
    const defaultSettings = settings || {
      language: 'EN',
      music: 'upbeat',
      imageStyle: 'stock-images',
      voice: 'Arista-PlayAI', // Female voice
      scriptStyle: 'default',
      targetLength: 45,
      captions: true,
      watermark: true
    };

    // Create project in database
    const project = await prisma.project.create({
      data: {
        id: projectId,
        title,
        status: 'draft',
        durationLimit: 30,
        styleJson: JSON.stringify(defaultStyle),
        settingsJson: JSON.stringify(defaultSettings)
      }
    });

    // Save project.json
    fs.writeFileSync(
      path.join(projectPath, 'project.json'),
      JSON.stringify({
        id: projectId,
        title,
        script,
        style: defaultStyle,
        settings: defaultSettings,
        createdAt: project.createdAt
      }, null, 2),
      'utf-8'
    );

    res.status(201).json({
      ...project,
      style: defaultStyle,
      settings: defaultSettings
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:id - Update project
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, status, style, settings, styleJson } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (status) updateData.status = status;
    
    // Support both 'style' (object) and 'styleJson' (string)
    if (styleJson) {
      updateData.styleJson = styleJson;
    } else if (style) {
      updateData.styleJson = JSON.stringify(style);
    }
    
    if (settings) updateData.settingsJson = JSON.stringify(settings);

    const project = await prisma.project.update({
      where: { id },
      data: updateData
    });

    res.json({
      ...project,
      style: JSON.parse(project.styleJson),
      settings: JSON.parse(project.settingsJson)
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete from database (cascade will handle related records)
    await prisma.project.delete({
      where: { id }
    });

    // Delete project directory
    const storagePath = process.env.STORAGE_PATH || './storage';
    const projectPath = path.join(storagePath, id);
    
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/generate - Start generation job
router.post('/:id/generate', async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Create job
    const { createJob, processJobAsync } = await import('../services/jobService.js');
    const { processGeneration } = await import('../services/generateService.js');
    
    const job = await createJob(id, 'generate');

    // Update project status
    await prisma.project.update({
      where: { id },
      data: { status: 'generating' }
    });

    // Process job asynchronously
    await processJobAsync(processGeneration, job.id);

    res.status(202).json({
      message: 'Generation started',
      jobId: job.id,
      job
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/export - Start export job
router.post('/:id/export', async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status !== 'ready' && project.status !== 'exported') {
      return res.status(400).json({ 
        error: 'Project must be generated before export',
        status: project.status
      });
    }

    // Create job
    const { createJob, processJobAsync } = await import('../services/jobService.js');
    const { processExport } = await import('../services/exportService.js');
    
    const job = await createJob(id, 'export');

    // Update project status
    await prisma.project.update({
      where: { id },
      data: { status: 'exporting' }
    });

    // Process job asynchronously
    await processJobAsync(processExport, job.id);

    res.status(202).json({
      message: 'Export started',
      jobId: job.id,
      job
    });
  } catch (error) {
    next(error);
  }
});

export default router;
