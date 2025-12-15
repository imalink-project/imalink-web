'use client';

import { InputChannel } from '@/lib/types';
import { Calendar, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CardContainer, CardHeader, CardMeta, CardMetaItem } from '@/components/ui/card-container';
import { formatDateTime } from '@/lib/utils';

interface InputChannelCardProps {
  channel: InputChannel;
}

export function InputChannelCard({ channel }: InputChannelCardProps) {
  const router = useRouter();

  return (
    <CardContainer
      clickable
      onClick={() => router.push(`/input-channels/${channel.id}`)}
    >
      <div className="p-6">
        <CardHeader
          title={channel.title || `Kanal #${channel.id}`}
          description={channel.description}
        />

        <CardMeta className="gap-4 text-sm">
          <CardMetaItem
            icon={<Calendar className="h-4 w-4" />}
            label={formatDateTime(channel.imported_at)}
          />
          <CardMetaItem
            icon={<ImageIcon className="h-4 w-4" />}
            label={`${channel.images_count} bilder`}
          />
        </CardMeta>
      </div>
    </CardContainer>
  );
}
