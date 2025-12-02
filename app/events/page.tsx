'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import type { EventWithPhotos, EventTreeNode } from '@/lib/types';
import { CreateEventDialog } from '@/components/create-event-dialog';
import { EventTreeView } from '@/components/event-tree-view';
import { Button } from '@/components/ui/button';
import { Plus, List, TreePine, Calendar as CalendarIcon, MapPin, Images } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EventsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<EventWithPhotos[]>([]);
  const [eventTree, setEventTree] = useState<EventTreeNode[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    console.log('Events page - isAuthenticated:', isAuthenticated, 'authLoading:', authLoading);
    if (isAuthenticated) {
      console.log('Loading events data...');
      loadData();
    } else if (!authLoading) {
      console.log('Not authenticated and not loading');
    }
  }, [isAuthenticated, viewMode, authLoading]);

  const loadData = async () => {
    console.log('loadData called, viewMode:', viewMode);
    setLoading(true);
    setError(null);

    try {
      if (viewMode === 'list') {
        console.log('Loading events list...');
        // Load root events only for list view
        const data = await apiClient.getEvents();
        console.log('Events loaded successfully:', data.length, 'events');
        setEvents(data);
      } else {
        console.log('Loading events tree...');
        // Load full tree for tree view
        const treeData = await apiClient.getEventTree();
        console.log('Event tree loaded successfully:', treeData.events.length, 'root events');
        setEventTree(treeData.events);
      }
    } catch (err) {
      console.error('Failed to load events - full error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Kunne ikke laste events';
      console.error('Error message:', errorMessage);
      
      // More helpful error messages
      if (errorMessage.includes('Failed to fetch')) {
        setError('Kunne ikke koble til API. Sjekk at du er logget inn og at backend kjører.');
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Ikke autentisert. Vennligst logg inn på nytt.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreated = () => {
    loadData();
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



  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Du må være logget inn</h1>
          <p className="mt-2 text-muted-foreground">Logg inn for å se dine events</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="mt-2 text-muted-foreground">
              Organiser bilder hierarkisk etter hendelser og reiser
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              <List className="mr-2 h-4 w-4" />
              Liste
            </Button>
            <Button
              variant={viewMode === 'tree' ? 'default' : 'outline'}
              onClick={() => setViewMode('tree')}
            >
              <TreePine className="mr-2 h-4 w-4" />
              Tre
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Ny event
            </Button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-md bg-destructive/15 p-4">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData()}
            >
              Prøv igjen
            </Button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="text-muted-foreground">Laster events...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && viewMode === 'list' && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h2 className="mb-2 text-xl font-semibold">Ingen events ennå</h2>
            <p className="mb-6 text-center text-muted-foreground">
              Opprett din første event for å organisere bilder etter hendelser
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Opprett event
            </Button>
          </div>
        )}

        {/* List View */}
        {!loading && !error && viewMode === 'list' && events.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => router.push(`/events/${event.id}`)}
                className="cursor-pointer rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
              >
                <div className="mb-3">
                  <h3 className="text-lg font-semibold">{event.name}</h3>
                  {event.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Images className="h-4 w-4" />
                  <span>{event.photo_count} bilder</span>
                </div>

                {(event.start_date || event.location_name) && (
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {formatDateRange(event) && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{formatDateRange(event)}</span>
                      </div>
                    )}
                    {event.location_name && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location_name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tree View */}
        {!loading && !error && viewMode === 'tree' && (
          <div>
            {eventTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="mb-4 h-16 w-16 text-muted-foreground/30" />
                <h2 className="mb-2 text-xl font-semibold">Ingen events ennå</h2>
                <p className="mb-6 text-center text-muted-foreground">
                  Opprett din første event for å organisere bilder etter hendelser
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Opprett event
                </Button>
              </div>
            ) : (
              <EventTreeView events={eventTree} />
            )}
          </div>
        )}

        {/* Create dialog */}
        <CreateEventDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onEventCreated={handleEventCreated}
        />
      </div>
    </div>
  );
}
