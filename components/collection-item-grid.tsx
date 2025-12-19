'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { FileText, GripVertical, Pencil, Trash2, Calendar, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CollectionItem, CollectionTextCard, CollectionPhotoItem } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

interface CollectionItemGridProps {
  items: CollectionItem[];
  collectionId: number;
  onReorder: (newItems: CollectionItem[]) => void;
  onEditTextCard: (position: number, card: CollectionTextCard) => void;
  onDeleteItem: (position: number) => void;
}

export function CollectionItemGrid({
  items,
  collectionId,
  onReorder,
  onEditTextCard,
  onDeleteItem,
}: CollectionItemGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragEnd = (result: DropResult) => {
    setDraggedIndex(null);

    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) {
      return;
    }

    const newItems = Array.from(items);
    const [removed] = newItems.splice(sourceIndex, 1);
    newItems.splice(destIndex, 0, removed);

    onReorder(newItems);
  };

  return (
    <DragDropContext
      onDragEnd={handleDragEnd}
      onDragStart={(start) => setDraggedIndex(start.source.index)}
    >
      <Droppable droppableId="collection-items" direction="vertical">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-3"
          >
            {items.map((item, index) => (
              <Draggable
                key={`item-${index}`}
                draggableId={`item-${index}`}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`
                      rounded-lg border bg-card transition-all
                      ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : 'shadow-sm'}
                      ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}
                    `}
                  >
                    {item.type === 'photo' ? (
                      <PhotoItemPreview
                        item={item}
                        position={index}
                        dragHandleProps={provided.dragHandleProps}
                        onDelete={() => onDeleteItem(index)}
                      />
                    ) : (
                      <TextCardPreview
                        card={item.text_card}
                        position={index}
                        dragHandleProps={provided.dragHandleProps}
                        onEdit={() => onEditTextCard(index, item.text_card)}
                        onDelete={() => onDeleteItem(index)}
                      />
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-4 h-16 w-16 text-muted-foreground/30" />
                <h3 className="mb-2 text-lg font-semibold">No items yet</h3>
                <p className="text-sm text-muted-foreground">
                  Add photos or text cards to get started
                </p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

interface PhotoItemPreviewProps {
  item: CollectionPhotoItem;
  position: number;
  dragHandleProps: any;
  onDelete: () => void;
}

function PhotoItemPreview({ item, position, dragHandleProps, onDelete }: PhotoItemPreviewProps) {
  const hotpreviewUrl = apiClient.getHotPreviewUrl(item.photo_hothash);
  const photo = item.photo;

  // Format date/time
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('no-NO', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format location
  const formatLocation = (lat: number | null | undefined, lon: number | null | undefined) => {
    if (!lat || !lon) return null;
    return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  };

  const thumbnailContent = (
    <div className="flex items-center gap-3 p-3">
      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Position Badge */}
      <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-medium">
        {position + 1}
      </div>

      {/* Photo Thumbnail */}
      <img
        src={hotpreviewUrl}
        alt={`Photo ${position + 1}`}
        className="h-16 w-16 rounded-md object-cover"
      />

      {/* Photo Label & Metadata */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Photo</p>
        <p className="text-xs text-muted-foreground truncate">{item.photo_hothash.slice(0, 16)}...</p>
        
        {/* Metadata icons (if available) */}
        {photo && (
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {photo.taken_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="truncate">{formatDateTime(photo.taken_at)}</span>
              </div>
            )}
            {photo.has_gps && (
              <MapPin className="h-3 w-3" />
            )}
            {photo.author && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate">{photo.author.name}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  // If we have full photo metadata, wrap in tooltip
  if (photo && (photo.taken_at || photo.has_gps || photo.author)) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {thumbnailContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              {photo.taken_at && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-xs">Tatt</p>
                    <p className="text-xs">{formatDateTime(photo.taken_at)}</p>
                  </div>
                </div>
              )}
              {photo.has_gps && photo.gps_latitude && photo.gps_longitude && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-xs">Posisjon</p>
                    <p className="text-xs">{formatLocation(photo.gps_latitude, photo.gps_longitude)}</p>
                  </div>
                </div>
              )}
              {photo.author && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-xs">Fotograf</p>
                    <p className="text-xs">{photo.author.name}</p>
                  </div>
                </div>
              )}
              {photo.rating > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <span>★</span>
                  <span>{photo.rating}/5</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return thumbnailContent;
}

interface TextCardPreviewProps {
  card: CollectionTextCard;
  position: number;
  dragHandleProps: any;
  onEdit: () => void;
  onDelete: () => void;
}

function TextCardPreview({ card, position, dragHandleProps, onEdit, onDelete }: TextCardPreviewProps) {
  return (
    <div className="flex items-start gap-3 p-3">
      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground pt-1"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Position Badge */}
      <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-medium">
        {position + 1}
      </div>

      {/* Text Card Icon */}
      <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-md bg-primary/10">
        <FileText className="h-8 w-8 text-primary" />
      </div>

      {/* Text Card Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-semibold text-sm line-clamp-1">{card.title}</p>
        {card.body && (
          <p className="text-xs text-muted-foreground line-clamp-2">{card.body}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
