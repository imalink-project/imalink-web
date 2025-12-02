'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EventTreeNode } from '@/lib/types';
import { ChevronRight, ChevronDown, Calendar, MapPin, Images } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventTreeViewProps {
  events: EventTreeNode[];
  onEventClick?: (eventId: number) => void;
  className?: string;
}

export function EventTreeView({ events, onEventClick, className }: EventTreeViewProps) {
  const router = useRouter();

  const handleEventClick = (eventId: number) => {
    if (onEventClick) {
      onEventClick(eventId);
    } else {
      router.push(`/events/${eventId}`);
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      {events.map((event) => (
        <EventTreeNodeComponent
          key={event.id}
          node={event}
          level={0}
          onEventClick={handleEventClick}
        />
      ))}
    </div>
  );
}

interface EventTreeNodeComponentProps {
  node: EventTreeNode;
  level: number;
  onEventClick: (eventId: number) => void;
}

function EventTreeNodeComponent({ node, level, onEventClick }: EventTreeNodeComponentProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const hasChildren = node.children && node.children.length > 0;

  const formatDateRange = (event: EventTreeNode) => {
    if (!event.start_date) return null;
    
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('no-NO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    const start = formatDate(event.start_date);
    const end = event.end_date ? formatDate(event.end_date) : null;
    return end && end !== start ? `${start} - ${end}` : start;
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-start gap-2 rounded-lg p-3 transition-colors hover:bg-accent cursor-pointer',
          level > 0 && 'ml-6'
        )}
        style={{ paddingLeft: `${level * 1.5}rem` }}
      >
        {/* Expand/collapse button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mt-0.5 text-muted-foreground hover:text-foreground transition-transform"
            aria-label={isExpanded ? 'Skjul under-events' : 'Vis under-events'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Spacer for events without children */}
        {!hasChildren && <div className="w-4" />}

        {/* Event content */}
        <div
          className="flex-1 min-w-0"
          onClick={() => onEventClick(node.id)}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium truncate">{node.name}</h3>
            <span className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
              <Images className="h-3 w-3" />
              {node.photo_count}
            </span>
          </div>

          {node.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
              {node.description}
            </p>
          )}

          {(node.start_date || node.location_name) && (
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {formatDateRange(node) && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDateRange(node)}</span>
                </div>
              )}
              {node.location_name && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{node.location_name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Render children recursively */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {node.children.map((child) => (
            <EventTreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onEventClick={onEventClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
