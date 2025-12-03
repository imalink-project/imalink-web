'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import type { SavedSearch, SavedSearchCreate, SavedSearchUpdate, SearchParams } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchFilters } from '@/components/search-filters';

interface SavedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchId?: number | null; // null = create new, number = edit existing
  initialCriteria?: SearchParams; // Pre-fill when creating from quick search
  onSaved: () => void;
}

export function SavedSearchDialog({ 
  open, 
  onOpenChange, 
  searchId, 
  initialCriteria,
  onSaved 
}: SavedSearchDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<SearchParams>(initialCriteria || {});
  const [testResultCount, setTestResultCount] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);

  // Load existing search when editing
  useEffect(() => {
    if (open && searchId) {
      loadSearch(searchId);
    } else if (open && !searchId) {
      // Reset for new search
      setName('');
      setDescription('');
      setIsFavorite(false);
      setSearchCriteria(initialCriteria || {});
      setTestResultCount(null);
      setError(null);
    }
  }, [open, searchId, initialCriteria]);

  const loadSearch = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const search = await apiClient.getSavedSearch(id);
      setName(search.name);
      setDescription(search.description || '');
      setIsFavorite(search.is_favorite);
      setSearchCriteria(search.search_criteria as SearchParams);
      setTestResultCount(search.result_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke laste søk');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSearch = async () => {
    try {
      setTesting(true);
      const result = await apiClient.searchPhotos({ ...searchCriteria, limit: 1 });
      setTestResultCount(result.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke teste søk');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Navn er påkrevd');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (searchId) {
        // Update existing
        const update: SavedSearchUpdate = {
          name: name.trim(),
          description: description.trim() || null,
          is_favorite: isFavorite,
          search_criteria: searchCriteria,
        };
        await apiClient.updateSavedSearch(searchId, update);
      } else {
        // Create new
        const create: SavedSearchCreate = {
          name: name.trim(),
          description: description.trim() || null,
          is_favorite: isFavorite,
          search_criteria: searchCriteria,
        };
        await apiClient.createSavedSearch(create);
      }

      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke lagre søk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {searchId ? 'Rediger lagret søk' : 'Lagre nytt søk'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="search-name">Navn *</Label>
            <Input
              id="search-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Sommer 2024 RAW files"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="search-description">Beskrivelse (valgfri)</Label>
            <Textarea
              id="search-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivelse av søket..."
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Favorite */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <Star 
                className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
              />
              <span>Marker som favoritt</span>
            </button>
          </div>

          {/* Search Criteria */}
          <div className="space-y-2">
            <Label>Søkekriterier</Label>
            <div className="rounded-md border p-4">
              <SearchFilters 
                onSearchChange={setSearchCriteria}
              />
            </div>
          </div>

          {/* Test Button and Result Count */}
          <div className="flex items-center gap-3 rounded-md bg-muted p-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestSearch}
              disabled={testing}
            >
              {testing ? 'Tester...' : 'Test søk'}
            </Button>
            {testResultCount !== null && (
              <span className="text-sm text-muted-foreground">
                {testResultCount} bilder funnet
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={loading || !name.trim()}>
            {loading ? 'Lagrer...' : searchId ? 'Oppdater' : 'Lagre'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
