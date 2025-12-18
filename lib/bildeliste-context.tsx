'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient } from './api-client';
import type { PhotoWithTags, SearchParams, Collection } from './types';
import type { Bildeliste, BildelisteSource } from './bildeliste';
import {
  createBildeliste,
  loadBildelisterFromStorage,
  saveBildelisterToStorage,
  enforceBildelisteLimit,
  generateManualLabel,
  getLabelFromSource,
  addPhotosToBildeliste,
  removePhotosFromBildeliste,
  updateBildelistePhotos,
  markBildelisteAccessed,
  markBildelisteModified,
} from './bildeliste';

interface BildelisteContextValue {
  bildelister: Bildeliste[];
  activeBildelisteId: string | null;
  
  // Create/Delete
  createEmptyBildeliste(): string;
  createBildelisteFromPhotos(photos: PhotoWithTags[], label?: string): string;
  deleteBildeliste(id: string): void;
  
  // Selection
  setActiveBildeliste(id: string | null): void;
  getActiveBildeliste(): Bildeliste | null;
  getBildeliste(id: string): Bildeliste | null;
  
  // Photo operations
  addPhotos(bildelisteId: string, photos: PhotoWithTags[]): void;
  removePhotos(bildelisteId: string, hothashes: string[]): void;
  replacePhotos(bildelisteId: string, photos: PhotoWithTags[]): void;
  movePhotos(fromId: string, toId: string, hothashes: string[]): void;
  copyPhotos(fromId: string, toId: string, hothashes: string[]): void;
  
  // Load from server
  loadFromCollection(collectionId: number): Promise<string>;
  loadFromSearch(params: SearchParams, description?: string): Promise<string>;
  
  // Save to server
  saveAsCollection(bildelisteId: string, name: string, description?: string): Promise<Collection>;
  
  // Metadata
  renameBildeliste(id: string, newLabel: string): void;
  markAsUnmodified(id: string): void;
}

const BildelisteContext = createContext<BildelisteContextValue | null>(null);

export function useBildeliste(): BildelisteContextValue {
  const context = useContext(BildelisteContext);
  if (!context) {
    throw new Error('useBildeliste must be used within BildelisteProvider');
  }
  return context;
}

interface BildelisteProviderProps {
  children: ReactNode;
}

