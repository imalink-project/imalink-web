'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CollectionItem } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

interface CollectionSlideshowProps {
  items: CollectionItem[];
  startIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CollectionSlideshow({
  items,
  startIndex = 0,
  isOpen,
  onClose,
}: CollectionSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentItem = items[currentIndex];
  const totalItems = items.length;

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !isOpen) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 4000); // 4 seconds per item

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  // Reset to start index when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
      setIsPlaying(false);
    }
  }, [isOpen, startIndex]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1));
  }, [totalItems]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0));
  }, [totalItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <span className="text-white font-medium">
            {currentIndex + 1} / {totalItems}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="absolute inset-0 flex items-center justify-center p-16">
        {currentItem?.type === 'photo' ? (
          <PhotoSlide hothash={currentItem.photo_hothash} />
        ) : currentItem?.type === 'text' ? (
          <TextSlide
            title={currentItem.text_card.title}
            body={currentItem.text_card.body}
          />
        ) : null}
      </div>

      {/* Navigation arrows (on sides) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 h-16 w-16 text-white hover:bg-white/20 rounded-full"
      >
        <ChevronLeft className="h-10 w-10" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-16 w-16 text-white hover:bg-white/20 rounded-full"
      >
        <ChevronRight className="h-10 w-10" />
      </Button>
    </div>
  );
}

interface PhotoSlideProps {
  hothash: string;
}

function PhotoSlide({ hothash }: PhotoSlideProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    const loadImage = async () => {
      setLoading(true);
      console.log('[Slideshow] Loading image for hothash:', hothash);
      try {
        // Use fetchColdPreview which handles auth and creates Object URL
        // Max width is 2000 according to API spec
        const url = await apiClient.fetchColdPreview(hothash, 2000);
        console.log('[Slideshow] Got image URL:', url.substring(0, 50) + '...');
        if (!cancelled) {
          setImageUrl(url);
          setLoading(false);
        }
      } catch (error) {
        console.error('[Slideshow] Failed to load image:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [hothash]);

  if (loading || !imageUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="Slide"
      className="max-h-full max-w-full object-contain transition-opacity duration-300"
    />
  );
}

interface TextSlideProps {
  title: string;
  body: string;
}

function TextSlide({ title, body }: TextSlideProps) {
  return (
    <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl p-12 text-center">
      <h1 className="text-4xl font-bold mb-6 text-gray-900">{title}</h1>
      {body && (
        <p className="text-xl text-gray-700 whitespace-pre-wrap leading-relaxed">
          {body}
        </p>
      )}
    </div>
  );
}
