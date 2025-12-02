'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { SearchParams, Tag, EventWithPhotos } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SearchFiltersProps {
  onSearchChange: (params: SearchParams) => void;
}

export function SearchFilters({ onSearchChange }: SearchFiltersProps) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [availableEvents, setAvailableEvents] = useState<EventWithPhotos[]>([]);
  const [ratingMin, setRatingMin] = useState<string>('');
  const [ratingMax, setRatingMax] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadTags();
    loadEvents();
  }, []);

  const loadTags = async () => {
    try {
      const tags = await apiClient.getTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const events = await apiClient.getEvents();
      setAvailableEvents(events);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const handleSearch = () => {
    const searchParams: SearchParams & { event_id?: number } = {
      // query field doesn't exist in PhotoSearchRequest - remove or map to proper field
      tag_ids: selectedTags.length > 0 ? selectedTags.map(Number).filter(n => !isNaN(n)) : undefined,
      rating_min: ratingMin ? parseInt(ratingMin) : undefined,
      rating_max: ratingMax ? parseInt(ratingMax) : undefined,
      taken_after: dateFrom || undefined,
      taken_before: dateTo || undefined,
      event_id: selectedEvent || undefined,
    };

    onSearchChange(searchParams);
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleReset = () => {
    setQuery('');
    setSelectedTags([]);
    setSelectedEvent(null);
    setRatingMin('');
    setRatingMax('');
    setDateFrom('');
    setDateTo('');
    onSearchChange({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search & Filter</CardTitle>
        <CardDescription>Find photos in your gallery</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Query */}
        <div className="space-y-2">
          <Label htmlFor="search-query">Search</Label>
          <div className="flex gap-2">
            <Input
              id="search-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search photos..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="ml-2 hover:text-red-200"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </Button>

        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            {/* Events */}
            <div className="space-y-2">
              <Label>Event</Label>
              <select
                value={selectedEvent || ''}
                onChange={(e) => setSelectedEvent(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Alle events</option>
                {availableEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.photo_count} bilder)
                  </option>
                ))}
              </select>
              {selectedEvent && (
                <p className="text-xs text-muted-foreground">
                  Viser bilder fra valgt event
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.name) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag.name)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Rating Range */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="rating-min" className="text-xs text-zinc-500">
                    Min
                  </Label>
                  <Input
                    id="rating-min"
                    type="number"
                    min="0"
                    max="5"
                    value={ratingMin}
                    onChange={(e) => setRatingMin(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="rating-max" className="text-xs text-zinc-500">
                    Max
                  </Label>
                  <Input
                    id="rating-max"
                    type="number"
                    min="0"
                    max="5"
                    value={ratingMax}
                    onChange={(e) => setRatingMax(e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="date-from" className="text-xs text-zinc-500">
                    From
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="date-to" className="text-xs text-zinc-500">
                    To
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
