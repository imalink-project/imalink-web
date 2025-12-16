'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Author } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from 'lucide-react';

interface BatchSetAuthorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoHothashes: string[];
  onPhotosUpdated?: () => void;
}

export function BatchSetAuthorDialog({
  open,
  onOpenChange,
  photoHothashes,
  onPhotosUpdated,
}: BatchSetAuthorDialogProps) {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open) {
      loadAuthors();
      setSelectedAuthorId('');
    }
  }, [open]);

  const loadAuthors = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAuthors(0, 100);
      setAuthors(response.data || []);
    } catch (err) {
      console.error('Failed to load authors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetAuthor = async () => {
    if (!selectedAuthorId) return;

    setUpdating(true);
    try {
      // Update each photo with the selected author
      const authorId = selectedAuthorId === 'none' ? null : parseInt(selectedAuthorId);
      
      await Promise.all(
        photoHothashes.map((hothash) =>
          apiClient.updatePhotoMetadata(hothash, { author_id: authorId })
        )
      );

      onPhotosUpdated?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to set author:', err);
      alert('Kunne ikke sette fotograf for bildene');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Sett fotograf
          </DialogTitle>
          <DialogDescription>
            Velg fotograf for {photoHothashes.length} bilde{photoHothashes.length !== 1 ? 'r' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select
            value={selectedAuthorId}
            onValueChange={setSelectedAuthorId}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading ? 'Laster fotografer...' : 'Velg fotograf'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ingen fotograf</SelectItem>
              {authors.map((author) => (
                <SelectItem key={author.id} value={author.id.toString()}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updating}>
            Avbryt
          </Button>
          <Button onClick={handleSetAuthor} disabled={!selectedAuthorId || updating}>
            {updating ? 'Oppdaterer...' : 'Sett fotograf'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