export function BildelisteProvider({ children }: BildelisteProviderProps) {
  const [bildelister, setBildelister] = useState<Bildeliste[]>([]);
  const [activeBildelisteId, setActiveBildelisteId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const loaded = loadBildelisterFromStorage();
    setBildelister(loaded);
    setInitialized(true);
  }, []);

  // Save to LocalStorage whenever bildelister change
  useEffect(() => {
    if (initialized) {
      saveBildelisterToStorage(bildelister);
    }
  }, [bildelister, initialized]);

  // Helper to update bildelister
  const updateBildelister = useCallback((updater: (prev: Bildeliste[]) => Bildeliste[]) => {
    setBildelister((prev) => {
      const updated = updater(prev);
      return enforceBildelisteLimit(updated);
    });
  }, []);

  // Create empty bildeliste
  const createEmptyBildeliste = useCallback((): string => {
    const number = bildelister.filter(b => b.source.type === 'manual').length + 1;
    const source: BildelisteSource = { type: 'manual', number };
    const label = getLabelFromSource(source);
    const bildeliste = createBildeliste(label, source);
    
    updateBildelister((prev) => [...prev, bildeliste]);
    return bildeliste.id;
  }, [bildelister, updateBildelister]);

  // Create bildeliste from photos
  const createBildelisteFromPhotos = useCallback((photos: PhotoWithTags[], label?: string): string => {
    const number = bildelister.filter(b => b.source.type === 'manual').length + 1;
    const source: BildelisteSource = { type: 'manual', number };
    const finalLabel = label || getLabelFromSource(source);
    const bildeliste = createBildeliste(finalLabel, source, photos, photos.length);
    
    updateBildelister((prev) => [...prev, bildeliste]);
    return bildeliste.id;
  }, [bildelister, updateBildelister]);

  // Delete bildeliste
  const deleteBildeliste = useCallback((id: string) => {
    updateBildelister((prev) => prev.filter(b => b.id !== id));
    if (activeBildelisteId === id) {
      setActiveBildelisteId(null);
    }
  }, [activeBildelisteId, updateBildelister]);

  // Set active bildeliste
  const setActiveBildeliste = useCallback((id: string | null) => {
    setActiveBildelisteId(id);
    if (id) {
      // Mark as accessed
      updateBildelister((prev) => 
        prev.map(b => b.id === id ? markBildelisteAccessed(b) : b)
      );
    }
  }, [updateBildelister]);

  // Get active bildeliste
  const getActiveBildeliste = useCallback((): Bildeliste | null => {
    if (!activeBildelisteId) return null;
    return bildelister.find(b => b.id === activeBildelisteId) || null;
  }, [activeBildelisteId, bildelister]);

  // Get bildeliste by ID
  const getBildeliste = useCallback((id: string): Bildeliste | null => {
    return bildelister.find(b => b.id === id) || null;
  }, [bildelister]);

  // Add photos to bildeliste
  const addPhotos = useCallback((bildelisteId: string, photos: PhotoWithTags[]) => {
    updateBildelister((prev) => 
      prev.map(b => b.id === bildelisteId ? addPhotosToBildeliste(b, photos) : b)
    );
  }, [updateBildelister]);

  // Remove photos from bildeliste
  const removePhotos = useCallback((bildelisteId: string, hothashes: string[]) => {
    updateBildelister((prev) => 
      prev.map(b => b.id === bildelisteId ? removePhotosFromBildeliste(b, hothashes) : b)
    );
  }, [updateBildelister]);

  // Replace all photos in bildeliste
  const replacePhotos = useCallback((bildelisteId: string, photos: PhotoWithTags[]) => {
    updateBildelister((prev) => 
      prev.map(b => b.id === bildelisteId ? updateBildelistePhotos(b, photos) : b)
    );
  }, [updateBildelister]);

  // Move photos between bildelister
  const movePhotos = useCallback((fromId: string, toId: string, hothashes: string[]) => {
    const fromBildeliste = bildelister.find(b => b.id === fromId);
    if (!fromBildeliste) return;

    const photosToMove = fromBildeliste.photos.filter(p => hothashes.includes(p.hothash));
    
    updateBildelister((prev) => 
      prev.map(b => {
        if (b.id === fromId) {
          return removePhotosFromBildeliste(b, hothashes);
        } else if (b.id === toId) {
          return addPhotosToBildeliste(b, photosToMove);
        }
        return b;
      })
    );
  }, [bildelister, updateBildelister]);

  // Copy photos between bildelister
  const copyPhotos = useCallback((fromId: string, toId: string, hothashes: string[]) => {
    const fromBildeliste = bildelister.find(b => b.id === fromId);
    if (!fromBildeliste) return;

    const photosToCopy = fromBildeliste.photos.filter(p => hothashes.includes(p.hothash));
    
    updateBildelister((prev) => 
      prev.map(b => b.id === toId ? addPhotosToBildeliste(b, photosToCopy) : b)
    );
  }, [bildelister, updateBildelister]);

  // Load from collection
  const loadFromCollection = useCallback(async (collectionId: number): Promise<string> => {
    const collection = await apiClient.getCollection(collectionId);
    const photos = await apiClient.getCollectionPhotos(collectionId, 0, 1000) as PhotoWithTags[];
    
    const source: BildelisteSource = { 
      type: 'collection', 
      id: collectionId, 
      name: collection.name 
    };
    
    const bildeliste = createBildeliste(
      collection.name,
      source,
      photos,
      collection.photo_count
    );
    
    updateBildelister((prev) => [...prev, bildeliste]);
    return bildeliste.id;
  }, [updateBildelister]);

  // Load from search
  const loadFromSearch = useCallback(async (params: SearchParams, description?: string): Promise<string> => {
    const response = await apiClient.getPhotos({ ...params, limit: 1000 });
    const photos = (response.data || []) as PhotoWithTags[];
    const total = response.meta?.total || photos.length;
    
    const source: BildelisteSource = { type: 'search', params, description };
    const label = getLabelFromSource(source);
    
    const bildeliste = createBildeliste(label, source, photos, total);
    
    updateBildelister((prev) => [...prev, bildeliste]);
    return bildeliste.id;
  }, [updateBildelister]);

  // Save as collection
  const saveAsCollection = useCallback(async (
    bildelisteId: string, 
    name: string, 
    description?: string
  ): Promise<Collection> => {
    const bildeliste = bildelister.find(b => b.id === bildelisteId);
    if (!bildeliste) {
      throw new Error('Bildeliste not found');
    }

    // Create collection on server
    const collection = await apiClient.createCollection({
      name,
      description: description || undefined,
    });

    // Add photos to collection
    const hothashes = bildeliste.photos.map(p => p.hothash);
    if (hothashes.length > 0) {
      await apiClient.addPhotosToCollection(collection.id, hothashes);
    }

    // Update bildeliste source and mark as unmodified
    updateBildelister((prev) => 
      prev.map(b => {
        if (b.id === bildelisteId) {
          return {
            ...b,
            label: name,
            source: { type: 'collection', id: collection.id, name },
            modified: false,
          };
        }
        return b;
      })
    );

    return collection;
  }, [bildelister, updateBildelister]);

  // Rename bildeliste
  const renameBildeliste = useCallback((id: string, newLabel: string) => {
    updateBildelister((prev) => 
      prev.map(b => b.id === id ? { ...b, label: newLabel } : b)
    );
  }, [updateBildelister]);

  // Mark as unmodified
  const markAsUnmodified = useCallback((id: string) => {
    updateBildelister((prev) => 
      prev.map(b => b.id === id ? markBildelisteModified(b, false) : b)
    );
  }, [updateBildelister]);

  const value: BildelisteContextValue = {
    bildelister,
    activeBildelisteId,
    createEmptyBildeliste,
    createBildelisteFromPhotos,
    deleteBildeliste,
    setActiveBildeliste,
    getActiveBildeliste,
    getBildeliste,
    addPhotos,
    removePhotos,
    replacePhotos,
    movePhotos,
    copyPhotos,
    loadFromCollection,
    loadFromSearch,
    saveAsCollection,
    renameBildeliste,
    markAsUnmodified,
  };

  return (
    <BildelisteContext.Provider value={value}>
      {children}
    </BildelisteContext.Provider>
  );
}
