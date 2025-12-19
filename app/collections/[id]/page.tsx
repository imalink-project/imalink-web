'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { exportSlideshow } from '@/lib/slideshow-export';
import type { Collection, PhotoWithTags, CollectionItem, CollectionTextCard } from '@/lib/types';
import { PhotoDetailDialog } from '@/components/photo-detail-dialog';
import { CollectionItemGrid } from '@/components/collection-item-grid';
import { TextCardEditor } from '@/components/text-card-editor';
import { CollectionSlideshow } from '@/components/collection-slideshow';
import { PhotoGrid } from '@/components/photo-grid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Image as ImageIcon,
  FileText,
  Plus,
  Calendar,
  Presentation,
  Download,
  ArrowUpDown,
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
  
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editingTextCardIndex, setEditingTextCardIndex] = useState<number | null>(null);
  const [editingTextCard, setEditingTextCard] = useState<CollectionTextCard | undefined>(undefined);
  
  const [showAddPhotosDialog, setShowAddPhotosDialog] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [exporting, setExporting] = useState(false);

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
      console.log('Collection data loaded:', data);
      console.log('Items:', (data as any).items);
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

  const handleReorderItems = async (newItems: CollectionItem[]) => {
    try {
      await apiClient.reorderCollectionItems(collectionId, newItems);
      await loadCollectionData();
    } catch (err) {
      console.error('Failed to reorder items:', err);
      alert('Kunne ikke endre rekkefølge');
    }
  };

  const handleAddTextCard = () => {
    setEditingTextCardIndex(null);
    setEditingTextCard(undefined);
    setShowTextEditor(true);
  };

  const handleEditTextCard = (index: number, card: CollectionTextCard) => {
    setEditingTextCardIndex(index);
    setEditingTextCard(card);
    setShowTextEditor(true);
  };

  const handleSaveTextCard = async (card: CollectionTextCard) => {
    try {
      if (editingTextCardIndex !== null) {
        // Update existing card
        await apiClient.updateCollectionTextCard(collectionId, editingTextCardIndex, card);
      } else {
        // Add new card
        const items: CollectionItem[] = [{ type: 'text', text_card: card }];
        await apiClient.addItemsToCollection(collectionId, items);
      }
      await loadCollectionData();
    } catch (err) {
      console.error('Failed to save text card:', err);
      throw err;
    }
  };

  const handleDeleteItem = async (position: number) => {
    if (!confirm('Er du sikker på at du vil slette dette elementet?')) {
      return;
    }

    try {
      await apiClient.deleteCollectionItem(collectionId, position);
      await loadCollectionData();
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Kunne ikke slette element');
    }
  };

  const handleAddPhotos = async (selectedHothashes: string[]) => {
    try {
      const items: CollectionItem[] = selectedHothashes.map(h => ({ type: 'photo', photo_hothash: h }));
      await apiClient.addItemsToCollection(collectionId, items);
      await loadCollectionData();
      setShowAddPhotosDialog(false);
    } catch (err) {
      console.error('Failed to add photos:', err);
      alert('Kunne ikke legge til bilder');
    }
  };

  const handlePhotosSelectedInGrid = (photos: PhotoWithTags[]) => {
    const hothashes = photos.map(p => p.hothash);
    handleAddPhotos(hothashes);
  };

  const handleExportSlideshow = async () => {
    if (!collection || items.length === 0) return;
    
    setExporting(true);
    try {
      const blob = await exportSlideshow({
        collectionName: collection.name,
        collectionDescription: collection.description || undefined,
        collectionId: collectionId,
        items: items,
      });
      
      // Download the ZIP file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collection.name.replace(/[^a-z0-9]/gi, '_')}_slideshow.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export slideshow:', err);
      alert('Kunne ikke eksportere lysbildevisning');
    } finally {
      setExporting(false);
    }
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
    console.log('Collection is null/undefined - should not happen if loading is false');
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          Collection not found (ID: {collectionId})
        </div>
      </div>
    );
  }

  const items = (collection as any).items as CollectionItem[] || [];
  console.log('Rendering with items:', items);
  console.log('First photo item:', items.find(i => i.type === 'photo'));

  const handleToggleSortOrder = async () => {
    // Reverse the items array and send to backend
    const reversedItems = [...items].reverse();
    
    try {
      await apiClient.reorderCollectionItems(collectionId, reversedItems);
      await loadCollectionData();
    } catch (err) {
      console.error('Failed to reorder items:', err);
      alert('Kunne ikke endre sortering');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={handleBack}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tilbake til samlinger
      </Button>

      {/* Collection header */}
      {isEditing ? (
        <div className="mb-8 space-y-4 rounded-lg border bg-card p-6">
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
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{collection.name}</h1>
              {collection.description && (
                <p className="mt-2 text-muted-foreground">{collection.description}</p>
              )}
              
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" />
                  <span>{(collection as any).photo_count || 0} bilder</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{(collection as any).text_card_count || 0} tekstkort</span>
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

      {/* Action buttons */}
      <div className="mb-6 flex gap-2 flex-wrap items-center">
        <Button onClick={() => setShowAddPhotosDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Legg til bilder
        </Button>
        <Button variant="outline" onClick={handleAddTextCard}>
          <FileText className="mr-2 h-4 w-4" />
          Legg til tekstkort
        </Button>
        {items.length > 0 && (
          <>
            <Button variant="outline" onClick={handleToggleSortOrder}>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Reverser rekkefølge
            </Button>
            <Button variant="outline" onClick={() => setShowSlideshow(true)}>
              <Presentation className="mr-2 h-4 w-4" />
              Lysbildevisning
            </Button>
            <Button variant="outline" onClick={handleExportSlideshow} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Eksporterer...' : 'Last ned'}
            </Button>
          </>
        )}
      </div>

      {/* Items grid */}
      <CollectionItemGrid
        items={items}
        collectionId={collectionId}
        onReorder={handleReorderItems}
        onEditTextCard={handleEditTextCard}
        onDeleteItem={handleDeleteItem}
      />

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

      {/* Text card editor */}
      <TextCardEditor
        isOpen={showTextEditor}
        onClose={() => setShowTextEditor(false)}
        onSave={handleSaveTextCard}
        initialData={editingTextCard}
        title={editingTextCardIndex !== null ? 'Rediger tekstkort' : 'Legg til tekstkort'}
      />

      {/* Add photos dialog - Temporarily using standard AddToCollectionDialog */}
      {/* TODO: Implement proper photo selection with items API integration */}
      {showAddPhotosDialog && (
        <Dialog open={showAddPhotosDialog} onOpenChange={setShowAddPhotosDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Legg til bilder</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Bruk &quot;Add to Collection&quot; knappen i PhotoGrid for å legge til bilder i samlingen.
              </p>
              <p className="text-sm text-muted-foreground">
                Merk: Backend bruker nå items-basert API. Frontend vil bli oppdatert til å vise 
                en bedre fotovalg-dialog som sender items direkte.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowAddPhotosDialog(false)}>
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Slideshow */}
      <CollectionSlideshow
        items={items}
        isOpen={showSlideshow}
        onClose={() => setShowSlideshow(false)}
      />

      {/* Photo detail dialog */}
      <PhotoDetailDialog
        photo={selectedPhoto}
        open={showPhotoDetail}
        onOpenChange={setShowPhotoDetail}
      />
    </div>
  );
}
