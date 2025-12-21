'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Maximize, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  // Filter out invisible items for slideshow
  const visibleItems = items.filter(item => item.visible !== false);
  
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [interval, setInterval] = useState(4000); // milliseconds
  const [transition, setTransition] = useState<'fade' | 'none'>('fade');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentItem = visibleItems[currentIndex];
  const totalItems = visibleItems.length;

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !isOpen) return;

    const timer = setTimeout(() => {
      handleNext();
    }, interval);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, isOpen, interval]);

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
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            onClose();
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, toggleFullscreen]);

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
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black">
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
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="text-white hover:bg-white/20"
            title="Innstillinger"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/20"
            title={isFullscreen ? 'Avslutt fullskjerm (F)' : 'Fullskjerm (F)'}
          >
            <Maximize className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
            title="Lukk (Esc)"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="absolute inset-0 flex items-center justify-center p-16">
        {currentItem?.type === 'photo' ? (
          <PhotoSlide 
            hothash={currentItem.photo_hothash} 
            caption={currentItem.caption} 
            transition={transition} 
          />
        ) : currentItem?.type === 'text' ? (
          <TextSlide
            title={currentItem.text_card.title}
            body={currentItem.text_card.body}
            transition={transition}
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

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lysbildevisning - Innstillinger</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="interval">Intervall mellom bilder</Label>
              <Select
                value={interval.toString()}
                onValueChange={(value) => setInterval(parseInt(value))}
              >
                <SelectTrigger id="interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2000">2 sekunder</SelectItem>
                  <SelectItem value="3000">3 sekunder</SelectItem>
                  <SelectItem value="4000">4 sekunder (standard)</SelectItem>
                  <SelectItem value="5000">5 sekunder</SelectItem>
                  <SelectItem value="7000">7 sekunder</SelectItem>
                  <SelectItem value="10000">10 sekunder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transition">Overgang</Label>
              <Select
                value={transition}
                onValueChange={(value) => setTransition(value as 'fade' | 'none')}
              >
                <SelectTrigger id="transition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="none">Ingen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 text-sm text-muted-foreground space-y-1">
              <p><strong>Snarveier:</strong></p>
              <p>← → : Navigér</p>
              <p>Space: Play/Pause</p>
              <p>F: Fullskjerm</p>
              <p>Esc: Lukk</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PhotoSlideProps {
  hothash: string;
  caption?: string | null;
  transition: 'fade' | 'none';
}

function PhotoSlide({ hothash, caption, transition }: PhotoSlideProps) {
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
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <img
        src={imageUrl}
        alt="Slide"
        className={`max-h-[calc(100%-4rem)] max-w-full object-contain ${transition === 'fade' ? 'transition-opacity duration-300' : ''}`}
      />
      {caption && (
        <p className="max-w-3xl text-center text-base text-white/90 px-8">
          {caption}
        </p>
      )}
    </div>
  );
}

interface TextSlideProps {
  title: string;
  body: string;
  transition: 'fade' | 'none';
}

function TextSlide({ title, body, transition }: TextSlideProps) {
  return (
    <div className={`w-full max-w-4xl bg-white rounded-lg shadow-2xl p-12 text-center ${transition === 'fade' ? 'transition-opacity duration-300' : ''}`}>
      <h1 className="text-4xl font-bold mb-6 text-gray-900">{title}</h1>
      {body && (
        <p className="text-xl text-gray-700 whitespace-pre-wrap leading-relaxed">
          {body}
        </p>
      )}
    </div>
  );
}
