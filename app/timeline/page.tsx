'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimelineYear } from '@/components/timeline/timeline-nodes';
import { apiClient } from '@/lib/api-client';
import type { TimelineYearNode } from '@/lib/types';

export default function TimelinePage() {
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<TimelineYearNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadYears() {
      try {
        setLoading(true);
        const currentYear = new Date().getFullYear();
        const data = await apiClient.getTimelineYears({
          from_year: 1990,
          to_year: currentYear,
        });
        setYears(data.years);
      } catch (err) {
        console.error('Failed to load timeline years:', err);
        setError('Failed to load timeline. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadYears();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Timeline</h1>
        <p className="text-muted-foreground">
          Browse your photos organized by year, month, day, and hour
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Photo Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading timeline...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">{error}</p>
            </div>
          ) : years.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No photos found in timeline.</p>
            </div>
          ) : (
            <div className="divide-y">
              {years.map((year) => (
                <TimelineYear
                  key={year.year}
                  year={year.year}
                  count={year.count}
                  firstPhoto={year.first_photo}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
