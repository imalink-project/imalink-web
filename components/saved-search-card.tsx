'use client';

import { useState } from 'react';
import { Play, Pencil, Trash2, Star, Clock, Image as ImageIcon } from 'lucide-react';
import type { SavedSearchSummary } from '@/lib/types';
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
import { CardContainer, CardHeader, CardMeta, CardMetaItem } from '@/components/ui/card-container';
import { formatDate } from '@/lib/utils';

interface SavedSearchCardProps {
  search: SavedSearchSummary;
  onExecute: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function SavedSearchCard({ search, onExecute, onEdit, onDelete }: SavedSearchCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete(search.id);
  };

  const favoriteIcon = search.is_favorite ? (
    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
  ) : undefined;

  return (
    <>
      <CardContainer hover>
        <div className="p-4">
          <CardHeader
            title={search.name}
            description={search.description}
            extra={favoriteIcon}
          />

          <CardMeta className="mb-3">
            <CardMetaItem
              icon={<ImageIcon className="h-3 w-3" />}
              label={search.result_count !== null ? `${search.result_count} bilder` : 'Ikke kjørt'}
            />
            <CardMetaItem
              icon={<Clock className="h-3 w-3" />}
              label={`Sist brukt: ${search.last_executed ? formatDate(search.last_executed, 'relative') : 'Aldri'}`}
            />
          </CardMeta>

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
      </CardContainer>

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
