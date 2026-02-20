export interface CarouselImageRecord {
  id: string;
  position: number;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CarouselRepo {
  list(): Promise<CarouselImageRecord[]>;
  setImage(position: number, imageUrl: string): Promise<CarouselImageRecord>;
  removeImage(position: number): Promise<void>;
}
