'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CardContainerProps {
  /**
   * Content to display inside the card
   */
  children: ReactNode;
  /**
   * Whether the card should be clickable
   */
  clickable?: boolean;
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show hover effects
   * @default true if clickable
   */
  hover?: boolean;
}

/**
 * Unified card container with consistent styling and behavior
 */
export function CardContainer({
  children,
  clickable = false,
  onClick,
  className,
  hover = clickable,
}: CardContainerProps) {
  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all',
        clickable && 'cursor-pointer',
        hover && 'hover:shadow-lg',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

interface CardHeaderProps {
  /**
   * Main title
   */
  title: string;
  /**
   * Optional description
   */
  description?: string | null;
  /**
   * Additional content (badges, icons, etc)
   */
  extra?: ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Standardized card header section
 */
export function CardHeader({
  title,
  description,
  extra,
  className,
}: CardHeaderProps) {
  return (
    <div className={cn('mb-3 flex items-start justify-between', className)}>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="line-clamp-1 text-lg font-semibold">{title}</h3>
          {extra}
        </div>
        {description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

interface CardMetaItemProps {
  icon: ReactNode;
  label: string | ReactNode;
}

/**
 * Single metadata item with icon and label
 */
export function CardMetaItem({ icon, label }: CardMetaItemProps) {
  return (
    <div className="flex items-center gap-1">
      {icon}
      <span>{label}</span>
    </div>
  );
}

interface CardMetaProps {
  /**
   * Metadata items to display
   */
  children: ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Container for card metadata
 */
export function CardMeta({ children, className }: CardMetaProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 text-xs text-muted-foreground', className)}>
      {children}
    </div>
  );
}
