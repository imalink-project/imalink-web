'use client';

import { usePhotoStore } from '@/lib/photo-store';
import { apiClient } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { Calendar, MapPin, User, Star } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PhotoThumbnailProps {
  hothash: string;
  size?: 'small' | 'medium' | 'large';
  showMetadata?: boolean; // Show metadata icons inline
  className?: string;
  onClick?: () => void;
}

/**
 * PhotoThumbnail - Felles thumbnail komponent som henter photo fra PhotoStore
 * 
 * Brukes både i PhotoGrid og CollectionItemGrid for konsistent visning.
 * Viser thumbnail med optional metadata (tid, lokasjon, fotograf).
 * Tooltip viser full detaljer ved hover.
 */
export function PhotoThumbnail({
  hothash,
  size = 'medium',
  showMetadata = true,
  className = '',
  onClick,
}: PhotoThumbnailProps) {
  const { getPhoto } = usePhotoStore();
  const photo = getPhoto(hothash);

  const hotpreviewUrl = apiClient.getHotPreviewUrl(hothash);

  // Size mappings
  const sizeClasses = {
    small: 'h-12 w-12',
    medium: 'h-16 w-16',
    large: 'h-24 w-24',
  };

  // Format date/time
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('no-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format location
  const formatLocation = (lat: number | null | undefined, lon: number | null | undefined) => {
    if (!lat || !lon) return null;
    return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  };

  const thumbnailContent = (
    <div className={`flex items-center gap-3 ${className}`} onClick={onClick}>
      {/* Thumbnail */}
      <img
        src={hotpreviewUrl}
        alt={photo?.primary_filename || `Photo ${hothash.slice(0, 8)}`}
        className={`${sizeClasses[size]} rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity`}
      />

      {/* Metadata (if photo data available and showMetadata) */}
      {photo && showMetadata && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {photo.primary_filename || 'Photo'}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {photo.taken_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="truncate">{formatDateTime(photo.taken_at)}</span>
              </div>
            )}
            {photo.has_gps && <MapPin className="h-3 w-3" />}
            {photo.author && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate">{photo.author.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // If we have full photo metadata, wrap in tooltip
  if (photo && (photo.taken_at || photo.has_gps || photo.author)) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {thumbnailContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              {photo.primary_filename && (
                <p className="font-medium text-sm">{photo.primary_filename}</p>
              )}
              {photo.taken_at && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-xs">Tatt</p>
                    <p className="text-xs">{formatDateTime(photo.taken_at)}</p>
                  </div>
                </div>
              )}
              {photo.has_gps && photo.gps_latitude && photo.gps_longitude && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-xs">Posisjon</p>
                    <p className="text-xs">{formatLocation(photo.gps_latitude, photo.gps_longitude)}</p>
                  </div>
                </div>
              )}
              {photo.author && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-xs">Fotograf</p>
                    <p className="text-xs">{photo.author.name}</p>
                  </div>
                </div>
              )}
              {photo.rating > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span>{photo.rating}/5</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return thumbnailContent;
}
