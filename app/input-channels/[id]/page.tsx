'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { InputChannel, PhotoWithTags } from '@/lib/types';
import { EditInputChannelDialog } from '@/components/edit-input-channel-dialog';
import { PhotoGrid } from '@/components/photo-grid';
import { PhotoDetailDialog } from '@/components/photo-detail-dialog';
import { AddToEventDialog } from '@/components/add-to-event-dialog';
import { AddToCollectionDialog } from '@/components/add-to-collection-dialog';
import { CreateEventDialog } from '@/components/create-event-dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Image as ImageIcon, Pencil, CheckSquare, FolderPlus, Tag, Plus } from 'lucide-react';

export default function InputChannelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = parseInt(params.id as string);

  const [channel, setChannel] = useState<InputChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithTags | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  
  // Selection mode for bulk operations
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [addToEventDialogOpen, setAddToEventDialogOpen] = useState(false);
  const [addToCollectionDialogOpen, setAddToCollectionDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);

  useEffect(() => {
    loadChannel();
  }, [channelId]);

  const loadChannel = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getInputChannel(channelId);
      setChannel(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load input channel:', err);
      setError('Kunne ikke laste kanal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChannel = async (id: number, data: any) => {
    await apiClient.updateInputChannel(id, data);
    await loadChannel();
  };

  const handlePhotoClick = (photo: PhotoWithTags) => {
    if (!selectionMode) {
      setSelectedPhoto(photo);
      setPhotoDialogOpen(true);
    }
  };

  const handlePhotoSelect = (hothash: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hothash)) {
        newSet.delete(hothash);
      } else {
        newSet.add(hothash);
      }
      return newSet;
    });
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedPhotos(new Set());
  };

  const handleSelectAll = async () => {
    try {
      // Load all photos for this channel
      const response = await apiClient.getPhotos({
        input_channel_id: channelId,
        limit: 1000, // Get all photos
      });
      const allHothashes = new Set(response.data.map(p => p.hothash));
      setSelectedPhotos(allHothashes);
    } catch (err) {
      console.error('Failed to select all:', err);
    }
  };

  const handleDeselectAll = () => {
    setSelectedPhotos(new Set());
  };

  const handlePhotoUpdated = (updatedPhoto: PhotoWithTags) => {
    // Trigger PhotoGrid refresh by updating channel
    loadChannel();
  };

  const handlePhotosAddedToEvent = () => {
    loadChannel();
    setSelectedPhotos(new Set());
    setSelectionMode(false);
  };

  const handlePhotosAddedToCollection = () => {
    loadChannel();
    setSelectedPhotos(new Set());
    setSelectionMode(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nb-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/input-channels')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake til kanaler
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {channel.title || `Kanal #${channel.id}`}
            </h1>
            {channel.description && (
              <p className="text-muted-foreground mb-4">{channel.description}</p>
            )}

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(channel.imported_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>{channel.images_count} bilder</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setEditDialogOpen(true)} variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Rediger
            </Button>
            <Button 
              onClick={handleToggleSelectionMode} 
              variant={selectionMode ? "default" : "outline"}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectionMode ? 'Avslutt valg' : 'Velg bilder'}
            </Button>
          </div>
        </div>
      </div>

      {/* Selection toolbar */}
      {selectionMode && (
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-card p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedPhotos.size} {selectedPhotos.size === 1 ? 'bilde' : 'bilder'} valgt
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAll}
              >
                Velg alle
              </Button>
              {selectedPhotos.size > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeselectAll}
                >
                  Fjern alle
                </Button>
              )}
            </div>
          </div>
          
          {selectedPhotos.size > 0 && (
            <div className="flex gap-2">
              <Button 
                onClick={() => setAddToEventDialogOpen(true)}
                variant="default"
              >
                <Tag className="h-4 w-4 mr-2" />
                Legg til i Event
              </Button>
              <Button 
                onClick={() => setAddToCollectionDialogOpen(true)}
                variant="outline"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Legg til i Samling
              </Button>
              <Button 
                onClick={() => setCreateEventDialogOpen(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Opprett ny Event
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Photos */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        </div>
      ) : (
        <PhotoGrid
          searchParams={{ input_channel_id: channelId }}
          onPhotoClick={handlePhotoClick}
          selectionMode={selectionMode}
          selectedPhotos={selectedPhotos}
          onPhotoSelect={handlePhotoSelect}
        />
      )}

      {/* Dialogs */}
      <EditInputChannelDialog
        channel={channel}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleUpdateChannel}
      />

      <PhotoDetailDialog
        photo={selectedPhoto}
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
        onPhotoUpdated={handlePhotoUpdated}
      />

      {selectedPhotos.size > 0 && (
        <>
          <AddToEventDialog
            open={addToEventDialogOpen}
            onOpenChange={setAddToEventDialogOpen}
            photoHothashes={Array.from(selectedPhotos)}
            onPhotosAdded={handlePhotosAddedToEvent}
          />

          <AddToCollectionDialog
            open={addToCollectionDialogOpen}
            onOpenChange={setAddToCollectionDialogOpen}
            photoHothashes={Array.from(selectedPhotos)}
            onPhotosAdded={handlePhotosAddedToCollection}
          />
        </>
      )}

      <CreateEventDialog
        open={createEventDialogOpen}
        onOpenChange={setCreateEventDialogOpen}
        onEventCreated={() => {
          setCreateEventDialogOpen(false);
          // Optionally auto-open add to event dialog
        }}
      />
    </div>
  );
}
