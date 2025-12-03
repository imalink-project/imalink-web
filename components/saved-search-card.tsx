'use client';

import { useState } from 'react';
import { Play, Pencil, Trash2, Star, Clock, Image as ImageIcon } from 'lucide-react';
import type { SavedSearchSummary } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SavedSearchCardProps {
  search: SavedSearchSummary;
  onExecute: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function SavedSearchCard({ search, onExecute, onEdit, onDelete }: SavedSearchCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Aldri';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'I dag';
    if (diffDays === 1) return 'I går';
    if (diffDays < 7) return `${diffDays} dager siden`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} uker siden`;
    
    return date.toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete(search.id);
  };

  return (
    <>
      <Card className="group overflow-hidden transition-all hover:shadow-md">
        <div className="p-4">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold line-clamp-1">{search.name}</h3>
                {search.is_favorite && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                )}
              </div>
              {search.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {search.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              <span>
                {search.result_count !== null ? `${search.result_count} bilder` : 'Ikke kjørt'}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Sist brukt: {formatDate(search.last_executed)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onExecute(search.id)}
              className="flex-1"
            >
              <Play className="mr-2 h-4 w-4" />
              Kjør søk
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(search.id)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett lagret søk?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette &quot;{search.name}&quot;? Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
