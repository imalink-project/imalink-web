'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { FileText, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhotoThumbnail } from '@/components/photo-thumbnail';
import type { CollectionItem, CollectionTextCard } from '@/lib/types';

interface CollectionItemGridProps {
  items: CollectionItem[];
  collectionId: number;
  onReorder: (newItems: CollectionItem[]) => void;
  onEditTextCard: (position: number, card: CollectionTextCard) => void;
  onDeleteItem: (position: number) => void;
  onPhotoClick?: (hothash: string) => void;
}

export function CollectionItemGrid({
  items,
  collectionId,
  onReorder,
  onEditTextCard,
  onDeleteItem,
  onPhotoClick,
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
                        hothash={item.photo_hothash}
                        position={index}
                        dragHandleProps={provided.dragHandleProps}
                        onDelete={() => onDeleteItem(index)}
                        onClick={onPhotoClick ? () => onPhotoClick(item.photo_hothash) : undefined}
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
  hothash: string;
  position: number;
  dragHandleProps: any;
  onDelete: () => void;
  onClick?: () => void;
}

function PhotoItemPreview({ hothash, position, dragHandleProps, onDelete, onClick }: PhotoItemPreviewProps) {
  return (
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

      {/* Photo Thumbnail with metadata (uses PhotoStore) */}
      <PhotoThumbnail 
        hothash={hothash}
        size="medium"
        showMetadata={true}
        onClick={onClick}
      />

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
