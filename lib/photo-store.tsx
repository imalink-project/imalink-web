'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { PhotoWithTags } from './types';

/**
 * Photo Display Size Variants
 */
export type PhotoDisplaySize = 'small' | 'medium' | 'large' | 'detailed';

/**
 * Photo Store Interface
 * Central cache for all photos loaded in the application
 */
interface PhotoStore {
  // Photo cache: hothash -> PhotoWithTags
  photos: Map<string, PhotoWithTags>;
  
  // Display preferences
  displaySize: PhotoDisplaySize;
  
  // Methods
  addPhoto: (photo: PhotoWithTags) => void;
  addPhotos: (photos: PhotoWithTags[]) => void;
  getPhoto: (hothash: string) => PhotoWithTags | undefined;
  updatePhoto: (hothash: string, updates: Partial<PhotoWithTags>) => void;
  removePhoto: (hothash: string) => void;
  clearCache: () => void;
  setDisplaySize: (size: PhotoDisplaySize) => void;
  
  // Utility
  hasPhoto: (hothash: string) => boolean;
  getPhotoCount: () => number;
}

const PhotoStoreContext = createContext<PhotoStore | undefined>(undefined);

/**
 * Photo Store Provider
 * Wraps the application to provide centralized photo caching
 */
export function PhotoStoreProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Map<string, PhotoWithTags>>(new Map());
  const [displaySize, setDisplaySize] = useState<PhotoDisplaySize>('medium');

  const addPhoto = useCallback((photo: PhotoWithTags) => {
    setPhotos(prev => {
      const newMap = new Map(prev);
      newMap.set(photo.hothash, photo);
      return newMap;
    });
  }, []);

  const addPhotos = useCallback((newPhotos: PhotoWithTags[]) => {
    setPhotos(prev => {
      const newMap = new Map(prev);
      newPhotos.forEach(photo => {
        newMap.set(photo.hothash, photo);
      });
      return newMap;
    });
  }, []);

  const getPhoto = useCallback((hothash: string) => {
    return photos.get(hothash);
  }, [photos]);

  const updatePhoto = useCallback((hothash: string, updates: Partial<PhotoWithTags>) => {
    setPhotos(prev => {
      const existing = prev.get(hothash);
      if (!existing) return prev;
      
      const newMap = new Map(prev);
      newMap.set(hothash, { ...existing, ...updates });
      return newMap;
    });
  }, []);

  const removePhoto = useCallback((hothash: string) => {
    setPhotos(prev => {
      const newMap = new Map(prev);
      newMap.delete(hothash);
      return newMap;
    });
  }, []);

  const clearCache = useCallback(() => {
    setPhotos(new Map());
  }, []);

  const hasPhoto = useCallback((hothash: string) => {
    return photos.has(hothash);
  }, [photos]);

  const getPhotoCount = useCallback(() => {
    return photos.size;
  }, [photos]);

  const value: PhotoStore = {
    photos,
    displaySize,
    addPhoto,
    addPhotos,
    getPhoto,
    updatePhoto,
    removePhoto,
    clearCache,
    setDisplaySize,
    hasPhoto,
    getPhotoCount,
  };

  return (
    <PhotoStoreContext.Provider value={value}>
      {children}
    </PhotoStoreContext.Provider>
  );
}

/**
 * Hook to access Photo Store
 */
export function usePhotoStore() {
  const context = useContext(PhotoStoreContext);
  if (!context) {
    throw new Error('usePhotoStore must be used within PhotoStoreProvider');
  }
  return context;
}

/**
 * Hook to get a specific photo from store
 */
export function usePhoto(hothash: string) {
  const { getPhoto } = usePhotoStore();
  return getPhoto(hothash);
}

/**
 * Display size configurations
 */
export const PHOTO_DISPLAY_CONFIGS = {
  small: {
    gridCols: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12',
    cardHeight: 'aspect-square',
    showMetadata: false,
    showTooltip: true,
    showTags: false,
    showDate: false,
    objectFit: 'contain' as const,
  },
  medium: {
    gridCols: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10',
    cardHeight: 'aspect-square',
    showMetadata: false,
    showTooltip: true,
    showTags: false,
    showDate: false,
    objectFit: 'contain' as const,
  },
  large: {
    gridCols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    cardHeight: 'aspect-square',
    showMetadata: true,
    showTooltip: false,
    showTags: false,
    showDate: true,
    objectFit: 'contain' as const,
  },
  detailed: {
    gridCols: 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cardHeight: 'aspect-[3/2]',
    showMetadata: true,
    showTooltip: false,
    showTags: true,
    showDate: true,
    objectFit: 'contain' as const,
  },
} as const;
