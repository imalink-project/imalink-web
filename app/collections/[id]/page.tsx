'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import type { Collection, PhotoWithTags, ExtendedSearchParams } from '@/lib/types';
import { PhotoGrid } from '@/components/photo-grid';
import { PhotoDetailDialog } from '@/components/photo-detail-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
} from 'lucide-react';
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

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const collectionId = parseInt(params.id as string);
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithTags | null>(null);
  const [showPhotoDetail, setShowPhotoDetail] = useState(false);

  useEffect(() => {
    if (isAuthenticated && collectionId) {
      loadCollectionData();
    }
  }, [isAuthenticated, collectionId]);

  const loadCollectionData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getCollection(collectionId);
      setCollection(data);
      setEditName(data.name);
      setEditDescription(data.description || '');
    } catch (err) {
      console.error('Failed to load collection:', err);
      setError(err instanceof Error ? err.message : 'Kunne ikke laste samling');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return;

    setSaving(true);
    try {
      await apiClient.updateCollection(collectionId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      
      await loadCollectionData();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update collection:', err);
      alert('Kunne ikke oppdatere samling');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (collection) {
      setEditName(collection.name);
      setEditDescription(collection.description || '');
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.deleteCollection(collectionId);
      router.push('/collections');
    } catch (err) {
      console.error('Failed to delete collection:', err);
      alert('Kunne ikke slette samling');
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleBack = () => {
    router.push('/collections');
  };

  const handlePhotoClick = (photo: PhotoWithTags) => {
    setSelectedPhoto(photo);
    setShowPhotoDetail(true);
  };

  const handlePhotosChanged = () => {
    // Refresh collection metadata to update photo count
    loadCollectionData();
    // Trigger PhotoGrid refresh
    setRefreshKey(prev => prev + 1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!collection) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Compact fixed toolbar */}
      <div className="flex-shrink-0 border-b bg-background px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tilbake til samlinger
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6\">
          {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Navn</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={255}
                disabled={saving}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Beskrivelse</Label>
              <textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={saving}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !editName.trim()}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Lagrer...' : 'Lagre'}
              </Button>
              <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                <X className="mr-2 h-4 w-4" />
                Avbryt
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{collection.name}</h1>
                {collection.description && (
                  <p className="mt-2 text-muted-foreground">{collection.description}</p>
                )}
                
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    <span>{collection.photo_count} {collection.photo_count === 1 ? 'bilde' : 'bilder'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Opprettet {formatDate(collection.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Rediger
                </Button>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Slett
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Photos grid */}
        <div className="mt-6 h-[calc(100vh-400px)]">
          <PhotoGrid
            key={refreshKey}
            searchParams={{ collection_id: collectionId }}
            onPhotoClick={handlePhotoClick}
            enableBatchOperations={false}
          />
        </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett samling?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette &quot;{collection.name}&quot;?
              Bildene vil ikke bli slettet, bare samlingen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Sletter...' : 'Slett samling'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Photo detail dialog */}
        <PhotoDetailDialog
        photo={selectedPhoto}
        open={showPhotoDetail}
        onOpenChange={setShowPhotoDetail}
      />
    </div>
  );
}
