import { Worker, Job } from 'bullmq';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import fs from 'fs';
import path from 'path';

export const exportWorker = new Worker(
  'ExportQueue',
  async (job: Job) => {
    const { exportId, projectId, userId } = job.data;

    // Update to processing
    await prisma.export.update({
      where: { id: exportId },
      data: { status: 'processing' }
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: { include: { assignee: true } }
      }
    });

    if (!project) throw new Error('Project not found');

    const csvLines = [];
    csvLines.push(`Project Name: ${project.name}`);
    csvLines.push(`Description: ${project.description || ''}`);
    csvLines.push(`Created Date: ${project.created_at.toISOString()}`);
    csvLines.push('\n--- Tasks ---');
    csvLines.push('Title,Status,Priority,Assignee Name,Due Date,Created Date');

    let todo = 0, in_progress = 0, done = 0;
    let low = 0, medium = 0, high = 0;

    for (const task of project.tasks) {
      csvLines.push(
        `${task.title},${task.status},${task.priority},${task.assignee?.name || 'Unassigned'},${task.due_date?.toISOString() || ''},${task.created_at.toISOString()}`
      );
      if (task.status === 'todo') todo++;
      if (task.status === 'in_progress') in_progress++;
      if (task.status === 'done') done++;
      
      if (task.priority === 'low') low++;
      if (task.priority === 'medium') medium++;
      if (task.priority === 'high') high++;
    }

    csvLines.push('\n--- Summary ---');
    csvLines.push(`Total Tasks: ${project.tasks.length}`);
    csvLines.push(`By Status - ToDo: ${todo}, In Progress: ${in_progress}, Done: ${done}`);
    csvLines.push(`By Priority - Low: ${low}, Medium: ${medium}, High: ${high}`);

    const exportDir = path.join(__dirname, '../../../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filePath = path.join(exportDir, `${exportId}.csv`);
    fs.writeFileSync(filePath, csvLines.join('\n'));

    const relativePath = `/exports/${exportId}.csv`;

    await prisma.export.update({
      where: { id: exportId },
      data: {
        status: 'completed',
        file_path: relativePath,
        completed_at: new Date()
      }
    });

    return { filePath: relativePath };
  },
  {
    connection: {
      url: env.REDIS_URL
    }
  }
);

exportWorker.on('failed', async (job, err) => {
  if (job) {
     await prisma.export.update({
        where: { id: job.data.exportId },
        data: { status: 'failed' }
     });
  }
  console.error(`Export Job ${job?.id} failed with error ${err.message}`);
});
