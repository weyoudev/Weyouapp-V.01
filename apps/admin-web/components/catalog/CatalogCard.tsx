'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useUpdateItem } from '@/hooks/useCatalog';
import { toast } from 'sonner';
import type { CatalogItemWithMatrix, ServiceCategory, SegmentCategory } from '@/types';
import { Pencil } from 'lucide-react';

function groupBySegment(
  segmentPrices: CatalogItemWithMatrix['segmentPrices'],
  serviceCategories: ServiceCategory[],
  segmentCategories: SegmentCategory[],
) {
  const bySegment = new Map<string, Array<{ serviceCode: string; serviceLabel: string; priceRupees: number; isActive: boolean }>>();
  const catById = new Map(serviceCategories.map((c) => [c.id, c]));
  const segById = new Map(segmentCategories.map((s) => [s.id, s]));
  for (const p of segmentPrices) {
    const seg = segById.get(p.segmentCategoryId);
    const segmentLabel = seg?.label ?? seg?.code ?? p.segmentCategoryId;
    const cat = catById.get(p.serviceCategoryId);
    const code = cat?.code ?? p.serviceCategoryId;
    const label = cat?.label ?? code;
    const list = bySegment.get(segmentLabel) ?? [];
    list.push({ serviceCode: code, serviceLabel: label, priceRupees: p.priceRupees, isActive: p.isActive });
    bySegment.set(segmentLabel, list);
  }
  return bySegment;
}

interface CatalogCardProps {
  item: CatalogItemWithMatrix;
  serviceCategories: ServiceCategory[];
  segmentCategories: SegmentCategory[];
  canEdit: boolean;
  onEdit: () => void;
}

export function CatalogCard({ item, serviceCategories, segmentCategories, canEdit, onEdit }: CatalogCardProps) {
  const updateItem = useUpdateItem(item.id);
  const bySegment = groupBySegment(item.segmentPrices, serviceCategories, segmentCategories);
  const segments = Array.from(bySegment.keys()).sort();

  const handleToggleActive = (checked: boolean) => {
    if (!canEdit) return;
    updateItem.mutate(
      { active: checked },
      {
        onSuccess: () => toast.success(checked ? 'Item enabled' : 'Item disabled'),
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              item.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'
            }`}
          >
            {item.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Switch
              checked={item.active}
              onCheckedChange={handleToggleActive}
              disabled={updateItem.isPending}
            />
          )}
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} title="Edit item">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-muted-foreground">
          {segments.length === 0 ? (
            <span>— No prices</span>
          ) : (
            <ul className="space-y-1">
              {segments.map((seg) => {
                const rows = bySegment.get(seg) ?? [];
                return (
                  <li key={seg} className="flex flex-wrap gap-x-3 gap-y-0.5">
                    <span className="font-medium text-foreground/80">{seg}:</span>
                    {rows.map((r) => (
                      <span key={r.serviceCode}>
                        {r.serviceLabel} ₹{r.priceRupees}
                        {!r.isActive && ' (off)'}
                      </span>
                    ))}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
