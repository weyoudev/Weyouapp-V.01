import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppExceptionFilter } from '../api/common/app-exception.filter';
import { parseDatabaseUrlForLogging } from '../infra/db-url.util';
import { prisma } from '../infra/prisma/prisma-client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors({
    origin: true, // allow mobile (Expo) and any dev origin
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const adapter = app.getHttpAdapter();
  // Root path: GET / and GET /api so mobile connection test and health checks don't 404
  const rootPayload = {
    message: 'Weyou API',
    api: '/api',
    docs: 'Use /api as the base path for all endpoints (e.g. /api/auth/customer/otp/request)',
  };
  adapter.get('/', (_req: unknown, res: { status: (n: number) => { json: (o: object) => void } }) => {
    res.status(200).json(rootPayload);
  });
  adapter.get('/api', (_req: unknown, res: { status: (n: number) => { json: (o: object) => void } }) => {
    res.status(200).json(rootPayload);
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AppExceptionFilter());

  const port = process.env.PORT ? Number(process.env.PORT) : 3003;
  await app.listen(port, '0.0.0.0');
  // Simple startup log for smoke verification
  // eslint-disable-next-line no-console
  console.log(`API listening on http://0.0.0.0:${port}/api (reachable from LAN at your PC IP)`);

  // Safe DB connection log (credentials never printed)
  const dbUrl = process.env.DATABASE_URL;
  const { dbHost, databaseName, masked } = parseDatabaseUrlForLogging(dbUrl);
  // eslint-disable-next-line no-console
  console.log(`DB connection: host=${dbHost} database=${databaseName} (${masked})`);

  // Retry DB verification (Supabase can take 10–30s to become reachable after restore from pause)
  const maxAttempts = 5;
  const delayMs = 3000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const row = await prisma.$queryRaw<[{ current_database: string; current_schema: string }]>`
        SELECT current_database() AS "current_database", current_schema() AS "current_schema"
      `;
      if (row?.[0]) {
        // eslint-disable-next-line no-console
        console.log(`DB verified: schema=${row[0].current_schema}`);
        break;
      }
    } catch (err) {
      if (attempt < maxAttempts) {
        // eslint-disable-next-line no-console
        console.warn(`DB verification attempt ${attempt}/${maxAttempts} failed, retrying in ${delayMs / 1000}s...`, (err as Error).message);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          'DB verification failed after retries:',
          (err as Error).message,
          '\n  API is still running. If using Supabase: restore a paused project in the dashboard, or use the pooler URL (port 6543) in DATABASE_URL if 5432 is blocked.',
        );
      }
    }
  }
}

bootstrap();

