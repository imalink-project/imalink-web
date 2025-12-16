'use client';

import { useState } from 'react';
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

interface CreateAuthorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthorCreated: (data: { name: string; email?: string; bio?: string }) => Promise<void>;
}

export function CreateAuthorDialog({ open, onOpenChange, onAuthorCreated }: CreateAuthorDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Navn er påkrevd');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      
      await onAuthorCreated({
        name: name.trim(),
        email: email.trim() || undefined,
        bio: bio.trim() || undefined,
      });

      // Reset form
      setName('');
      setEmail('');
      setBio('');
    } catch (err) {
      console.error('Failed to create author:', err);
      setError(err instanceof Error ? err.message : 'Kunne ikke opprette fotograf');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setName('');
      setEmail('');
      setBio('');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny fotograf</DialogTitle>
          <DialogDescription>
            Legg til en ny fotograf i systemet. Navn er påkrevd.
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
              <Label htmlFor="name">Navn *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ola Nordmann"
                disabled={creating}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ola@example.com"
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Kort beskrivelse av fotografen..."
                rows={4}
                disabled={creating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={creating}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Oppretter...' : 'Opprett fotograf'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
