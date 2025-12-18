'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { CollectionTextCard } from '@/lib/types';

interface TextCardEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (textCard: CollectionTextCard) => void;
  initialData?: CollectionTextCard;
  title?: string;
}

export function TextCardEditor({
  isOpen,
  onClose,
  onSave,
  initialData,
  title = 'Add Text Card',
}: TextCardEditorProps) {
  const [cardTitle, setCardTitle] = useState(initialData?.title || '');
  const [body, setBody] = useState(initialData?.body || '');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (isOpen) {
      setCardTitle(initialData?.title || '');
      setBody(initialData?.body || '');
    }
  }, [isOpen, initialData]);

  const handleSave = async () => {
    if (!cardTitle.trim()) {
      alert('Title is required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ title: cardTitle, body });
      onClose();
    } catch (error) {
      console.error('Error saving text card:', error);
      alert('Failed to save text card');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCardTitle(initialData?.title || '');
    setBody(initialData?.body || '');
    onClose();
  };

  const titleCharsRemaining = 200 - cardTitle.length;
  const bodyCharsRemaining = 2000 - body.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="card-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="card-title"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value.slice(0, 200))}
              placeholder="Enter card title..."
              maxLength={200}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground text-right">
              {titleCharsRemaining} characters remaining
            </p>
          </div>

          {/* Body Textarea */}
          <div className="space-y-2">
            <Label htmlFor="card-body">Body</Label>
            <Textarea
              id="card-body"
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 2000))}
              placeholder="Enter card body text..."
              maxLength={2000}
              rows={8}
              className="text-base resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bodyCharsRemaining} characters remaining
            </p>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2">
              {cardTitle ? (
                <h3 className="text-lg font-semibold">{cardTitle}</h3>
              ) : (
                <p className="text-sm text-muted-foreground italic">Title will appear here...</p>
              )}
              {body ? (
                <p className="text-sm whitespace-pre-wrap">{body}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Body text will appear here...</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!cardTitle.trim() || isSaving}>
            {isSaving ? 'Saving...' : initialData ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
