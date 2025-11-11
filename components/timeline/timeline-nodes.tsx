'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronRight, ChevronDown, Calendar, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { 
  TimelineMonthNode, 
  TimelineDayNode, 
  TimelineHourNode,
  Photo 
} from '@/lib/types';

interface TimelineYearProps {
  year: number;
  count: number;
  firstPhoto: string;
}

export function TimelineYear({ year, count, firstPhoto }: TimelineYearProps) {
  const [expanded, setExpanded] = useState(false);
  const [months, setMonths] = useState<TimelineMonthNode[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleExpand = async () => {
    if (!expanded && months.length === 0) {
      setLoading(true);
      try {
        const data = await apiClient.getTimelineMonths(year);
        setMonths(data.months);
      } catch (error) {
        console.error('Failed to load months:', error);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={toggleExpand}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        )}
        
        <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
          {firstPhoto ? (
            <Image
              src={apiClient.getHotPreviewUrl(firstPhoto)}
              alt={`${year}`}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 text-left">
          <div className="font-semibold text-lg">{year}</div>
          <div className="text-sm text-muted-foreground">
            {count.toLocaleString()} {count === 1 ? 'photo' : 'photos'}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="pl-12 pb-4">
          {loading ? (
            <div className="text-sm text-muted-foreground py-4">Loading months...</div>
          ) : (
            <div className="space-y-1">
              {months.map((month) => (
                <TimelineMonth
                  key={month.month}
                  year={year}
                  month={month.month}
                  count={month.count}
                  firstPhoto={month.first_photo}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TimelineMonthProps {
  year: number;
  month: number;
  count: number;
  firstPhoto: string;
}

function TimelineMonth({ year, month, count, firstPhoto }: TimelineMonthProps) {
  const [expanded, setExpanded] = useState(false);
  const [days, setDays] = useState<TimelineDayNode[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleExpand = async () => {
    if (!expanded && days.length === 0) {
      setLoading(true);
      try {
        const data = await apiClient.getTimelineDays(year, month);
        setDays(data.days);
      } catch (error) {
        console.error('Failed to load days:', error);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="border-l-2 border-muted pl-4">
      <button
        onClick={toggleExpand}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 rounded transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
        
        <div className="relative h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-muted">
          {firstPhoto ? (
            <Image
              src={apiClient.getHotPreviewUrl(firstPhoto)}
              alt={monthNames[month - 1]}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 text-left">
          <div className="font-medium">{monthNames[month - 1]}</div>
          <div className="text-xs text-muted-foreground">
            {count} {count === 1 ? 'photo' : 'photos'}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="pl-8 pt-2 space-y-1">
          {loading ? (
            <div className="text-xs text-muted-foreground py-2">Loading days...</div>
          ) : (
            days.map((day) => (
              <TimelineDay
                key={day.day}
                year={year}
                month={month}
                day={day.day}
                count={day.count}
                firstPhoto={day.first_photo}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface TimelineDayProps {
  year: number;
  month: number;
  day: number;
  count: number;
  firstPhoto: string;
}

function TimelineDay({ year, month, day, count, firstPhoto }: TimelineDayProps) {
  const [expanded, setExpanded] = useState(false);
  const [hours, setHours] = useState<TimelineHourNode[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleExpand = async () => {
    if (!expanded && hours.length === 0) {
      setLoading(true);
      try {
        const data = await apiClient.getTimelineHours(year, month, day);
        setHours(data.hours);
      } catch (error) {
        console.error('Failed to load hours:', error);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  const dateStr = new Date(year, month - 1, day).toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric' 
  });

  return (
    <div className="border-l-2 border-muted pl-4">
      <button
        onClick={toggleExpand}
        className="w-full flex items-center gap-2 p-2 hover:bg-muted/20 rounded transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
        
        <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-muted">
          {firstPhoto ? (
            <Image
              src={apiClient.getHotPreviewUrl(firstPhoto)}
              alt={dateStr}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 text-left">
          <div className="text-sm font-medium">{dateStr}</div>
          <div className="text-xs text-muted-foreground">
            {count} {count === 1 ? 'photo' : 'photos'}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="pl-6 pt-2 space-y-1">
          {loading ? (
            <div className="text-xs text-muted-foreground py-2">Loading hours...</div>
          ) : (
            hours.map((hour) => (
              <TimelineHour
                key={hour.hour}
                year={year}
                month={month}
                day={day}
                hour={hour.hour}
                count={hour.count}
                firstPhoto={hour.first_photo}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface TimelineHourProps {
  year: number;
  month: number;
  day: number;
  hour: number;
  count: number;
  firstPhoto: string;
}

function TimelineHour({ year, month, day, hour, count, firstPhoto }: TimelineHourProps) {
  const [expanded, setExpanded] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleExpand = async () => {
    if (!expanded && photos.length === 0) {
      setLoading(true);
      try {
        const data = await apiClient.getTimelinePhotos(year, month, day, hour);
        setPhotos(data.data);
      } catch (error) {
        console.error('Failed to load photos:', error);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  const timeStr = `${hour.toString().padStart(2, '0')}:00`;

  return (
    <div className="border-l-2 border-muted pl-3">
      <button
        onClick={toggleExpand}
        className="w-full flex items-center gap-2 p-2 hover:bg-muted/10 rounded transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
        )}
        
        <div className="relative h-8 w-8 flex-shrink-0 rounded overflow-hidden bg-muted">
          {firstPhoto ? (
            <Image
              src={apiClient.getHotPreviewUrl(firstPhoto)}
              alt={timeStr}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 text-left">
          <div className="text-sm font-medium">{timeStr}</div>
          <div className="text-xs text-muted-foreground">
            {count} {count === 1 ? 'photo' : 'photos'}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="pl-4 pt-2 pb-2">
          {loading ? (
            <div className="text-xs text-muted-foreground py-2">Loading photos...</div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo) => (
                <div 
                  key={photo.hothash} 
                  className="relative aspect-square rounded overflow-hidden bg-muted hover:ring-2 ring-primary transition-all cursor-pointer"
                >
                  <Image
                    src={apiClient.getHotPreviewUrl(photo.hothash)}
                    alt={`Photo ${photo.hothash}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 120px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
