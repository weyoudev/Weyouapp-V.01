import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type CarouselSlot = {
  id: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
} | null;

export interface CarouselListResponse {
  slots: [CarouselSlot, CarouselSlot, CarouselSlot];
}

function fetchCarousel(): Promise<CarouselListResponse> {
  return api.get<CarouselListResponse>('/admin/carousel').then((r) => r.data);
}

export function useCarousel() {
  return useQuery({
    queryKey: ['admin', 'carousel'],
    queryFn: fetchCarousel,
  });
}

export function useUploadCarouselImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, position }: { file: File; position: number }) => {
      const form = new FormData();
      form.append('file', file);
      return api.post<{ position: number; imageUrl: string; id: string }>(
        `/admin/carousel/upload?position=${position}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      ).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'carousel'] });
    },
  });
}

export function useRemoveCarouselImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (position: number) =>
      api.delete<{ removed: number }>(`/admin/carousel/${position}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'carousel'] });
    },
  });
}
