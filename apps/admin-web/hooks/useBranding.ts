import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BrandingSettings, UpdateBrandingBody } from '@/types';

function fetchBranding(): Promise<BrandingSettings> {
  return api.get<BrandingSettings>('/admin/branding').then((r) => r.data);
}

export function useBranding() {
  return useQuery({
    queryKey: ['admin', 'branding'],
    queryFn: fetchBranding,
  });
}

export function useUpdateBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateBrandingBody) =>
      api.put<BrandingSettings>('/admin/branding', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'branding'] });
    },
  });
}

export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.post<BrandingSettings>('/admin/branding/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'branding'] });
    },
  });
}

export function useUploadUpiQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.post<BrandingSettings>('/admin/branding/upi-qr', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'branding'] });
    },
  });
}

export function useUploadWelcomeBackground() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.post<BrandingSettings>('/admin/branding/welcome-background', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'branding'] });
    },
  });
}
