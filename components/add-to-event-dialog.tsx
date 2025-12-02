'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { EventWithPhotos } from '@/lib/types';
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
import { Plus, Check, Calendar, MapPin, Search } from 'lucide-react';
import { CreateEventDialog } from './create-event-dialog';

interface AddToEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoHothashes: string[];
  onPhotosAdded?: () => void;
}

export function AddToEventDialog({
  open,
  onOpenChange,
  photoHothashes,
  onPhotosAdded,
}: AddToEventDialogProps) {
  const [events, setEvents] = useState<EventWithPhotos[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventWithPhotos[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (open) {
      loadEvents();
      setSearchQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEvents(
        events.filter(
          (event) =>
            event.name.toLowerCase().includes(query) ||
            event.description?.toLowerCase().includes(query) ||
            event.location_name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, events]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Get all root events (we'll keep it simple for now, no hierarchy)
      const allEvents = await apiClient.getEvents();
      setEvents(allEvents);
      setFilteredEvents(allEvents);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToEvent = async (eventId: number) => {
    setAdding(eventId);
    try {
      // One-to-many: Sets event_id for these photos (replaces any existing event)
      await apiClient.setPhotosEvent(eventId, photoHothashes);
      onPhotosAdded?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to set event:', err);
      alert('Kunne ikke sette event for bildene');
    } finally {
      setAdding(null);
    }
  };

  const handleEventCreated = () => {
    loadEvents();
    setShowCreateDialog(false);
  };

  const formatDateRange = (event: EventWithPhotos) => {
    if (!event.start_date) return null;
    
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('no-NO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    const start = formatDate(event.start_date);
    const end = event.end_date ? formatDate(event.end_date) : null;
    return end && end !== start ? `${start} - ${end}` : start;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Sett event for bilder</DialogTitle>
            <DialogDescription>
              Velg event for {photoHothashes.length} {photoHothashes.length === 1 ? 'bilde' : 'bilder'}. 
              NB: Ett bilde kan kun være i én event (erstatter eksisterende event).
            </DialogDescription>
          </DialogHeader>

          {/* Search field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Søk etter event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                {searchQuery ? 'Ingen events funnet' : 'Ingen events ennå'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleAddToEvent(event.id)}
                    disabled={adding !== null}
                    className="flex w-full flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="font-medium">{event.name}</div>
                      {adding === event.id ? (
                        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                      ) : (
                        <Check className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    {event.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {event.description}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {formatDateRange(event) && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDateRange(event)}</span>
                        </div>
                      )}
                      {event.location_name && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>{event.photo_count} bilder</span>
                      </div>
                    </div>
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
              Ny event
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

      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onEventCreated={handleEventCreated}
      />
    </>
  );
}
