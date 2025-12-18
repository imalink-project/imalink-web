'use client';

import Link from 'next/link';
import { Calendar, Image as ImageIcon } from 'lucide-react';
import type { Collection } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Thumbnail } from '@/components/ui/thumbnail';
import { CardContainer, CardMeta, CardMetaItem } from '@/components/ui/card-container';
import { formatDate } from '@/lib/utils';

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const coverImageUrl = collection.cover_photo_hothash
    ? apiClient.getHotPreviewUrl(collection.cover_photo_hothash)
    : null;

  return (
    <Link href={`/collections/${collection.id}`}>
      <CardContainer clickable hover>
        {/* Cover Image */}
        <Thumbnail
          src={coverImageUrl}
          alt={collection.name}
          aspect="video"
          hoverScale
        />

        {/* Content */}
        <div className="p-4">
          <h3 className="mb-2 text-lg font-semibold line-clamp-1">{collection.name}</h3>
          
          {collection.description && (
            <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
              {collection.description}
            </p>
          )}

          <CardMeta className="justify-between">
            <div className="flex gap-3">
              <CardMetaItem
                icon={<ImageIcon className="h-3 w-3" />}
                label={`${collection.photo_count} ${collection.photo_count === 1 ? 'bilde' : 'bilder'}`}
              />
              {(collection as any).text_card_count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +{(collection as any).text_card_count} tekstkort
                </Badge>
              )}
            </div>
            <CardMetaItem
              icon={<Calendar className="h-3 w-3" />}
              label={formatDate(collection.created_at)}
            />
          </CardMeta>

          {collection.updated_at !== collection.created_at && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Oppdatert {formatDate(collection.updated_at)}
              </Badge>
            </div>
          )}
        </div>
      </CardContainer>
    </Link>
  );
}
