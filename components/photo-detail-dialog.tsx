'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import type { PhotoWithTags, PhotoUpdate, PhotoStack, TagAutocomplete, Author, Event, Collection } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VisibilityBadge } from '@/components/visibility-badge';
import { Star, MapPin, Calendar, Tag as TagIcon, Save, ZoomIn, ZoomOut, Maximize2, Camera, FileText, Eye, Hash, Folder, User, CalendarDays, FolderOpen } from 'lucide-react';

interface PhotoDetailDialogProps {
  photo: PhotoWithTags | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoUpdated?: (photo: PhotoWithTags) => void;
}

export function PhotoDetailDialog({
  photo,
  open,
  onOpenChange,
  onPhotoUpdated,
}: PhotoDetailDialogProps) {
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<TagAutocomplete[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [category, setCategory] = useState('');
  const [stack, setStack] = useState<PhotoStack | null>(null);
  const [saving, setSaving] = useState(false);
  const [coldPreviewUrl, setColdPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    if (photo) {
      setRating(photo.rating || 0);
      setTags(photo.tags?.map(t => t.name) || []);
      setLatitude(photo.gps_latitude?.toString() || '');
      setLongitude(photo.gps_longitude?.toString() || '');
      setCategory(photo.category || '');
      
      // Reset zoom and position
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setPreviewError(null);
      
      // Fetch coldpreview with authentication
      loadColdPreview(photo.hothash);
      
      // Load related data
      loadAuthor(photo.author_id);
      loadEvent(photo.event_id);
      loadCollections(photo.hothash);
    }

    return () => {
      // Cleanup blob URL when dialog closes
      if (coldPreviewUrl) {
        URL.revokeObjectURL(coldPreviewUrl);
      }
    };
  }, [photo]);

  const loadAuthor = async (authorId: number | null | undefined) => {
    if (!authorId) {
      setAuthor(null);
      return;
    }
    try {
      const authorData = await apiClient.getAuthor(authorId);
      setAuthor(authorData);
    } catch (err) {
      console.error('Failed to load author:', err);
      setAuthor(null);
    }
  };

  const loadEvent = async (eventId: number | null | undefined) => {
    if (!eventId) {
      setEvent(null);
      return;
    }
    try {
      const eventData = await apiClient.getEvent(eventId);
      setEvent(eventData);
    } catch (err) {
      console.error('Failed to load event:', err);
      setEvent(null);
    }
  };

  const loadCollections = async (hothash: string) => {
    try {
      // Fetch all collections and filter those containing this photo
      const allCollections = await apiClient.getCollections(0, 100);
      const photoCollections: Collection[] = [];
      
      for (const collection of allCollections.collections) {
        const photos = await apiClient.getCollectionPhotos(collection.id, 0, 1000);
        if (photos.some(p => p.hothash === hothash)) {
          photoCollections.push(collection);
        }
      }
      
      setCollections(photoCollections);
    } catch (err) {
      console.error('Failed to load collections:', err);
      setCollections([]);
    }
  };

  const loadColdPreview = async (hothash: string) => {
    setLoadingPreview(true);
    setPreviewError(null);
    
    try {
      // Try coldpreview first
      const coldResponse = await fetch(apiClient.getColdPreviewUrl(hothash), {
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`,
        },
      });

      if (coldResponse.ok) {
        const blob = await coldResponse.blob();
        const url = URL.createObjectURL(blob);
        setColdPreviewUrl(url);
      } else {
        // Get error message from response
        let errorMessage = `HTTP ${coldResponse.status}`;
        try {
          const errorData = await coldResponse.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = `${errorMessage} ${coldResponse.statusText}`;
        }
        
        setPreviewError(`Kunne ikke laste coldpreview: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ukjent feil';
      setPreviewError(`Feil ved lasting av coldpreview: ${errorMessage}`);
      console.error('Error loading preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  if (!photo) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update rating and category
      const metadata: Partial<PhotoUpdate> = {
        rating: rating || null,
        category: category || null,
      };

      const updatedPhoto = await apiClient.updatePhotoMetadata(photo.hothash, metadata);
      
      // TODO: GPS coordinates update - needs separate API endpoint or backend fix
      
      onPhotoUpdated?.(updatedPhoto as PhotoWithTags);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save metadata:', error);
      alert(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async (tagName: string) => {
    const trimmedTag = tagName.trim();
    if (!trimmedTag || tags.includes(trimmedTag)) return;

    try {
      // Add tag to photo via API
      await apiClient.addTagsToPhoto(photo.hothash, [trimmedTag]);
      setTags([...tags, trimmedTag]);
      setNewTag('');
      setShowSuggestions(false);
    } catch (error) {
      console.error('Failed to add tag:', error);
      alert(`Failed to add tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      // Remove tag from photo via API
      await apiClient.removeTagFromPhoto(photo.hothash, tagToRemove);
      setTags(tags.filter((tag) => tag !== tagToRemove));
    } catch (error) {
      console.error('Failed to remove tag:', error);
      alert(`Failed to remove tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTagInputChange = async (value: string) => {
    setNewTag(value);
    
    if (value.trim().length >= 2) {
      try {
        const suggestions = await apiClient.autocompleteTag(value.trim());
        setTagSuggestions(suggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Failed to fetch tag suggestions:', error);
        setTagSuggestions([]);
      }
    } else {
      setTagSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleRatingClick = (newRating: number) => {
    setRating(newRating === rating ? 0 : newRating);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.5, 1);
    setZoom(newZoom);
    if (newZoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    const newZoom = Math.max(1, Math.min(5, zoom + delta));
    setZoom(newZoom);
    if (newZoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Support both old (image_files) and new (files) array names, and primary_filename
  const primaryFile = photo.files?.[0] || photo.image_files?.[0];
  const displayName = photo.primary_filename || primaryFile?.filename || 'Unknown';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[98vw] !w-[98vw] max-h-[98vh] overflow-hidden p-6">
        <DialogHeader>
          <DialogTitle>{displayName}</DialogTitle>
          <DialogDescription>
            {photo.width} × {photo.height}
            {primaryFile?.file_size && ` • ${(primaryFile.file_size / 1024 / 1024).toFixed(2)} MB`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 grid-cols-[1fr_400px] h-[calc(98vh-8rem)]">
          {/* Image Preview */}
          <div className="relative h-full">
            <div 
              ref={imageContainerRef}
              className="relative w-full h-full bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden"
              style={{ cursor: zoom > 1 ? 'move' : 'default' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {loadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                </div>
              ) : previewError ? (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="text-center space-y-2">
                    <p className="text-destructive font-semibold">Kunne ikke laste bilde</p>
                    <p className="text-sm text-muted-foreground">{previewError}</p>
                  </div>
                </div>
              ) : coldPreviewUrl ? (
                <div 
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    transformOrigin: 'center',
                    transition: isDragging ? 'none' : 'transform 0.1s',
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                  }}
                >
                  <Image
                    src={coldPreviewUrl}
                    alt={primaryFile?.filename || 'Photo'}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Venter på bilde...
                </div>
              )}
            </div>
            
            {/* Zoom Controls */}
            {coldPreviewUrl && !loadingPreview && (
              <div className="absolute bottom-4 right-4 flex gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 border">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                  title="Zoom ut"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetZoom}
                  disabled={zoom === 1}
                  title="Tilbakestill"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleZoomIn}
                  disabled={zoom >= 5}
                  title="Zoom inn"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <span className="text-xs self-center px-2 text-muted-foreground">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Metadata Form */}
          <div className="space-y-6 overflow-y-auto pr-2">
            {/* Rating */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4" />
                Rating
              </Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-zinc-300 dark:text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Tags */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <TagIcon className="h-4 w-4" />
                Tags
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => handleTagInputChange(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(newTag);
                      }
                    }}
                    onFocus={() => {
                      if (tagSuggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder="Type to search tags..."
                  />
                  <Button 
                    onClick={() => handleAddTag(newTag)} 
                    variant="outline"
                    disabled={!newTag.trim()}
                  >
                    Add
                  </Button>
                </div>
                
                {/* Tag Suggestions Dropdown */}
                {showSuggestions && tagSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {tagSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => {
                          handleAddTag(suggestion.name);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-accent flex items-center justify-between"
                      >
                        <span>{suggestion.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {suggestion.photo_count} photos
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* GPS Location */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="latitude" className="text-xs">
                    Latitude
                  </Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="0.000000"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude" className="text-xs">
                    Longitude
                  </Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="0.000000"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Category */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Folder className="h-4 w-4" />
                Kategori
              </Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="F.eks. Natur, Portrett, Arkitektur..."
              />
            </div>

            <Separator />

            {/* Photographer/Author */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4" />
                Fotograf
              </Label>
              {author ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Navn:</span>
                    <span className="font-medium">{author.name}</span>
                  </div>
                  {author.email && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">E-post:</span>
                      <span className="text-xs">{author.email}</span>
                    </div>
                  )}
                  {author.bio && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground">{author.bio}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen fotograf knyttet til dette bildet</p>
              )}
            </div>

            <Separator />

            {/* Event */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4" />
                Event
              </Label>
              {event ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Navn:</span>
                    <span className="font-medium">{event.name}</span>
                  </div>
                  {event.description && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  )}
                  {event.location_name && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Sted:</span>
                      <span className="text-xs">{event.location_name}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ikke knyttet til et event</p>
              )}
            </div>

            <Separator />

            {/* Collections */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <FolderOpen className="h-4 w-4" />
                Collections
              </Label>
              {collections.length > 0 ? (
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <div key={collection.id} className="flex items-start justify-between text-sm p-2 rounded-md bg-muted/50">
                      <div className="flex-1">
                        <div className="font-medium">{collection.name}</div>
                        {collection.description && (
                          <div className="text-xs text-muted-foreground mt-1">{collection.description}</div>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {collection.photo_count || 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ikke lagt til i noen collections</p>
              )}
            </div>

            <Separator />

            {/* File Information */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4" />
                Filinformasjon
              </Label>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Filnavn:</span>
                  <span className="font-mono text-xs">{displayName}</span>
                </div>
                {primaryFile?.file_size && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Størrelse:</span>
                    <span>{(primaryFile.file_size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensjoner:</span>
                  <span>{photo.width} × {photo.height} px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Synlighet:</span>
                  <VisibilityBadge visibility={photo.visibility as any} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Camera & EXIF Information */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Camera className="h-4 w-4" />
                EXIF-informasjon
              </Label>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kamera:</span>
                  <span className="text-right">
                    {(photo.exif_dict as any)?.camera_make && (photo.exif_dict as any)?.camera_model
                      ? `${(photo.exif_dict as any).camera_make} ${(photo.exif_dict as any).camera_model}`
                      : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Objektiv:</span>
                  <span className="text-right text-xs">
                    {(photo.exif_dict as any)?.lens_model || 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ISO:</span>
                  <span>{(photo.exif_dict as any)?.iso || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blenderåpning:</span>
                  <span>
                    {(photo.exif_dict as any)?.f_number ? `f/${(photo.exif_dict as any).f_number}` : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lukkertid:</span>
                  <span>
                    {(photo.exif_dict as any)?.exposure_time ? `${(photo.exif_dict as any).exposure_time}s` : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brennvidde:</span>
                  <span>
                    {(photo.exif_dict as any)?.focal_length ? `${(photo.exif_dict as any).focal_length}mm` : 'None'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Metadata Info */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Hash className="h-4 w-4" />
                Metadata
              </Label>
              <div className="space-y-2 text-sm">
                {photo.taken_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tatt:</span>
                    <span>
                      {new Date(photo.taken_at).toLocaleDateString('no-NO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hothash:</span>
                  <span className="font-mono text-xs truncate max-w-[200px]" title={photo.hothash}>
                    {photo.hothash.substring(0, 16)}...
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
