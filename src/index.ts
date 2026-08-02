import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { PORT, NODE_ENV, CORS_ORIGIN } from './config';
import { prisma } from './lib/prisma';
import { router } from './routes/index';
import { errorHandler } from './middleware/error';

const app = express();

app.use(
  cors({
    origin: NODE_ENV === 'production' ? CORS_ORIGIN : true,
  })
);
app.use(express.json());

app.use('/api', router);

if (NODE_ENV === 'production') {
  const webDist = path.resolve(__dirname, '../web/dist');
  if (fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(webDist, 'index.html'));
    });
  }
}

app.use(errorHandler);

async function main() {
  await prisma.$connect();
  console.log('[DB] Prisma connected');

  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('[Fatal] Failed to start server:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
