'use client';

import { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import type { PhotoWithTags, ExtendedSearchParams } from '@/lib/types';
import { usePhotoStore, PHOTO_DISPLAY_CONFIGS } from '@/lib/photo-store';
import { PhotoCard } from './photo-card';
import { AddToCollectionDialog } from './add-to-collection-dialog';
import { AddToEventDialog } from './add-to-event-dialog';
import { BatchSetAuthorDialog } from './batch-set-author-dialog';
import { BatchSetRatingDialog } from './batch-set-rating-dialog';
import { PhotoDetailDialog } from './photo-detail-dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Grid2X2, Grid3X3, LayoutGrid, List, CheckSquare, Square, FolderPlus, CalendarDays, X, Calendar, User, Star, Clock, MapPin, Image, MoreHorizontal } from 'lucide-react';

interface PhotoGridProps {
  searchParams?: ExtendedSearchParams;
  onPhotoClick?: (photo: PhotoWithTags) => void;
  showViewSelector?: boolean;
  enableBatchOperations?: boolean; // Enable batch selection features
  headerContent?: React.ReactNode; // Optional header content that scrolls with photos
}

export function PhotoGrid({ 
  searchParams, 
  onPhotoClick,
  showViewSelector = true,
  enableBatchOperations = false,
  headerContent,
}: PhotoGridProps) {
  const [photos, setPhotos] = useState<PhotoWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(500);
  const [total, setTotal] = useState<number>(0);
  const [totalIsApproximate, setTotalIsApproximate] = useState(false); // For collections without total count
  const [groupByDate, setGroupByDate] = useState(false);
  
  // Batch selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [showAddToEvent, setShowAddToEvent] = useState(false);
  const [showSetAuthor, setShowSetAuthor] = useState(false);
  const [showSetRating, setShowSetRating] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  
  // Load all state
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [loadAllProgress, setLoadAllProgress] = useState({ loaded: 0, total: 0 });
  const cancelLoadAllRef = useRef(false);
  
  // Photo detail state
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithTags | null>(null);
  const [showPhotoDetail, setShowPhotoDetail] = useState(false);
  
  // Use photo store for caching and display settings
  const { addPhotos, displaySize, setDisplaySize } = usePhotoStore();
  const config = PHOTO_DISPLAY_CONFIGS[displaySize];

  const loadPhotos = async (append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = append ? offset : 0;
      
      let items: PhotoWithTags[];
      let total: number;

      // Special handling for collection_id - use dedicated endpoint with pagination
      if (searchParams?.collection_id) {
        const response = await apiClient.getCollectionPhotos(
          searchParams.collection_id,
          currentOffset,
          limit
        );
        items = (response.data || []) as PhotoWithTags[];
        total = response.total || items.length;
        setTotalIsApproximate(false); // Collections now return exact total
      } else if (searchParams?.event_id) {
        // Special handling for event_id - use dedicated endpoint
        const eventPhotos = await apiClient.getEventPhotos(
          searchParams.event_id,
          searchParams.include_descendants || false
        );
        // Handle pagination manually for event photos
        items = eventPhotos.slice(currentOffset, currentOffset + limit) as PhotoWithTags[];
        total = eventPhotos.length;
        setTotalIsApproximate(false); // Event photos: we have exact count
      } else if (searchParams && Object.keys(searchParams).length > 0) {
        // Use searchPhotos (POST) for any search params (including date filters)
        // Remove extended params that backend doesn't understand
        const { event_id, collection_id, include_descendants, ...backendParams } = searchParams;
        const response = await apiClient.searchPhotos({
          ...backendParams,
          limit,
          offset: currentOffset,
        });
        items = (response.data || []) as PhotoWithTags[];
        total = response.meta?.total || items.length;
        setTotalIsApproximate(false); // Search returns exact total
      } else {
        // No params - use simple GET
        const response = await apiClient.getPhotos({
          limit,
          offset: currentOffset,
        });
        items = (response.data || []) as PhotoWithTags[];
        total = response.meta?.total || items.length;
        setTotalIsApproximate(false); // getPhotos returns exact total
      }

      console.log('Photos response:', items.length, 'items');

      // Add photos to central store
      addPhotos(items);

      if (append) {
        setPhotos((prev) => [...prev, ...items]);
      } else {
        setPhotos(items);
      }

      setOffset(currentOffset + items.length);
      setTotal(total);
      setHasMore(currentOffset + items.length < total);
    } catch (err) {
      console.error('Failed to load photos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  // Create a stable key from searchParams to avoid unnecessary reloads
  const searchParamsKey = JSON.stringify(searchParams || {});

  useEffect(() => {
    setOffset(0);
    loadPhotos(false);
    // Reset selection when search params change
    setSelectionMode(false);
    setSelectedPhotos(new Set());
  }, [searchParamsKey]);

  const handleLoadMore = () => {
    loadPhotos(true);
  };

  const handleLoadAll = async () => {
    if (isLoadingAll) return;
    
    setIsLoadingAll(true);
    cancelLoadAllRef.current = false;
    
    try {
      let currentOffset = offset;
      let loadedCount = photos.length;
      const chunkSize = limit;
      
      while (loadedCount < total) {
        // Check for cancellation
        if (cancelLoadAllRef.current) {
          break;
        }
        
        setLoadAllProgress({ loaded: loadedCount, total });
        
        // Calculate next chunk
        const nextOffset = currentOffset + chunkSize;
        const remainingItems = total - loadedCount;
        const itemsToLoad = Math.min(chunkSize, remainingItems);
        
        // Load chunk directly using the same logic as loadPhotos
        try {
          let items: PhotoWithTags[];
          
          if (searchParams?.collection_id) {
            const response = await apiClient.getCollectionPhotos(
              searchParams.collection_id,
              nextOffset,
              chunkSize
            );
            items = (response.data || []) as PhotoWithTags[];
          } else if (searchParams?.event_id) {
            // For events, we load all at once, so just break
            break;
          } else {
            const result = await apiClient.searchPhotos({ ...searchParams, offset: nextOffset, limit: chunkSize });
            items = result.data as PhotoWithTags[];
          }
          
          if (items.length === 0) {
            break; // No more items
          }
          
          // Append to photos
          setPhotos((prev) => [...prev, ...items]);
          setOffset(nextOffset);
          
          // Update counters
          loadedCount += items.length;
          currentOffset = nextOffset;
          
          // Update hasMore flag
          setHasMore(loadedCount < total);
          
        } catch (err) {
          console.error('Error loading chunk:', err);
          break;
        }
        
        // Small delay for UI update and cancellation check
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setLoadAllProgress({ loaded: loadedCount, total });
      
    } finally {
      setIsLoadingAll(false);
      cancelLoadAllRef.current = false;
      setLoadAllProgress({ loaded: 0, total: 0 });
    }
  };

  const handleCancelLoadAll = () => {
    cancelLoadAllRef.current = true;
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      // Exiting selection mode - clear selections
      setSelectedPhotos(new Set());
    }
  };

  const handlePhotoSelect = (hothash: string, shiftKey: boolean = false) => {
    // Always use sorted photos for selection
    const currentIndex = sortedPhotos.findIndex(p => p.hothash === hothash);
    
    if (shiftKey && lastSelectedIndex !== null && currentIndex !== -1) {
      // Shift+click: select range
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const rangeHashes = sortedPhotos.slice(start, end + 1)
        .map(p => p.hothash);
      
      setSelectedPhotos((prev) => {
        const next = new Set(prev);
        rangeHashes.forEach(hash => next.add(hash));
        return next;
      });
    } else {
      // Normal click: toggle single photo
      setSelectedPhotos((prev) => {
        const next = new Set(prev);
        if (next.has(hothash)) {
          next.delete(hothash);
        } else {
          next.add(hothash);
        }
        return next;
      });
    }
    
    // Update last selected index
    if (currentIndex !== -1) {
      setLastSelectedIndex(currentIndex);
    }
  };

  const handleSelectAll = () => {
    const allHashes = new Set(photos.map(p => p.hothash));
    setSelectedPhotos(allHashes);
  };

  const handleDeselectAll = () => {
    setSelectedPhotos(new Set());
  };

  const handlePhotosAdded = () => {
    // Clear selection after operation
    setSelectedPhotos(new Set());
  };

  const handlePhotoClick = (photo: PhotoWithTags) => {
    if (onPhotoClick) {
      // If external handler provided, use it
      onPhotoClick(photo);
    } else {
      // Otherwise, use built-in photo detail dialog
      setSelectedPhoto(photo);
      setShowPhotoDetail(true);
    }
  };

  const handlePhotoUpdated = (updatedPhoto: PhotoWithTags) => {
    // Update the photo in the local list
    setPhotos((prev) => prev.map(p => 
      p.hothash === updatedPhoto.hothash ? updatedPhoto : p
    ));
    setSelectedPhoto(updatedPhoto);
  };

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => loadPhotos(false)}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (loading && photos.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-zinc-500">Loading photos...</p>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center text-zinc-500">
          <p className="text-lg">No photos found</p>
          <p className="text-sm mt-2">Try adjusting your search filters</p>
        </div>
      </div>
    );
  }

  // Get array of selected photo hashes for actions
  const selectedPhotoHashes = Array.from(selectedPhotos);

  // ALWAYS sort photos chronologically (newest first)
  // PhotoGrid is a workspace for organizing, not an album
  // Default: sort by date taken, newest first
  const sortedPhotos = [...photos].sort((a, b) => {
    const dateA = new Date(a.taken_at || a.created_at).getTime();
    const dateB = new Date(b.taken_at || b.created_at).getTime();
    return dateB - dateA; // Newest first (descending)
  });

  // Group photos by date if enabled
  const groupedPhotos = () => {
    if (!groupByDate) return null;

    const groups: { date: string; month: string; photos: PhotoWithTags[] }[] = [];
    let currentMonth = '';
    let currentDate = '';
    let currentGroup: PhotoWithTags[] = [];

    sortedPhotos.forEach((photo) => {
      const photoDate = new Date(photo.taken_at || photo.created_at);
      const month = photoDate.toLocaleDateString('nb-NO', { year: 'numeric', month: 'long' });
      const date = photoDate.toLocaleDateString('nb-NO', { year: 'numeric', month: 'long', day: 'numeric' });

      if (date !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, month: currentMonth, photos: currentGroup });
        }
        currentDate = date;
        currentMonth = month;
        currentGroup = [photo];
      } else {
        currentGroup.push(photo);
      }
    });

    // Push last group
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, month: currentMonth, photos: currentGroup });
    }

    return groups;
  };

  const photoGroups = groupedPhotos();

  return (
    <div className="flex flex-col h-full">
      {/* Fixed toolbar - never scrolls */}
      <div className="flex-shrink-0 bg-background py-2 border-b">
        <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Limit selector and photo count */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Show:</span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                setLimit(Number(value));
                setOffset(0);
                setPhotos([]);
                loadPhotos(false);
              }}
            >
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-zinc-500">
              {photos.length.toLocaleString('nb-NO')} / {total.toLocaleString('nb-NO')}{totalIsApproximate ? '+' : ''}
            </span>
          </div>

          {/* Batch operations */}
          {enableBatchOperations && (
            <>
              <Button
                variant={selectionMode ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleSelectionMode}
              >
                {selectionMode ? (
                  <>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Exit Select Mode
                  </>
                ) : (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Select Photos
                  </>
                )}
              </Button>
              {selectionMode && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  {selectedPhotos.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeselectAll}
                    >
                      Deselect All
                    </Button>
                  )}
                  <Badge variant="secondary">
                    {selectedPhotos.size} selected
                  </Badge>
                </>
              )}
            </>
          )}
        </div>

        {showViewSelector && !selectionMode && (
          <div className="flex gap-2">
          {/* Group by date toggle */}
          <Button
            variant={groupByDate ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGroupByDate(!groupByDate)}
            title="Group by date"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          
          {/* View size buttons */}
          <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
          <Button
            variant={displaySize === 'small' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDisplaySize('small')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={displaySize === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDisplaySize('medium')}
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={displaySize === 'large' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDisplaySize('large')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={displaySize === 'detailed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDisplaySize('detailed')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        )}

        {/* Load More / Load All buttons - inline */}
        {hasMore && !isLoadingAll && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleLoadMore}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
            <Button
              onClick={handleLoadAll}
              disabled={loading}
              variant="default"
              size="sm"
            >
              Load All ({(total - photos.length).toLocaleString('nb-NO')} remaining)
            </Button>
          </div>
        )}
        </div>
      </div>

      {/* Progress bar below toolbar */}
      {isLoadingAll && (
        <div className="flex-shrink-0 px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium">Laster alle bilder...</span>
                <span className="text-muted-foreground">
                  {loadAllProgress.loaded.toLocaleString('nb-NO')} / {loadAllProgress.total.toLocaleString('nb-NO')}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(loadAllProgress.loaded / loadAllProgress.total) * 100}%` }}
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelLoadAll}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Scrollable photo area */}
      <div className="flex-1 overflow-y-auto">
        {/* Optional header content */}
        {headerContent && <div className="mb-6">{headerContent}</div>}

        {/* Photo grid - grouped or flat */}
      {groupByDate && photoGroups ? (
        // Grouped by date view
        <div className="space-y-8">
          {photoGroups.map((group, groupIndex) => {
            const prevMonth = groupIndex > 0 ? photoGroups[groupIndex - 1].month : null;
            const showMonthHeader = group.month !== prevMonth;

            return (
              <div key={group.date}>
                {/* Month header (only when month changes) */}
                {showMonthHeader && (
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                    {group.month}
                  </h2>
                )}
                
                {/* Day header */}
                <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                  {group.date}
                </h3>

                {/* Photos for this day */}
                <div className={`grid gap-4 ${config.gridCols}`}>
                  {group.photos.map((photo) => (
                    <PhotoCard 
                      key={photo.hothash} 
                      photo={photo} 
                      onClick={handlePhotoClick}
                      selectionMode={selectionMode}
                      isSelected={selectedPhotos.has(photo.hothash)}
                      onSelect={handlePhotoSelect}
                      displaySize={displaySize}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat grid view - always sorted
        <div className={`grid gap-4 ${config.gridCols}`}>
          {sortedPhotos.map((photo) => (
            <PhotoCard 
              key={photo.hothash} 
              photo={photo} 
              onClick={handlePhotoClick}
              selectionMode={selectionMode}
              isSelected={selectedPhotos.has(photo.hothash)}
              onSelect={handlePhotoSelect}
              displaySize={displaySize}
            />
          ))}
        </div>
      )}
      </div>

      {/* Floating Action Bar */}
      {selectionMode && selectedPhotoHashes.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-card border-2 border-primary/20 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">
                {selectedPhotoHashes.length} valgt
              </span>
            </div>
            
            <div className="h-8 w-px bg-border" />
            
            {/* Primary Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddToCollection(true)}
                className="gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                Collection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddToEvent(true)}
                className="gap-2"
              >
                <CalendarDays className="h-4 w-4" />
                Event
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSetAuthor(true)}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                Fotograf
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSetRating(true)}
                className="gap-2"
              >
                <Star className="h-4 w-4" />
                Rating
              </Button>
            </div>
            
            <div className="h-8 w-px bg-border" />
            
            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <MoreHorizontal className="h-4 w-4" />
                  Mer
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Flere handlinger</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Juster tid</span>
                  <span className="ml-auto text-xs text-muted-foreground">Kommer snart</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Juster posisjon</span>
                  <span className="ml-auto text-xs text-muted-foreground">Kommer snart</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Image className="mr-2 h-4 w-4" />
                  <span>Editer preview</span>
                  <span className="ml-auto text-xs text-muted-foreground">Kommer snart</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="h-8 w-px bg-border" />
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeselectAll}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add to Collection Dialog */}
      <AddToCollectionDialog
        open={showAddToCollection}
        onOpenChange={setShowAddToCollection}
        photoHothashes={selectedPhotoHashes}
        onPhotosAdded={handlePhotosAdded}
      />

      {/* Add to Event Dialog */}
      <AddToEventDialog
        open={showAddToEvent}
        onOpenChange={setShowAddToEvent}
        photoHothashes={selectedPhotoHashes}
        onPhotosAdded={handlePhotosAdded}
      />

      {/* Batch Set Author Dialog */}
      <BatchSetAuthorDialog
        open={showSetAuthor}
        onOpenChange={setShowSetAuthor}
        photoHothashes={selectedPhotoHashes}
        onPhotosUpdated={handlePhotosAdded}
      />

      {/* Batch Set Rating Dialog */}
      <BatchSetRatingDialog
        open={showSetRating}
        onOpenChange={setShowSetRating}
        photoHothashes={selectedPhotoHashes}
        onPhotosUpdated={handlePhotosAdded}
      />

      {/* Photo Detail Dialog (built-in, unless external handler provided) */}
      {!onPhotoClick && (
        <PhotoDetailDialog
          photo={selectedPhoto}
          open={showPhotoDetail}
          onOpenChange={setShowPhotoDetail}
          onPhotoUpdated={handlePhotoUpdated}
        />
      )}
    </div>
  );
}
