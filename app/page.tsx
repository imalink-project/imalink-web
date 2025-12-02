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
