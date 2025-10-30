import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/jobs/:id - Get job status
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
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

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Parse JSON fields
    const jobWithParsedData = {
      ...job,
      steps: JSON.parse(job.stepsJson),
      logs: job.logsJson ? JSON.parse(job.logsJson) : []
    };

    res.json(jobWithParsedData);
  } catch (error) {
    next(error);
  }
});

export default router;
