import type { PrismaClient } from '@prisma/client';
import type { CarouselRepo, CarouselImageRecord } from '../../../application/ports';

const POSITIONS = [1, 2, 3] as const;

type PrismaLike = Pick<PrismaClient, 'carouselImage'>;

function toRecord(row: {
  id: string;
  position: number;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}): CarouselImageRecord {
  return {
    id: row.id,
    position: row.position,
    imageUrl: row.imageUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaCarouselRepo implements CarouselRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async list(): Promise<CarouselImageRecord[]> {
    const rows = await this.prisma.carouselImage.findMany({
      orderBy: { position: 'asc' },
    });
    return rows.map(toRecord);
  }

  async setImage(position: number, imageUrl: string): Promise<CarouselImageRecord> {
    if (!POSITIONS.includes(position as 1 | 2 | 3)) {
      throw new Error('Position must be 1, 2, or 3');
    }
    const row = await this.prisma.carouselImage.upsert({
      where: { position },
      create: { position, imageUrl },
      update: { imageUrl, updatedAt: new Date() },
    });
    return toRecord(row);
  }

  async removeImage(position: number): Promise<void> {
    await this.prisma.carouselImage.deleteMany({ where: { position } });
  }
}
