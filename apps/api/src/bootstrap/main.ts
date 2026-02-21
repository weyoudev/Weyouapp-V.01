import 'dotenv/config';
import 'reflect-metadata';
import * as jwt from 'jsonwebtoken';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppExceptionFilter } from '../api/common/app-exception.filter';
import { AdminAnalyticsService } from '../api/admin/services/admin-analytics.service';
import type { RevenuePreset } from '../application/time/analytics-date';
import { parseDatabaseUrlForLogging } from '../infra/db-url.util';
import { prisma } from '../infra/prisma/prisma-client';

const REVENUE_PRESETS: RevenuePreset[] = [
  'TODAY', 'THIS_MONTH', 'LAST_1_MONTH', 'LAST_3_MONTHS', 'LAST_6_MONTHS',
  'LAST_12_MONTHS', 'THIS_YEAR', 'LAST_YEAR', 'FY25', 'FY26', 'FY27',
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const allowedOrigins = [
    'https://weyou-admin.onrender.com',
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  ];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((o) => (typeof o === 'string' ? o === origin : o.test(origin)))) {
        return callback(null, true);
      }
      return callback(null, true); // fallback: allow (e.g. mobile, other hosts)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  // Diagnostic: proves the deployed image has this code (no auth)
  adapter.get('/api/admin/analytics/_ping', (_req: unknown, res: { status: (n: number) => { json: (o: object) => void } }) => {
    res.status(200).json({ ok: true, message: 'analytics routes available' });
  });

  // Fallback analytics routes (always registered so they work even if Nest controller is not); require ADMIN/BILLING
  try {
    const adminAnalyticsService = app.get(AdminAnalyticsService);
    const secret = process.env.JWT_SECRET || 'dev-secret';

    const checkAuth = (req: { headers?: { authorization?: string } }): { ok: true } | { ok: false; status: number; body: object } => {
      const auth = req.headers?.authorization;
      if (!auth || !auth.startsWith('Bearer ')) return { ok: false, status: 401, body: { error: { message: 'Missing Authorization header' } } };
      try {
        const payload = jwt.verify(auth.slice(7), secret) as { role: string };
        if (payload.role !== 'ADMIN' && payload.role !== 'BILLING') return { ok: false, status: 403, body: { error: { message: 'Forbidden' } } };
        return { ok: true };
      } catch {
        return { ok: false, status: 401, body: { error: { message: 'Invalid or expired token' } } };
      }
    };

    adapter.get('/api/admin/analytics/dashboard-kpis', async (req: unknown, res: { status: (n: number) => { json: (o: object) => void } }) => {
      const auth = checkAuth(req as { headers?: { authorization?: string } });
      if (!auth.ok) {
        res.status(auth.status).json(auth.body);
        return;
      }
      try {
        const data = await adminAnalyticsService.getDashboardKpis();
        res.status(200).json(data);
      } catch (e) {
        res.status(500).json({ error: { message: String(e) } });
      }
    });

    adapter.get('/api/admin/analytics/revenue', async (req: { query?: Record<string, unknown> } & unknown, res: { status: (n: number) => { json: (o: object) => void } }) => {
      const auth = checkAuth(req as { headers?: { authorization?: string } });
      if (!auth.ok) {
        res.status(auth.status).json(auth.body);
        return;
      }
      try {
        const q = (req as { query?: Record<string, unknown> }).query ?? {};
        const preset = (q.preset as string) && REVENUE_PRESETS.includes(q.preset as RevenuePreset) ? (q.preset as RevenuePreset) : undefined;
        const dateFrom = q.dateFrom ? new Date(q.dateFrom as string) : undefined;
        const dateTo = q.dateTo ? new Date(q.dateTo as string) : undefined;
        const data = await adminAnalyticsService.getRevenue({ preset, dateFrom, dateTo });
        res.status(200).json(data);
      } catch (e) {
        res.status(500).json({ error: { message: String(e) } });
      }
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Analytics fallback routes not registered (AdminAnalyticsService unavailable):', (e as Error).message);
  }

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

