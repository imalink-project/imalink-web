'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { PhotoWithTags, SearchParams } from '@/lib/types';
import { usePhotoStore, PHOTO_DISPLAY_CONFIGS } from '@/lib/photo-store';
import { PhotoCard } from './photo-card';
import { Button } from './ui/button';
import { Grid2X2, Grid3X3, LayoutGrid, List } from 'lucide-react';

interface PhotoGridProps {
  searchParams?: SearchParams;
  onPhotoClick?: (photo: PhotoWithTags) => void;
  selectionMode?: boolean;
  selectedPhotos?: Set<string>;
  onPhotoSelect?: (hothash: string) => void;
  showViewSelector?: boolean;
}

export function PhotoGrid({ 
  searchParams, 
  onPhotoClick,
  selectionMode = false,
  selectedPhotos = new Set(),
  onPhotoSelect,
  showViewSelector = true,
}: PhotoGridProps) {
  const [photos, setPhotos] = useState<PhotoWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 30;
  
  // Use photo store for caching and display settings
  const { addPhotos, displaySize, setDisplaySize } = usePhotoStore();
  const config = PHOTO_DISPLAY_CONFIGS[displaySize];

  const loadPhotos = async (append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = append ? offset : 0;
      const response = await apiClient.getPhotos({
        ...searchParams,
        limit,
        offset: currentOffset,
      });

      console.log('Photos response:', response);

      const items = (response.data || []) as PhotoWithTags[];
      const total = response.meta?.total || items.length;

      // Add photos to central store
      addPhotos(items);

      if (append) {
        setPhotos((prev) => [...prev, ...items]);
      } else {
        setPhotos(items);
      }

      setOffset(currentOffset + items.length);
      setHasMore(currentOffset + items.length < total);
    } catch (err) {
      console.error('Failed to load photos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    loadPhotos(false);
  }, [searchParams]);

  const handleLoadMore = () => {
    loadPhotos(true);
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

  return (
    <div className="space-y-6">
      {/* View selector */}
      {showViewSelector && !selectionMode && (
        <div className="flex justify-end gap-2">
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

      <div className={`grid gap-4 ${config.gridCols}`}>
        {photos.map((photo) => (
          <PhotoCard 
            key={photo.hothash} 
            photo={photo} 
            onClick={onPhotoClick}
            selectionMode={selectionMode}
            isSelected={selectedPhotos.has(photo.hothash)}
            onSelect={onPhotoSelect}
            displaySize={displaySize}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={handleLoadMore}
            disabled={loading}
            variant="outline"
            size="lg"
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
