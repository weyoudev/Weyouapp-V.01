import { IsString } from 'class-validator';

export class ImportCatalogDto {
  @IsString()
  content!: string;
}
