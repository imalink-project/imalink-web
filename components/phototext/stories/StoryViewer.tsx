'use client';

import { PhotoTextDocument } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { useState, useEffect } from 'react';

interface StoryViewerProps {
  story: PhotoTextDocument;
}

interface PhotoTextBlock {
  type: 'heading' | 'paragraph' | 'image' | 'images' | 'list';
  level?: number;
  content?: Array<{ type: 'text' | 'bold' | 'italic' | 'link'; text: string; url?: string }>;
  images?: Array<{ imageId: string; caption?: string; alt?: string }>;
  imageId?: string;
  caption?: string;
  alt?: string;
  items?: string[];
  ordered?: boolean;
}

interface PhotoTextContent {
  documentType: 'general';
  title?: string;
  abstract?: string;
  blocks: PhotoTextBlock[];
}

export function StoryViewer({ story }: StoryViewerProps) {
  const [content, setContent] = useState<PhotoTextContent | null>(null);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Parse JSONB content
    if (story.content && typeof story.content === 'object') {
      setContent(story.content as unknown as PhotoTextContent);
    }
  }, [story.content]);

  useEffect(() => {
    // Load all coldpreview images with authentication
    const loadImages = async () => {
      if (!content) return;

      const urls = new Map<string, string>();
      
      // Load cover image
      if (story.cover_image_hash) {
        try {
          const url = await apiClient.fetchColdPreview(story.cover_image_hash);
          urls.set(story.cover_image_hash, url);
        } catch (error) {
          console.error('Failed to load cover image:', error);
        }
      }

      // Load all image blocks
      for (const block of content.blocks) {
        if (block.type === 'image' && block.imageId) {
          try {
            const url = await apiClient.fetchColdPreview(block.imageId);
            urls.set(block.imageId, url);
          } catch (error) {
            console.error('Failed to load image:', block.imageId, error);
          }
        }
        if (block.type === 'images' && block.images) {
          for (const img of block.images) {
            try {
              const url = await apiClient.fetchColdPreview(img.imageId);
              urls.set(img.imageId, url);
            } catch (error) {
              console.error('Failed to load gallery image:', img.imageId, error);
            }
          }
        }
      }

      setImageUrls(urls);
    };

    loadImages();
  }, [content, story.cover_image_hash]);

  if (!content || !content.blocks) {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-muted-foreground italic">Ingen innhold tilgjengelig</p>
      </div>
    );
  }

  return (
    <article className="space-y-8">
      {/* Title */}
      {content.title && (
        <h1 className="font-sans text-5xl font-bold tracking-tight">
          {content.title}
        </h1>
      )}
      
      {/* Cover Image - wide, not too tall */}
      {story.cover_image_hash && imageUrls.get(story.cover_image_hash) && (
        <div className="w-full aspect-[21/9] relative overflow-hidden rounded-lg bg-muted -mx-4 sm:mx-0">
          <img
            src={imageUrls.get(story.cover_image_hash)}
            alt={story.cover_image_alt || content.title || ''}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Abstract */}
      {content.abstract && (
        <p className="text-lg italic text-muted-foreground leading-relaxed border-l-4 border-primary/30 pl-4 py-2">
          {content.abstract}
        </p>
      )}
      
      {/* Blocks */}
      <div className="space-y-6">
        {content.blocks.map((block, index) => (
          <Block key={index} block={block} imageUrls={imageUrls} />
        ))}
      </div>
    </article>
  );
}

function Block({ block, imageUrls }: { block: PhotoTextBlock; imageUrls: Map<string, string> }) {
  switch (block.type) {
    case 'heading':
      return <Heading level={block.level || 1} content={block.content} />;
    
    case 'paragraph':
      return <Paragraph content={block.content} />;
    
    case 'image':
      return <SingleImage imageId={block.imageId!} caption={block.caption} alt={block.alt} imageUrls={imageUrls} />;
    
    case 'images':
      return <ImageGallery images={block.images || []} caption={block.caption} imageUrls={imageUrls} />;
    
    case 'list':
      return <List items={block.items || []} ordered={block.ordered} />;
    
    default:
      return null;
  }
}

function Heading({ level, content }: { level: number; content?: Array<any> }) {
  const text = content?.map(c => c.text).join('') || '';
  const baseClass = "font-sans font-bold tracking-tight";
  
  switch (level) {
    case 1: return <h1 className={`${baseClass} text-4xl mt-12 mb-4`}>{text}</h1>;
    case 2: return <h2 className={`${baseClass} text-3xl mt-10 mb-3`}>{text}</h2>;
    case 3: return <h3 className={`${baseClass} text-2xl mt-8 mb-3`}>{text}</h3>;
    case 4: return <h4 className={`${baseClass} text-xl mt-6 mb-2`}>{text}</h4>;
    case 5: return <h5 className={`${baseClass} text-lg mt-4 mb-2`}>{text}</h5>;
    default: return <h6 className={`${baseClass} text-base mt-4 mb-2`}>{text}</h6>;
  }
}

function Paragraph({ content }: { content?: Array<any> }) {
  if (!content) return null;

  return (
    <p className="text-base leading-relaxed text-foreground my-4">
      {content.map((item, i) => {
        if (item.type === 'bold') {
          return <strong key={i}>{item.text}</strong>;
        }
        if (item.type === 'italic') {
          return <em key={i}>{item.text}</em>;
        }
        if (item.type === 'link') {
          return (
            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
              {item.text}
            </a>
          );
        }
        return <span key={i}>{item.text}</span>;
      })}
    </p>
  );
}

function SingleImage({ imageId, caption, alt, imageUrls }: { imageId: string; caption?: string; alt?: string; imageUrls: Map<string, string> }) {
  const imageUrl = imageUrls.get(imageId);
  
  if (!imageUrl) {
    return (
      <figure className="my-8 border rounded-lg p-4 bg-muted/20">
        <div className="w-full aspect-video bg-muted flex items-center justify-center rounded">
          <p className="text-muted-foreground text-sm">Loading image...</p>
        </div>
      </figure>
    );
  }
  
  return (
    <figure className="my-8 border rounded-lg p-4 bg-muted/20">
      <img 
        src={imageUrl} 
        alt={alt || caption || ''} 
        className="w-full rounded"
      />
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function ImageGallery({ images, caption, imageUrls }: { images: Array<any>; caption?: string; imageUrls: Map<string, string> }) {
  const gridClass = images.length === 2 
    ? 'grid-cols-2' 
    : images.length === 3 
    ? 'grid-cols-3' 
    : 'grid-cols-2 lg:grid-cols-3';

  return (
    <figure className="my-8 border rounded-lg p-4 bg-muted/20">
      <div className={`grid ${gridClass} gap-4`}>
        {images.map((img, i) => {
          const imageUrl = imageUrls.get(img.imageId);
          return (
            <div key={i} className="relative aspect-square overflow-hidden rounded">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={img.alt || img.caption || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground text-xs">Loading...</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function List({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul';
  
  return (
    <Tag className={ordered ? 'list-decimal list-inside space-y-2 my-4' : 'list-disc list-inside space-y-2 my-4'}>
      {items.map((item, i) => (
        <li key={i} className="text-base leading-relaxed">{item}</li>
      ))}
    </Tag>
  );
}
