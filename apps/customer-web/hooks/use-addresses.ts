import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AddressItem {
  id: string;
  userId: string;
  label: string;
  addressLine: string;
  pincode: string;
  isDefault: boolean;
}

export const ADDRESS_LABELS = [
  { value: 'Home', label: 'Home' },
  { value: 'Office', label: 'Office' },
  { value: 'Other', label: 'Other' },
  { value: 'Friends Place', label: 'Friends Place' },
] as const;

function fetchAddresses(): Promise<AddressItem[]> {
  return api.get<AddressItem[]>('/addresses').then((r) => r.data);
}

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { label: string; addressLine: string; pincode: string; isDefault?: boolean }) =>
      api.post<{ id: string; pincode: string }>('/addresses', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useUpdateAddress(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { label?: string; addressLine?: string; pincode?: string; isDefault?: boolean }) =>
      api.patch<AddressItem>(`/addresses/${id}`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
