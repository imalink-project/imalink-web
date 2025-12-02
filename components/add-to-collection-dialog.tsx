'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Collection } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { CreateCollectionDialog } from './create-collection-dialog';

interface AddToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoHothashes: string[];
  onPhotosAdded?: () => void;
}

export function AddToCollectionDialog({
  open,
  onOpenChange,
  photoHothashes,
  onPhotosAdded,
}: AddToCollectionDialogProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (open) {
      loadCollections();
    }
  }, [open]);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getCollections();
      setCollections(response.collections);
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async (collectionId: number) => {
    setAdding(collectionId);
    try {
      const result = await apiClient.addPhotosToCollection(collectionId, photoHothashes);
      console.log(`Added ${photoHothashes.length} photos to collection`, result);
      onPhotosAdded?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to add to collection:', err);
      const errorMsg = err instanceof Error ? err.message : 'Kunne ikke legge til i samling';
      alert(errorMsg);
    } finally {
      setAdding(null);
    }
  };

  const handleCollectionCreated = () => {
    loadCollections();
    setShowCreateDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Legg til i samling</DialogTitle>
            <DialogDescription>
              Velg en samling å legge til {photoHothashes.length} {photoHothashes.length === 1 ? 'bilde' : 'bilder'} i
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              </div>
            ) : collections.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Ingen samlinger ennå
              </div>
            ) : (
              <div className="space-y-2">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleAddToCollection(collection.id)}
                    disabled={adding !== null}
                    className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{collection.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {collection.photo_count} {collection.photo_count === 1 ? 'bilde' : 'bilder'}
                      </div>
                    </div>
                    {adding === collection.id ? (
                      <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    ) : (
                      <Check className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ny samling
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Avbryt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateCollectionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCollectionCreated={handleCollectionCreated}
      />
    </>
  );
}
