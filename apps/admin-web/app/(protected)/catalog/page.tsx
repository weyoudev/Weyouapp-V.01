'use client';

import { useState, useCallback, useMemo } from 'react';
import { getStoredUser } from '@/lib/auth';
import { RoleGate } from '@/components/shared/RoleGate';
import { BranchFilter } from '@/components/shared/BranchFilter';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCatalogItemsWithMatrix, useImportCatalog } from '@/hooks/useCatalog';
import { api } from '@/lib/api';
import { AddItemModal } from '@/components/catalog/AddItemModal';
import { EditItemModal } from '@/components/catalog/EditItemModal';
import { ManageServicesSegmentsModal } from '@/components/catalog/ManageServicesSegmentsModal';
import { CatalogCard } from '@/components/catalog/CatalogCard';
import { toast } from 'sonner';
import type { CatalogItemWithMatrix } from '@/types';
import { Download, Upload, Settings2 } from 'lucide-react';

export default function CatalogPage() {
  const user = getStoredUser();
  const role = user?.role ?? 'CUSTOMER';
  const isBranchHead = role === 'OPS' && !!user?.branchId;

  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [editItem, setEditItem] = useState<CatalogItemWithMatrix | null>(null);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>(() =>
    isBranchHead && user?.branchId ? [user.branchId] : [],
  );

  const { data, isLoading, error } = useCatalogItemsWithMatrix();
  const importCatalog = useImportCatalog();

  const allItems = data?.items ?? [];
  const items = useMemo(() => {
    if (selectedBranchIds.length === 0) return allItems;
    return allItems.filter((item) => {
      const ids = item.branchIds ?? [];
      if (ids.length === 0) return true;
      return ids.some((id) => selectedBranchIds.includes(id));
    });
  }, [allItems, selectedBranchIds]);
  const serviceCategories = data?.serviceCategories ?? [];
  const segmentCategories = data?.segmentCategories ?? [];

  const handleEditClick = useCallback((item: CatalogItemWithMatrix) => {
    setEditItem(item);
    setEditItemOpen(true);
  }, []);

  const handleDownloadSample = useCallback(() => {
    const fallback = 'itemName,segment,serviceCategoryCode,priceRupees,isActive\nShirt,MEN,STEAM_IRON,10,true\nShirt,MEN,DRY_CLEAN,50,true';
    api.get<{ content: string }>('/admin/catalog/import/sample')
      .then((r) => {
        const content = r.data?.content ?? fallback;
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'catalog-import-sample.csv';
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(() => {
        const blob = new Blob([fallback], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'catalog-import-sample.csv';
        link.click();
        URL.revokeObjectURL(link.href);
      });
  }, []);

  const handleUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        const content = String(reader.result ?? '');
        importCatalog.mutate(content, {
          onSuccess: (result) => {
            setUploading(false);
            toast.success(
              `Import done: ${result.createdItems} created, ${result.updatedItems} updated, ${result.upsertedPrices} prices. ${result.errors.length} errors.`,
            );
            if (result.errors.length > 0) {
              result.errors.slice(0, 5).forEach((err) => toast.error(`Row ${err.row}: ${err.message}`));
            }
          },
          onError: (err) => {
            setUploading(false);
            toast.error((err as Error).message);
          },
        });
      };
      reader.readAsText(file, 'UTF-8');
    };
    input.click();
  }, [importCatalog]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Catalog</h1>
        <p className="text-sm text-destructive">Failed to load catalog.</p>
        <ErrorDisplay error={error} className="mt-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Catalog</h1>
        <div className="flex flex-wrap items-center gap-2">
          <BranchFilter
            selectedBranchIds={selectedBranchIds}
            onChange={setSelectedBranchIds}
            compactLabel
            disabled={isBranchHead}
          />
          <RoleGate role={role} gate="catalogEdit">
            <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
              <Settings2 className="mr-2 h-4 w-4" />
              Manage Services &amp; Segments
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadSample}>
              <Download className="mr-2 h-4 w-4" />
              Download sample
            </Button>
            <Button variant="outline" size="sm" onClick={handleUpload} disabled={uploading || importCatalog.isPending}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading || importCatalog.isPending ? 'Uploading…' : 'Upload CSV'}
            </Button>
            <Button onClick={() => setAddOpen(true)}>Add item</Button>
          </RoleGate>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <CatalogCard
              key={item.id}
              item={item}
              serviceCategories={serviceCategories}
              segmentCategories={segmentCategories}
              canEdit={role === 'ADMIN'}
              onEdit={() => handleEditClick(item)}
            />
          ))}
          {items.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">No items yet.</p>
          )}
        </div>
      )}

      <AddItemModal open={addOpen} onOpenChange={setAddOpen} />
      <ManageServicesSegmentsModal
        open={manageOpen}
        onOpenChange={setManageOpen}
        segmentCategories={segmentCategories}
        serviceCategories={serviceCategories}
      />
      <EditItemModal
        item={editItem}
        serviceCategories={serviceCategories}
        segmentCategories={segmentCategories}
        open={editItemOpen}
        onOpenChange={setEditItemOpen}
      />
    </div>
  );
}
