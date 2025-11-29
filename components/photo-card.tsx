'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { PhotoWithTags } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PhotoCardProps {
  photo: PhotoWithTags;
  onClick?: (photo: PhotoWithTags) => void;
}

export function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Use hot preview for initial load
  const imageUrl = apiClient.getHotPreviewUrl(photo.hothash);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
      onClick={() => onClick?.(photo)}
    >
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
        {!imageError ? (
          <Image
            src={imageUrl}
            alt={displayName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
            Failed to load image
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/20" />

        {/* Rating overlay */}
        {photo.rating && (
          <div className="absolute top-2 right-2 rounded-md bg-black/50 px-2 py-1 backdrop-blur-sm">
            {renderStars(photo.rating)}
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <p className="truncate text-sm font-medium">
          {displayName}
        </p>

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{formatDate(photo.taken_at || photo.created_at)}</span>
          <span>
            {photo.width} × {photo.height}
          </span>
        </div>

        {/* Tags */}
        {photo.tags && photo.tags.length > 0 && (
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

        {/* Location */}
        {(photo.gps_latitude || photo.gps_longitude) && (
          <p className="truncate text-xs text-zinc-500">
            📍 {photo.gps_latitude?.toFixed(4)}, {photo.gps_longitude?.toFixed(4)}
          </p>
        )}
      </div>
    </Card>
  );
}
