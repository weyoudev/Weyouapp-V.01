import { type PrismaClient } from '@prisma/client';
import { AppError } from '../../../application/errors';
import type {
  FeedbackRepo,
  FeedbackRecord,
  CreateFeedbackInput,
  AdminFeedbackFilters,
  AdminFeedbackResult,
} from '../../../application/ports';
import type { FeedbackStatus } from '@shared/enums';

const PgUniqueViolation = 'P2002';

type PrismaLike = Pick<PrismaClient, 'feedback'>;

function toRecord(row: {
  id: string;
  userId: string | null;
  orderId: string | null;
  type: string;
  rating: number | null;
  tags: string[];
  message: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): FeedbackRecord {
  return {
    id: row.id,
    userId: row.userId,
    orderId: row.orderId,
    type: row.type as FeedbackRecord['type'],
    rating: row.rating,
    tags: row.tags,
    message: row.message,
    status: row.status as FeedbackRecord['status'],
    adminNotes: row.adminNotes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isPrismaUniqueConstraint(e: unknown): boolean {
  if (e && typeof e === 'object' && 'code' in e) {
    return (e as { code: string }).code === PgUniqueViolation;
  }
  return false;
}

export class PrismaFeedbackRepo implements FeedbackRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async create(input: CreateFeedbackInput): Promise<FeedbackRecord> {
    try {
      const row = await this.prisma.feedback.create({
        data: {
          userId: input.userId ?? undefined,
          orderId: input.orderId ?? undefined,
          type: input.type,
          rating: input.rating ?? undefined,
          tags: input.tags ?? [],
          message: input.message ?? undefined,
          status: (input.status as 'NEW' | 'REVIEWED' | 'RESOLVED') ?? 'NEW',
        },
      });
      return toRecord(row);
    } catch (e) {
      if (isPrismaUniqueConstraint(e)) {
        throw new AppError(
          'FEEDBACK_ALREADY_EXISTS',
          'Feedback already submitted for this order',
          { orderId: input.orderId },
        );
      }
      throw e;
    }
  }

  async getById(id: string): Promise<FeedbackRecord | null> {
    const row = await this.prisma.feedback.findUnique({
      where: { id },
    });
    return row ? toRecord(row) : null;
  }

  async getByOrderId(orderId: string): Promise<FeedbackRecord | null> {
    const row = await this.prisma.feedback.findUnique({
      where: { orderId },
    });
    return row ? toRecord(row) : null;
  }

  async listAdmin(filters: AdminFeedbackFilters): Promise<AdminFeedbackResult> {
    const where: Record<string, unknown> = {};
    if (filters.type != null) where.type = filters.type;
    if (filters.status != null) where.status = filters.status;
    if (filters.rating != null) where.rating = filters.rating;
    if (filters.dateFrom != null || filters.dateTo != null) {
      where.createdAt = {};
      if (filters.dateFrom != null)
        (where.createdAt as Record<string, Date>).gte = filters.dateFrom;
      if (filters.dateTo != null)
        (where.createdAt as Record<string, Date>).lte = filters.dateTo;
    }
    const rows = await this.prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit + 1,
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      skip: filters.cursor ? 1 : 0,
    });
    const data = rows.slice(0, filters.limit).map(toRecord);
    const nextCursor = rows.length > filters.limit ? rows[filters.limit - 1].id : null;
    return { data, nextCursor };
  }

  async updateStatus(
    id: string,
    status: FeedbackStatus,
    adminNotes?: string | null,
  ): Promise<FeedbackRecord> {
    const row = await this.prisma.feedback.update({
      where: { id },
      data: {
        status: status as 'NEW' | 'REVIEWED' | 'RESOLVED',
        ...(adminNotes !== undefined && { adminNotes }),
      },
    });
    return toRecord(row);
  }

  async listForCustomer(userId: string): Promise<FeedbackRecord[]> {
    const rows = await this.prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toRecord);
  }
}
