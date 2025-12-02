'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { Event } from '@/lib/types';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventBreadcrumbProps {
  eventId?: number;
  currentEventName?: string;
  className?: string;
}

export function EventBreadcrumb({ eventId, currentEventName, className }: EventBreadcrumbProps) {
  const router = useRouter();
  const [breadcrumbs, setBreadcrumbs] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadBreadcrumbs();
    } else {
      setBreadcrumbs([]);
    }
  }, [eventId]);

  const loadBreadcrumbs = async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      const path: Event[] = [];
      let currentId: number | null = eventId;

      // Walk up the hierarchy to build breadcrumb path
      while (currentId !== null) {
        const event = await apiClient.getEvent(currentId);
        path.unshift(event); // Add to beginning
        currentId = event.parent_event_id;
      }

      setBreadcrumbs(path);
    } catch (err) {
      console.error('Failed to load breadcrumbs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      {/* Home / Events root */}
      <Link
        href="/events"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>Events</span>
      </Link>

      {/* Loading state */}
      {loading && (
        <>
          <ChevronRight className="h-4 w-4" />
          <div className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
        </>
      )}

      {/* Breadcrumb path */}
      {!loading && breadcrumbs.map((event, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={event.id} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            {isLast ? (
              <span className="font-medium text-foreground">
                {currentEventName || event.name}
              </span>
            ) : (
              <Link
                href={`/events/${event.id}`}
                className="hover:text-foreground transition-colors"
              >
                {event.name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
