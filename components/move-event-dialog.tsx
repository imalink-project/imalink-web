'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { EventWithPhotos, Event } from '@/lib/types';
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
import { Search, FolderTree } from 'lucide-react';

interface MoveEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onEventMoved?: () => void;
}

export function MoveEventDialog({
  open,
  onOpenChange,
  event,
  onEventMoved,
}: MoveEventDialogProps) {
  const [events, setEvents] = useState<EventWithPhotos[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventWithPhotos[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);

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
          (e) =>
            e.name.toLowerCase().includes(query) ||
            e.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, events]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const allEvents = await apiClient.getEvents();
      // Filter out current event and its descendants to prevent circular references
      const validParents = allEvents.filter((e) => e.id !== event.id);
      setEvents(validParents);
      setFilteredEvents(validParents);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToEvent = async (newParentId: number | null) => {
    setMoving(true);
    try {
      await apiClient.moveEvent(event.id, newParentId);
      onEventMoved?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to move event:', err);
      alert('Kunne ikke flytte event');
    } finally {
      setMoving(false);
    }
  };

  const handleMoveToRoot = () => {
    handleMoveToEvent(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Flytt &quot;{event.name}&quot;</DialogTitle>
          <DialogDescription>
            Velg ny parent event, eller flytt til rot-nivå
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
          {/* Root option */}
          <button
            onClick={handleMoveToRoot}
            disabled={moving || event.parent_event_id === null}
            className="flex w-full items-center gap-3 rounded-lg border p-4 mb-2 text-left transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FolderTree className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium">Rot-nivå</div>
              <div className="text-sm text-muted-foreground">
                Flytt til topp-nivå (ingen parent)
              </div>
            </div>
            {event.parent_event_id === null && (
              <span className="text-xs text-muted-foreground">(nåværende)</span>
            )}
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery ? 'Ingen events funnet' : 'Ingen andre events'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map((e) => (
                <button
                  key={e.id}
                  onClick={() => handleMoveToEvent(e.id)}
                  disabled={moving || event.parent_event_id === e.id}
                  className="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FolderTree className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{e.name}</div>
                    {e.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {e.description}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {e.photo_count} bilder
                    </div>
                  </div>
                  {event.parent_event_id === e.id && (
                    <span className="text-xs text-muted-foreground">(nåværende)</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={moving}
          >
            Avbryt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
