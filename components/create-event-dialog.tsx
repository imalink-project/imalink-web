'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { EventCreate } from '@/lib/types';
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
import { Calendar, MapPin } from 'lucide-react';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: () => void;
  defaultName?: string;
}

export function CreateEventDialog({
  open,
  onOpenChange,
  onEventCreated,
  defaultName,
}: CreateEventDialogProps) {
  const [name, setName] = useState(defaultName || '');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationName, setLocationName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Navn er påkrevd');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const data: EventCreate = {
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        location_name: locationName.trim() || null,
      };

      await apiClient.createEvent(data);
      
      // Reset form
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setLocationName('');
      onOpenChange(false);
      onEventCreated?.();
    } catch (err) {
      console.error('Failed to create event:', err);
      setError(err instanceof Error ? err.message : 'Kunne ikke opprette event');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setLocationName('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Opprett ny event</DialogTitle>
          <DialogDescription>
            Events organiserer bilder hierarkisk (f.eks. "London 2025" → "Tower of London")
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="name">
              Navn <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="London Trip 2025"
              maxLength={200}
              disabled={creating}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Valgfri beskrivelse..."
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              maxLength={2000}
              disabled={creating}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="start-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Startdato
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Sluttdato
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={creating}
                min={startDate}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Sted
            </Label>
            <Input
              id="location"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="London, UK"
              maxLength={200}
              disabled={creating}
            />
          </div>

          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Events kan ha under-events (f.eks. dager i en reise)</li>
              <li>Bilder kan tilhøre flere events samtidig</li>
              <li>Alle felter utenom navn er valgfrie</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={creating}>
            Avbryt
          </Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating ? 'Oppretter...' : 'Opprett event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
