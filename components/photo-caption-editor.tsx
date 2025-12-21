'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PhotoCaptionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (caption: string | null) => Promise<void>;
  initialCaption?: string | null;
  photoPosition: number;
}

export function PhotoCaptionEditor({
  isOpen,
  onClose,
  onSave,
  initialCaption,
  photoPosition,
}: PhotoCaptionEditorProps) {
  const [caption, setCaption] = useState(initialCaption || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCaption(initialCaption || '');
  }, [initialCaption, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // If caption is empty or only whitespace, save as null
      const trimmedCaption = caption.trim();
      await onSave(trimmedCaption || null);
      onClose();
    } catch (error) {
      console.error('Failed to save caption:', error);
      alert('Kunne ikke lagre bildetekst');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {initialCaption ? 'Rediger bildetekst' : 'Legg til bildetekst'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="caption">
              Bildetekst (maks 1000 tegn)
            </Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Emma sin første bursdag, 15. mai 2024"
              maxLength={1000}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {caption.length}/1000 tegn
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Lagrer...' : 'Lagre'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
