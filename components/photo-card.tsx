'use client';

import type { PhotoWithTags } from '@/lib/types';
import type { PhotoDisplaySize } from '@/lib/photo-store';
import { PHOTO_DISPLAY_CONFIGS } from '@/lib/photo-store';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thumbnail, type ThumbnailAspect } from '@/components/ui/thumbnail';
import { formatDate } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PhotoCardProps {
  photo: PhotoWithTags;
  onClick?: (photo: PhotoWithTags) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  isProcessed?: boolean;
  onSelect?: (hothash: string) => void;
  displaySize?: PhotoDisplaySize;
}

// Map display size to thumbnail aspect ratio
const displaySizeToAspect: Record<PhotoDisplaySize, ThumbnailAspect> = {
  small: 'square',
  medium: 'square',
  large: 'square',
  detailed: '3/2',
};

export function PhotoCard({ 
  photo, 
  onClick,
  selectionMode = false,
  isSelected = false,
  isProcessed = false,
  onSelect,
  displaySize = 'medium',
}: PhotoCardProps) {
  // Use hot preview for initial load
  const imageUrl = apiClient.getHotPreviewUrl(photo.hothash);
  
  // Get display configuration
  const config = PHOTO_DISPLAY_CONFIGS[displaySize];
  const thumbnailAspect = displaySizeToAspect[displaySize];
  const objectFit = config.objectFit || 'cover';

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`text-xs ${
              i < rating ? 'text-yellow-500' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Support both old (image_files) and new (files) array names, and primary_filename
  const primaryFile = photo.files?.[0] || photo.image_files?.[0];
  const displayName = photo.primary_filename || primaryFile?.filename || 'Unknown';

  const handleClick = () => {
    // Prevent interaction with processed photos in selection mode
    if (isProcessed && selectionMode) {
      return;
    }
    
    if (selectionMode && onSelect) {
      onSelect(photo.hothash);
    } else {
      onClick?.(photo);
    }
  };

  const cardContent = (
    <Card
      className={`group overflow-hidden transition-all ${
        isProcessed ? 'opacity-50 cursor-default' : 'cursor-pointer hover:shadow-lg'
      } ${
        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      onClick={handleClick}
    >
      <div className="relative">
        <Thumbnail
          src={imageUrl}
          alt={displayName}
          aspect={thumbnailAspect}
          objectFit={objectFit}
          showLoading={true}
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/20" />

        {/* Selection checkbox */}
        {selectionMode && (
          <div className="absolute top-2 left-2 z-10">
            <div className={`h-6 w-6 rounded-md border-2 flex items-center justify-center ${
              isSelected 
                ? 'bg-primary border-primary' 
                : 'bg-white/80 border-white backdrop-blur-sm'
            }`}>
              {isSelected && (
                <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Rating overlay */}
        {photo.rating && !selectionMode && (
          <div className="absolute top-2 right-2 rounded-md bg-black/50 px-2 py-1 backdrop-blur-sm">
            {renderStars(photo.rating)}
          </div>
        )}

        {/* Processed overlay */}
        {isProcessed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <div className="rounded-full bg-green-500 p-3 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {config.showMetadata && (
        <div className="p-3 space-y-2">
          <p className="truncate text-sm font-medium">
            {displayName}
          </p>

          {config.showDate && (
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{formatDate(photo.taken_at || photo.created_at, 'short')}</span>
              <span>
                {photo.width} × {photo.height}
              </span>
            </div>
          )}

          {/* Tags */}
          {config.showTags && photo.tags && photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {photo.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {photo.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{photo.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Event badge (one-to-many: max ONE event) */}
          {config.showTags && photo.event && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className="text-xs border-blue-500 text-blue-700 dark:text-blue-400 cursor-help"
                  >
                    📅 {photo.event.name}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <p className="font-semibold">{photo.event.name}</p>
                    {photo.event.description && (
                      <p className="text-muted-foreground mt-1">{photo.event.description}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Location */}
          {config.showTags && (photo.gps_latitude || photo.gps_longitude) && (
            <p className="truncate text-xs text-zinc-500">
              📍 {photo.gps_latitude?.toFixed(4)}, {photo.gps_longitude?.toFixed(4)}
            </p>
          )}
        </div>
      )}
    </Card>
  );

  // Wrap with tooltip for small/medium sizes
  if (config.showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p className="font-semibold">{displayName}</p>
              <p className="text-muted-foreground">
                {formatDate(photo.taken_at || photo.created_at, 'short')}
              </p>
              <p className="text-muted-foreground">
                {photo.width} × {photo.height}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}
