'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { VisibilitySelector } from '@/components/visibility-selector';
import { X, MapPin, Calendar, Camera, Star } from 'lucide-react';
import { VISIBILITY_LEVELS } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import type { Author } from '@/lib/types';

interface PhotoMetadataEditorProps {
  schema: any;
  previewUrl: string | null;
  onUpdate: (updates: any) => void;
  onSave: (tags: string[]) => void;
  onCancel: () => void;
}

export function PhotoMetadataEditor({
  schema,
  previewUrl,
  onUpdate,
  onSave,
  onCancel,
}: PhotoMetadataEditorProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);

  useEffect(() => {
    const loadAuthors = async () => {
      try {
        const response = await apiClient.getAuthors(0, 100);
        setAuthors(response.data || []);
      } catch (err) {
        console.error('Failed to load authors:', err);
      } finally {
        setLoadingAuthors(false);
      }
    };
    loadAuthors();
  }, []);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = () => {
    onSave(tags);
  };

  const exif = schema.exif_dict || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Forhåndsvisning</CardTitle>
        </CardHeader>
        <CardContent>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto rounded-lg"
            />
          )}
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span>{schema.width} × {schema.height}px</span>
            </div>
            {exif.camera_make && exif.camera_model && (
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span>{exif.camera_make} {exif.camera_model}</span>
              </div>
            )}
            {schema.taken_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(schema.taken_at).toLocaleString('no-NO')}</span>
              </div>
            )}
            {schema.gps_latitude && schema.gps_longitude && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {schema.gps_latitude.toFixed(4)}, {schema.gps_longitude.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metadata Editor */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>
              Rediger informasjon om bildet før lagring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visibility */}
            <div className="space-y-2">
              <Label>Synlighet</Label>
              <VisibilitySelector
                value={schema.visibility}
                onChange={(visibility) => onUpdate({ visibility })}
              />
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label>Vurdering</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => onUpdate({ rating })}
                    className="transition-colors"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        rating <= schema.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Author (Photographer) */}
            <div className="space-y-2">
              <Label htmlFor="author">Fotograf</Label>
              <Select
                value={schema.author_id?.toString() || ''}
                onValueChange={(value) => onUpdate({ author_id: value ? parseInt(value) : null })}
                disabled={loadingAuthors}
              >
                <SelectTrigger id="author">
                  <SelectValue placeholder={loadingAuthors ? "Laster fotografer..." : "Velg fotograf"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ingen fotograf</SelectItem>
                  {authors.map((author) => (
                    <SelectItem key={author.id} value={author.id.toString()}>
                      {author.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Kategori (valgfritt)</Label>
              <Input
                id="category"
                value={schema.category || ''}
                onChange={(e) => onUpdate({ category: e.target.value })}
                placeholder="f.eks. ferie, arbeid, familie"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tagger</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Legg til tagg..."
                />
                <Button type="button" onClick={handleAddTag} variant="secondary">
                  Legg til
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* EXIF Details */}
        {Object.keys(exif).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">EXIF-data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {exif.iso && (
                  <>
                    <div className="text-muted-foreground">ISO:</div>
                    <div>{exif.iso}</div>
                  </>
                )}
                {exif.aperture && (
                  <>
                    <div className="text-muted-foreground">Blenderåpning:</div>
                    <div>f/{exif.aperture}</div>
                  </>
                )}
                {exif.shutter_speed && (
                  <>
                    <div className="text-muted-foreground">Lukkertid:</div>
                    <div>{exif.shutter_speed}</div>
                  </>
                )}
                {exif.focal_length && (
                  <>
                    <div className="text-muted-foreground">Brennvidde:</div>
                    <div>{exif.focal_length}mm</div>
                  </>
                )}
                {exif.lens_model && (
                  <>
                    <div className="text-muted-foreground">Objektiv:</div>
                    <div>{exif.lens_model}</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            Lagre foto
          </Button>
          <Button onClick={onCancel} variant="outline">
            Avbryt
          </Button>
        </div>
      </div>
    </div>
  );
}
