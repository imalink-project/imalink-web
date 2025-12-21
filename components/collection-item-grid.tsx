'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { FileText, GripVertical, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhotoThumbnail } from '@/components/photo-thumbnail';
import { apiClient } from '@/lib/api-client';
import type { CollectionItem, CollectionTextCard } from '@/lib/types';

interface CollectionItemGridProps {
  items: CollectionItem[];
  collectionId: number;
  onReorder: (newItems: CollectionItem[]) => void;
  onEditTextCard: (position: number, card: CollectionTextCard) => void;
  onDeleteItem: (position: number) => void;
  onPhotoClick?: (hothash: string) => void;
  cursorPosition: number | null; // Position before item N (0 = top, items.length = end)
  onCursorChange: (position: number | null) => void;
  onAddTextCard?: () => void; // Callback to add text card at cursor
  onToggleVisibility?: (position: number, visible: boolean) => void; // Toggle item visibility
  viewMode?: 'compact' | 'full'; // Display mode: compact (cropped) or full (uncropped)
}

export function CollectionItemGrid({
  items,
  collectionId,
  onReorder,
  onEditTextCard,
  onDeleteItem,
  onPhotoClick,
  cursorPosition,
  onCursorChange,
  onAddTextCard,
  onToggleVisibility,
  viewMode = 'compact',
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
              <div key={`item-${index}`} className="relative">
                {/* Cursor indicator BEFORE this item */}
                {cursorPosition === index && (
                  <div className="absolute -top-4 left-0 right-0 flex items-center gap-2 py-1">
                    <div className="flex-1 h-1 bg-primary rounded-full shadow-lg shadow-primary/50" />
                    {onAddTextCard && (
                      <button
                        onClick={onAddTextCard}
                        className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Legg til tekstkort
                      </button>
                    )}
                  </div>
                )}

                {/* Line number button */}
                <button
                  onClick={() => onCursorChange(index)}
                  className={`absolute -left-12 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded text-sm font-mono transition-all ${
                    cursorPosition === index
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  title={`Sett kursor før element ${index + 1}`}
                >
                  {index + 1}
                </button>

                <Draggable
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
                          visible={item.visible !== false}
                          position={index}
                          dragHandleProps={provided.dragHandleProps}
                          onDelete={() => onDeleteItem(index)}
                          onToggleVisibility={onToggleVisibility}
                          onClick={onPhotoClick ? () => onPhotoClick(item.photo_hothash) : undefined}
                          viewMode={viewMode}
                        />
                      ) : (
                      <TextCardPreview
                        card={item.text_card}
                        visible={item.visible !== false}
                        position={index}
                        dragHandleProps={provided.dragHandleProps}
                        onEdit={() => onEditTextCard(index, item.text_card)}
                        onDelete={() => onDeleteItem(index)}
                        onToggleVisibility={onToggleVisibility}
                      />
                    )}
                  </div>
                )}
              </Draggable>
            </div>
            ))}

            {/* "Append" button - cursor at end */}
            <div className="relative">
              {cursorPosition === items.length && (
                <div className="absolute -top-4 left-0 right-0 flex items-center gap-2 py-1">
                  <div className="flex-1 h-1 bg-primary rounded-full shadow-lg shadow-primary/50" />
                  {onAddTextCard && (
                    <button
                      onClick={onAddTextCard}
                      className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      Legg til tekstkort
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => onCursorChange(items.length)}
                className={`w-full py-3 border-2 border-dashed rounded-lg text-sm transition-all ${
                  cursorPosition === items.length
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/30'
                }`}
              >
                {cursorPosition === items.length ? '← Nye elementer legges til her' : 'Klikk for å legge til på slutten'}
              </button>
            </div>

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
  visible: boolean;
  position: number;
  dragHandleProps: any;
  onDelete: () => void;
  onToggleVisibility?: (position: number, visible: boolean) => void;
  onClick?: () => void;
  viewMode?: 'compact' | 'full';
}

function PhotoItemPreview({ hothash, visible, position, dragHandleProps, onDelete, onToggleVisibility, onClick, viewMode = 'compact' }: PhotoItemPreviewProps) {
  const hotpreviewUrl = apiClient.getHotPreviewUrl(hothash);
  
  if (viewMode === 'full') {
    // Full mode: show uncropped hotpreview at full width
    return (
      <div className={`flex flex-col gap-3 p-3 transition-all relative ${!visible ? 'border-l-4 border-l-muted-foreground/30' : ''}`}>
        {/* Top bar with controls */}
        <div className="flex items-center gap-3">
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

          <div className="flex-1" />

          {/* Visibility Toggle */}
          {onToggleVisibility && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleVisibility(position, !visible)}
              className="flex-shrink-0"
              title={visible ? 'Skjul i lysbildevisning' : 'Vis i lysbildevisning'}
            >
              {visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}

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

        {/* Full size hotpreview image - contained within 150x150 like a slideshow */}
        <div className="relative flex items-center justify-center w-[150px] h-[150px]">
          <img
            src={hotpreviewUrl}
            alt={`Photo ${position + 1}`}
            className="max-w-[150px] max-h-[150px] w-auto h-auto object-contain rounded-md cursor-pointer hover:opacity-90 transition-opacity"
            onClick={onClick}
            loading="lazy"
          />
          {!visible && (
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <EyeOff className="h-3 w-3" />
              <span>Skjult</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compact mode: original layout with cropped thumbnail
  return (
    <div className={`flex items-center gap-3 p-3 transition-all relative ${!visible ? 'border-l-4 border-l-muted-foreground/30' : ''}`}>
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

      {/* Photo Thumbnail with metadata (uses PhotoStore) - wrapped with visual indicator */}
      <div className="relative">
        <PhotoThumbnail 
          hothash={hothash}
          size="medium"
          showMetadata={true}
          onClick={onClick}
        />
        {!visible && (
          <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
            <EyeOff className="h-3 w-3" />
            <span>Skjult</span>
          </div>
        )}
      </div>

      {/* Visibility Toggle */}
      {onToggleVisibility && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleVisibility(position, !visible)}
          className="flex-shrink-0"
          title={visible ? 'Skjul i lysbildevisning' : 'Vis i lysbildevisning'}
        >
          {visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      )}

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
  visible: boolean;
  position: number;
  dragHandleProps: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility?: (position: number, visible: boolean) => void;
}

function TextCardPreview({ card, visible, position, dragHandleProps, onEdit, onDelete, onToggleVisibility }: TextCardPreviewProps) {
  return (
    <div className={`flex items-start gap-3 p-3 transition-all relative ${!visible ? 'border-l-4 border-l-muted-foreground/30' : ''}`}>
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
      <div className="flex-1 min-w-0 space-y-1 relative">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <p className="font-semibold text-sm line-clamp-1">{card.title}</p>
            {card.body && (
              <p className="text-xs text-muted-foreground line-clamp-2">{card.body}</p>
            )}
          </div>
          {!visible && (
            <div className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
              <EyeOff className="h-3 w-3" />
              <span>Skjult</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex gap-1">
        {/* Visibility Toggle */}
        {onToggleVisibility && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleVisibility(position, !visible)}
            title={visible ? 'Skjul i lysbildevisning' : 'Vis i lysbildevisning'}
          >
            {visible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}
        
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
