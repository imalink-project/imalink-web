'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ThumbnailAspect = 'square' | 'video' | 'wide' | '4/3' | '3/2' | '21/9';

interface ThumbnailProps {
  src: string | null;
  alt: string;
  /**
   * Aspect ratio of the thumbnail
   * @default 'square'
   */
  aspect?: ThumbnailAspect;
  /**
   * Size configuration for the image
   * @default "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
   */
  sizes?: string;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Object fit for the image
   * @default 'cover'
   */
  objectFit?: 'cover' | 'contain';
  /**
   * Show loading spinner while image loads
   * @default true
   */
  showLoading?: boolean;
  /**
   * Scale on hover
   * @default false
   */
  hoverScale?: boolean;
  /**
   * Placeholder icon to show when no image
   */
  placeholderIcon?: React.ReactNode;
}

const aspectClasses: Record<ThumbnailAspect, string> = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  '21/9': 'aspect-[21/9]',
};

/**
 * Unified thumbnail component for displaying images consistently across the app.
 * Handles loading states, errors, and fallback placeholders.
 */
export function Thumbnail({
  src,
  alt,
  aspect = 'square',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  className,
  objectFit = 'cover',
  showLoading = true,
  hoverScale = false,
  placeholderIcon,
}: ThumbnailProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const aspectClass = aspectClasses[aspect];

  // Show placeholder if no src or error occurred
  if (!src || imageError) {
    return (
      <div
        className={cn(
          'relative w-full overflow-hidden bg-muted',
          aspectClass,
          className
        )}
      >
        <div className="flex h-full w-full items-center justify-center">
          {placeholderIcon || <ImageIcon className="h-16 w-16 text-muted-foreground/30" />}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        objectFit === 'contain' ? 'bg-white dark:bg-zinc-900' : 'bg-muted',
        aspectClass,
        className
      )}
    >
      {/* Loading spinner */}
      {showLoading && !imageLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Image */}
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          objectFit === 'cover' ? 'object-cover' : 'object-contain',
          hoverScale && 'transition-transform hover:scale-105',
          !imageLoaded && 'opacity-0'
        )}
        sizes={sizes}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true);
          setImageLoaded(true);
        }}
      />
    </div>
  );
}
