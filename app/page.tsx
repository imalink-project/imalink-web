'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useBildeliste } from '@/lib/bildeliste-context';
import { AuthForm } from '@/components/auth-form';
import { BildelisteViewer } from '@/components/bildeliste-viewer';
import { SearchFilters } from '@/components/search-filters';
import { PhotoDetailDialog } from '@/components/photo-detail-dialog';
import type { PhotoWithTags, SearchParams } from '@/lib/types';

export default function Home() {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const { loadFromSearch, activeBildelisteId, setActiveBildeliste } = useBildeliste();
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithTags | null>(null);
  const [showPhotoDetail, setShowPhotoDetail] = useState(false);
  const [searching, setSearching] = useState(false);

  // Load initial search results
  useEffect(() => {
    if (isAuthenticated) {
      // Check if we should refresh (e.g., after photo import)
      const params = new URLSearchParams(window.location.search);
      const shouldRefresh = params.get('refresh') === 'true';
      
      if (shouldRefresh || !activeBildelisteId) {
        handleSearch(searchParams);
      }
    }
  }, [isAuthenticated]);

  // Handle search parameter changes
  const handleSearchChange = async (params: SearchParams) => {
    setSearchParams(params);
    await handleSearch(params);
  };

  const handleSearch = async (params: SearchParams) => {
    setSearching(true);
    try {
      const bildelisteId = await loadFromSearch(params, 'Søkeresultat');
      setActiveBildeliste(bildelisteId);
    } catch (error) {
      console.error('Failed to load search results:', error);
    } finally {
      setSearching(false);
    }
  };

  const handlePhotoClick = (photo: PhotoWithTags) => {
    setSelectedPhoto(photo);
    setShowPhotoDetail(true);
  };

  const handlePhotoUpdated = (updatedPhoto: PhotoWithTags) => {
    // Optionally refresh the bildeliste or update the local photo
    setSelectedPhoto(updatedPhoto);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Bildegalleri</h1>
          <p className="mt-2 text-muted-foreground">
            Utforsk og administrer bildene dine
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Sidebar with filters */}
          <aside className="space-y-4">
            <SearchFilters onSearchChange={handleSearchChange} />
          </aside>

          {/* Photo Grid */}
          <div>
            {searching && (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                  <p className="mt-4 text-zinc-500">Søker...</p>
                </div>
              </div>
            )}
            {!searching && activeBildelisteId && (
              <BildelisteViewer
                bildelisteId={activeBildelisteId}
                onPhotoClick={handlePhotoClick}
              />
            )}
          </div>
        </div>
      </div>

      {/* Photo Detail Dialog */}
      <PhotoDetailDialog
        photo={selectedPhoto}
        open={showPhotoDetail}
        onOpenChange={setShowPhotoDetail}
        onPhotoUpdated={handlePhotoUpdated}
      />
    </div>
  );
}
