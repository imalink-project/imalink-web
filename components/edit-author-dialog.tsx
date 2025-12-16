'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditAuthorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  author: Author;
  onAuthorUpdated: (id: number, data: { name?: string; email?: string; bio?: string }) => Promise<void>;
}

export function EditAuthorDialog({ open, onOpenChange, author, onAuthorUpdated }: EditAuthorDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load author data when dialog opens
  useEffect(() => {
    if (open && author) {
      setName(author.name || '');
      setEmail(author.email || '');
      setBio(author.bio || '');
      setError(null);
    }
  }, [open, author]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Navn er påkrevd');
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      
      await onAuthorUpdated(author.id, {
        name: name.trim(),
        email: email.trim() || undefined,
        bio: bio.trim() || undefined,
      });
    } catch (err) {
      console.error('Failed to update author:', err);
      setError(err instanceof Error ? err.message : 'Kunne ikke oppdatere fotograf');
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    if (!updating) {
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rediger fotograf</DialogTitle>
          <DialogDescription>
            Oppdater informasjon om fotografen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">Navn *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ola Nordmann"
                disabled={updating}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">E-post</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ola@example.com"
                disabled={updating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Kort beskrivelse av fotografen..."
                rows={4}
                disabled={updating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updating}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? 'Lagrer...' : 'Lagre endringer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
