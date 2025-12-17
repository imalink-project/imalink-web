'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import type { Event, EventWithPhotos } from '@/lib/types';
import { PhotoGrid } from '@/components/photo-grid';
import { CreateEventDialog } from '@/components/create-event-dialog';
import { EventBreadcrumb } from '@/components/event-breadcrumb';
import { MoveEventDialog } from '@/components/move-event-dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  MoreVertical,
  Plus,
  Trash,
  Edit,
  Images,
  FolderTree,
  Move,
} from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const eventId = parseInt(params.id as string);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [childEvents, setChildEvents] = useState<EventWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateChildDialog, setShowCreateChildDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [includeDescendants, setIncludeDescendants] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isNaN(eventId)) {
      loadEventData();
    }
  }, [isAuthenticated, eventId]);

  const loadEventData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load event details
      const eventData = await apiClient.getEvent(eventId);
      setEvent(eventData);

      // Load child events
      const children = await apiClient.getEvents(eventId);
      setChildEvents(children);
    } catch (err) {
      console.error('Failed to load event:', err);
      setError(err instanceof Error ? err.message : 'Kunne ikke laste event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.deleteEvent(eventId);
      router.push('/events');
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert('Kunne ikke slette event');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleChildCreated = () => {
    loadEventData();
    setShowCreateChildDialog(false);
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
          <p className="mt-2 text-muted-foreground">Logg inn for å se events</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="text-muted-foreground">Laster event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tilbake
        </Button>
        
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          {error || 'Event ikke funnet'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="flex-shrink-0 border-b bg-background px-4 py-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <EventBreadcrumb eventId={eventId} currentEventName={event.name} />
        </div>

        {/* Header with back button */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/events/${eventId}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Rediger
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
                <Move className="mr-2 h-4 w-4" />
                Flytt event
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Slett
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Event Header */}
        <div className="rounded-lg border bg-card p-6">
          <h1 className="mb-2 text-3xl font-bold">{event.name}</h1>
          
          {event.description && (
            <p className="mb-4 text-muted-foreground">{event.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm">
            {event.location_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.location_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-6">
          {/* Child Events */}
          {childEvents.length > 0 && (
            <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Under-events
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateChildDialog(true)}
              >
                <Plus className="mr-2 h-3 w-3" />
                Legg til under-event
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {childEvents.map((child) => (
                <div
                  key={child.id}
                  onClick={() => router.push(`/events/${child.id}`)}
                  className="cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <h3 className="font-semibold">{child.name}</h3>
                  {child.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {child.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Images className="h-3 w-3" />
                    <span>{child.photo_count} bilder</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

          {/* Photos Section */}
          <div className="h-[600px]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Bilder</h2>
              
              {childEvents.length > 0 && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDescendants}
                    onChange={(e) => setIncludeDescendants(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>Inkluder bilder fra under-events</span>
                </label>
              )}
            </div>

            <PhotoGrid 
              searchParams={{ event_id: eventId, include_descendants: includeDescendants }}
              showViewSelector={true}
              enableBatchOperations={false}
            />
          </div>
        </div>
      </div>

      {/* Create child event dialog */}
        <CreateEventDialog
          open={showCreateChildDialog}
          onOpenChange={setShowCreateChildDialog}
          onEventCreated={handleChildCreated}
          defaultName=""
        />

        {/* Move event dialog */}
        <MoveEventDialog
          open={showMoveDialog}
          onOpenChange={setShowMoveDialog}
          event={event}
          onEventMoved={() => {
            loadEventData();
            setShowMoveDialog(false);
          }}
        />

        {/* Delete confirmation dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slett event?</AlertDialogTitle>
              <AlertDialogDescription>
                Er du sikker på at du vil slette &quot;{event.name}&quot;?
                <br />
                <br />
                Under-events vil bli flyttet til rot-nivå, og bilder vil forbli i systemet.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Sletter...' : 'Slett'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
