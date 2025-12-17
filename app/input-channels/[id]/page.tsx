'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { InputChannel, PhotoWithTags } from '@/lib/types';
import { EditInputChannelDialog } from '@/components/edit-input-channel-dialog';
import { PhotoGrid } from '@/components/photo-grid';
import { PhotoDetailDialog } from '@/components/photo-detail-dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Image as ImageIcon, Pencil } from 'lucide-react';

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
    setSelectedPhoto(photo);
    setPhotoDialogOpen(true);
  };

  const handlePhotoUpdated = (updatedPhoto: PhotoWithTags) => {
    // Trigger PhotoGrid refresh by updating channel
    loadChannel();
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
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="flex-shrink-0 border-b bg-background px-4 py-4">
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

          <Button onClick={() => setEditDialogOpen(true)} variant="outline">
            <Pencil className="h-4 w-4 mr-2" />
            Rediger
          </Button>
        </div>
      </div>

      {/* Scrollable photos */}
      <div className="flex-1 overflow-hidden px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          </div>
        ) : (
          <PhotoGrid
            searchParams={{ input_channel_id: channelId }}
            onPhotoClick={handlePhotoClick}
            enableBatchOperations={true}
          />
        )}
      </div>

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
    </div>
  );
}
