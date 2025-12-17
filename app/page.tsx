'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PhotoGrid } from '@/components/photo-grid';
import { SearchFilters } from '@/components/search-filters';
import { PhotoDetailDialog } from '@/components/photo-detail-dialog';
import type { PhotoWithTags, SearchParams } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithTags | null>(null);
  const [showPhotoDetail, setShowPhotoDetail] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);



  // Handle search parameter changes
  const handleSearchChange = (params: SearchParams) => {
    setSearchParams(params);
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
    // Will redirect to /login via useEffect
    return null;
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Fixed header */}
        <div className="flex-shrink-0 border-b bg-background px-4 py-4">
          <h1 className="text-3xl font-bold">Bildegalleri</h1>
          <p className="mt-2 text-muted-foreground">
            Utforsk og administrer bildene dine
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar with filters */}
          <aside className="w-[300px] overflow-y-auto px-4 py-6 space-y-4 border-r">
            <SearchFilters onSearchChange={handleSearchChange} />
          </aside>

          {/* Photo Grid - manages its own scroll */}
          <div className="flex-1 px-4 py-6">
            <PhotoGrid
              searchParams={searchParams}
              onPhotoClick={handlePhotoClick}
              enableBatchOperations={true}
            />
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
    </>
  );
}
