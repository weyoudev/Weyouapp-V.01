'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useUpdateServiceCategory,
  useDeleteServiceCategory,
  useUpdateSegmentCategory,
  useDeleteSegmentCategory,
} from '@/hooks/useCatalog';
import { toast } from 'sonner';
import { getFriendlyErrorMessage } from '@/lib/api';
import type { ServiceCategory, SegmentCategory } from '@/types';
import { Pencil, Trash2 } from 'lucide-react';

interface ManageServicesSegmentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segmentCategories: SegmentCategory[];
  serviceCategories: ServiceCategory[];
}

function SegmentRow({
  segment,
  onUpdated,
  onDeleted,
}: {
  segment: SegmentCategory;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(segment.label);
  const updateSegment = useUpdateSegmentCategory();
  const deleteSegment = useDeleteSegmentCategory();

  const handleSave = () => {
    const trimmed = editLabel.trim();
    if (!trimmed) {
      toast.error('Name cannot be empty');
      return;
    }
    updateSegment.mutate(
      { id: segment.id, label: trimmed },
      {
        onSuccess: () => {
          toast.success('Segment updated');
          setEditing(false);
          onUpdated();
        },
        onError: (err) => toast.error(getFriendlyErrorMessage(err)),
      },
    );
  };

  const handleDelete = () => {
    if (!confirm(`Delete segment "${segment.label}"? Any prices using this segment will be removed.`)) return;
    deleteSegment.mutate(segment.id, {
      onSuccess: () => {
        toast.success('Segment deleted');
        onDeleted();
      },
      onError: (err) => toast.error(getFriendlyErrorMessage(err)),
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
      {editing ? (
        <>
          <Input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            placeholder="Segment name"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateSegment.isPending}>
            Save
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 font-medium">{segment.label}</span>
          <span className="text-muted-foreground text-sm">{segment.code}</span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)} title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleteSegment.isPending} title="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

function ServiceRow({
  service,
  onUpdated,
  onDeleted,
}: {
  service: ServiceCategory;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(service.label);
  const updateService = useUpdateServiceCategory();
  const deleteService = useDeleteServiceCategory();

  const handleSave = () => {
    const trimmed = editLabel.trim();
    if (!trimmed) {
      toast.error('Name cannot be empty');
      return;
    }
    updateService.mutate(
      { id: service.id, label: trimmed },
      {
        onSuccess: () => {
          toast.success('Service updated');
          setEditing(false);
          onUpdated();
        },
        onError: (err) => toast.error(getFriendlyErrorMessage(err)),
      },
    );
  };

  const handleDelete = () => {
    if (!confirm(`Delete service "${service.label}"? Any prices using this service will be removed.`)) return;
    deleteService.mutate(service.id, {
      onSuccess: () => {
        toast.success('Service deleted');
        onDeleted();
      },
      onError: (err) => toast.error(getFriendlyErrorMessage(err)),
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
      {editing ? (
        <>
          <Input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            placeholder="Service name"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateService.isPending}>
            Save
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 font-medium">{service.label}</span>
          <span className="text-muted-foreground text-sm">{service.code}</span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)} title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleteService.isPending} title="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

export function ManageServicesSegmentsModal({
  open,
  onOpenChange,
  segmentCategories,
  serviceCategories,
}: ManageServicesSegmentsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Services & Segments</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Segments</h3>
            <div className="space-y-2">
              {segmentCategories.length === 0 ? (
                <p className="text-muted-foreground text-sm">No segments yet. Add them from the Edit Item modal.</p>
              ) : (
                segmentCategories.map((seg) => (
                  <SegmentRow
                    key={seg.id}
                    segment={seg}
                    onUpdated={() => {}}
                    onDeleted={() => {}}
                  />
                ))
              )}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Services</h3>
            <div className="space-y-2">
              {serviceCategories.length === 0 ? (
                <p className="text-muted-foreground text-sm">No services yet. Add them from the Edit Item modal.</p>
              ) : (
                serviceCategories.map((svc) => (
                  <ServiceRow
                    key={svc.id}
                    service={svc}
                    onUpdated={() => {}}
                    onDeleted={() => {}}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
