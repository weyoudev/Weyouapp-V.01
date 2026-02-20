import { Injectable } from '@nestjs/common';
import { prisma } from '../../../infra/prisma/prisma-client';
import { parseDatabaseUrlForLogging } from '../../../infra/db-url.util';

export interface DbInfoResult {
  database_name: string;
  schema: string;
  /** Masked URL for logs; never contains password */
  db_host: string;
  /** Hostname only (e.g. db.xxx.supabase.co) for UI display */
  db_host_display: string;
  migration_count: number;
  table_count: number;
  /** Proof: latest applied migration name */
  latest_migration_name?: string | null;
  /** Proof: User table row count */
  user_count: number;
}

@Injectable()
export class DbInfoService {
  async getDbInfo(): Promise<DbInfoResult> {
    const dbUrl = process.env.DATABASE_URL;
    const { dbHost, masked } = parseDatabaseUrlForLogging(dbUrl);

    const [dbRow, tableCountRow, migrationsTableExistsRow] = await Promise.all([
      prisma.$queryRaw<[{ current_database: string; current_schema: string }]>`
        SELECT current_database() AS "current_database", current_schema() AS "current_schema"
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `,
      prisma.$queryRaw<[{ exists: boolean }]>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'prisma_migrations'
        ) AS exists
      `,
    ]).catch(() => [null, null, [{ exists: false }]]);

    const hasMigrationsTable = migrationsTableExistsRow?.[0]?.exists === true;
    let migrationCountResult: [{ count: bigint }] | null = null;
    let latestMigrationRow: [{ migration_name: string }] | null = null;
    if (hasMigrationsTable) {
      try {
        [migrationCountResult, latestMigrationRow] = await Promise.all([
          prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*)::bigint AS count FROM prisma_migrations`,
          prisma.$queryRaw<[{ migration_name: string }]>`SELECT migration_name FROM prisma_migrations ORDER BY finished_at DESC NULLS LAST LIMIT 1`,
        ]);
      } catch {
        migrationCountResult = [{ count: BigInt(0) }];
        latestMigrationRow = [];
      }
    } else {
      migrationCountResult = [{ count: BigInt(0) }];
      latestMigrationRow = [];
    }

    const firstRow = dbRow?.[0];
    const database_name = firstRow && 'current_database' in firstRow ? firstRow.current_database : '(unknown)';
    const schema = firstRow && 'current_schema' in firstRow ? firstRow.current_schema : '(unknown)';
    const table_count = Number(tableCountRow?.[0]?.count ?? 0);
    const migration_count = Number(migrationCountResult?.[0]?.count ?? 0);
    const latest_migration_name =
      latestMigrationRow && latestMigrationRow[0] ? (latestMigrationRow[0] as { migration_name: string }).migration_name : null;

    let user_count = 0;
    try {
      user_count = await prisma.user.count();
    } catch {
      // ignore
    }

    return {
      database_name,
      schema,
      db_host: masked,
      db_host_display: dbHost,
      migration_count,
      table_count,
      latest_migration_name: latest_migration_name ?? undefined,
      user_count,
    };
  }
}
