'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface BatchSetRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoHothashes: string[];
  onPhotosUpdated?: () => void;
}

export function BatchSetRatingDialog({
  open,
  onOpenChange,
  photoHothashes,
  onPhotosUpdated,
}: BatchSetRatingDialogProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  const handleSetRating = async () => {
    setUpdating(true);
    try {
      // Update each photo with the selected rating
      await Promise.all(
        photoHothashes.map((hothash) =>
          apiClient.updatePhotoMetadata(hothash, { rating: selectedRating || null })
        )
      );

      onPhotosUpdated?.();
      onOpenChange(false);
      setSelectedRating(0);
    } catch (err) {
      console.error('Failed to set rating:', err);
      alert('Kunne ikke sette rating for bildene');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) setSelectedRating(0);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Sett rating
          </DialogTitle>
          <DialogDescription>
            Velg rating for {photoHothashes.length} bilde{photoHothashes.length !== 1 ? 'r' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setSelectedRating(rating)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-12 w-12 ${
                    rating <= selectedRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-zinc-300 dark:text-zinc-600'
                  }`}
                />
              </button>
            ))}
          </div>
          {selectedRating > 0 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              {selectedRating} stjerne{selectedRating !== 1 ? 'r' : ''} valgt
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updating}>
            Avbryt
          </Button>
          <Button onClick={handleSetRating} disabled={selectedRating === 0 || updating}>
            {updating ? 'Oppdaterer...' : 'Sett rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
