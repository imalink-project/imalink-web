'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import type { SavedSearchSummary, SearchParams, PhotoWithTags } from '@/lib/types';
import { Search, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchFilters } from '@/components/search-filters';
import { SavedSearchCard } from '@/components/saved-search-card';
import { SavedSearchDialog } from '@/components/saved-search-dialog';
import { PhotoGrid } from '@/components/photo-grid';
import { PhotoDetailDialog } from '@/components/photo-detail-dialog';

export default function SavedSearchesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [savedSearches, setSavedSearches] = useState<SavedSearchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quick search state
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParams>({});
  
  // Results state
  const [showResults, setShowResults] = useState(false);
  const [executingSearchId, setExecutingSearchId] = useState<number | null>(null);
  const [searchKey, setSearchKey] = useState(0); // Force PhotoGrid refresh on new search
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSearchId, setEditingSearchId] = useState<number | null>(null);
  
  // Photo detail state
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithTags | null>(null);
  const [showPhotoDetail, setShowPhotoDetail] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedSearches();
    }
  }, [isAuthenticated]);

  const loadSavedSearches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getSavedSearches(false, 0, 100);
      setSavedSearches(response.searches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke laste lagrede søk');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = () => {
    setShowResults(true);
    setExecutingSearchId(null);
    setSearchKey(prev => prev + 1); // Force refresh
  };

  const handleExecuteSavedSearch = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the search to extract criteria
      const search = await apiClient.getSavedSearch(id);
      setCurrentSearchParams(search.search_criteria as SearchParams);
      setExecutingSearchId(id);
      setShowResults(true);
      setSearchKey(prev => prev + 1); // Force PhotoGrid refresh
      
      // Execute to update last_executed timestamp
      await apiClient.executeSavedSearch(id, 0, 1);
      
      // Refresh list to update last_executed and result_count
      loadSavedSearches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke kjøre søk');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSearch = (id: number) => {
    setEditingSearchId(id);
    setDialogOpen(true);
  };

  const handleDeleteSearch = async (id: number) => {
    try {
      await apiClient.deleteSavedSearch(id);
      loadSavedSearches();
      
      // Clear results if we were showing this search
      if (executingSearchId === id) {
        setShowResults(false);
        setExecutingSearchId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke slette søk');
    }
  };

  const handleCreateNew = () => {
    setEditingSearchId(null);
    setDialogOpen(true);
  };

  const handleSaveFromQuickSearch = () => {
    setEditingSearchId(null);
    setDialogOpen(true);
  };

  const handleDialogSaved = () => {
    loadSavedSearches();
  };

  const handlePhotoClick = (photo: PhotoWithTags) => {
    setSelectedPhoto(photo);
    setShowPhotoDetail(true);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Lagrede søk</h1>
        <p className="mt-2 text-muted-foreground">
          Smart album som oppdateres automatisk basert på søkekriterier
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Quick Search Section */}
      <div className="mb-8 space-y-4 rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Raskt søk</h2>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Søk i bilder..."
            value={quickSearchQuery}
            onChange={(e) => setQuickSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleQuickSearch();
              }
            }}
          />
          <Button onClick={handleQuickSearch} disabled={loading}>
            Søk
          </Button>
          {Object.keys(currentSearchParams).length > 0 && (
            <Button variant="outline" onClick={handleSaveFromQuickSearch}>
              Lagre søk
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="w-full"
        >
          {showAdvancedFilters ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Skjul avanserte filtere
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Vis avanserte filtere
            </>
          )}
        </Button>

        {showAdvancedFilters && (
          <div className="pt-4 border-t">
            <SearchFilters onSearchChange={setCurrentSearchParams} />
          </div>
        )}
      </div>

      {/* Saved Searches List */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Mine lagrede søk</h2>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nytt søk
          </Button>
        </div>

        {loading && savedSearches.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="text-muted-foreground">Laster...</p>
            </div>
          </div>
        ) : savedSearches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h3 className="mb-2 text-lg font-semibold">Ingen lagrede søk ennå</h3>
            <p className="mb-4 text-muted-foreground">
              Lag ditt første lagrede søk for å komme i gang
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Opprett søk
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedSearches.map((search) => (
              <SavedSearchCard
                key={search.id}
                search={search}
                onExecute={handleExecuteSavedSearch}
                onEdit={handleEditSearch}
                onDelete={handleDeleteSearch}
              />
            ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Søkeresultater</h2>
            <Button variant="outline" onClick={() => setShowResults(false)}>
              Skjul resultater
            </Button>
          </div>
          
          <PhotoGrid
            key={searchKey}
            searchParams={Object.keys(currentSearchParams).length > 0 ? currentSearchParams : undefined}
            onPhotoClick={handlePhotoClick}
            enableBatchOperations={true}
          />
        </div>
      )}

      {/* Create/Edit Dialog */}
      <SavedSearchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        searchId={editingSearchId}
        initialCriteria={editingSearchId ? undefined : currentSearchParams}
        onSaved={handleDialogSaved}
      />

      {/* Photo Detail Dialog */}
      <PhotoDetailDialog
        photo={selectedPhoto}
        open={showPhotoDetail}
        onOpenChange={setShowPhotoDetail}
      />
    </div>
  );
}
