// API Types for ImaLink Backend
// Generated types are imported from api-types.generated.ts

import type { components, operations } from './api-types.generated';

// ===== Core Backend Types (from OpenAPI schema) =====

// Authentication
export type User = components['schemas']['UserResponse'];
export type AuthTokens = components['schemas']['UserToken'];
export type LoginCredentials = components['schemas']['UserLogin'];
export type RegisterData = components['schemas']['UserCreate'];

// Photos
export type Photo = components['schemas']['PhotoResponse'];
export type PhotoUpdate = components['schemas']['PhotoUpdateRequest'];
export type PhotoSearch = components['schemas']['PhotoSearchRequest'];
export type ImageFile = components['schemas']['ImageFileSummary'];

// Properly typed Photo with correct tag structure
export interface PhotoWithTags extends Omit<Photo, 'tags'> {
  tags?: TagSummary[];
  files?: ImageFile[];
  image_files?: ImageFile[]; // Alias for compatibility
}

// Tags
export type Tag = components['schemas']['TagResponse'];
export type TagSummary = components['schemas']['TagSummary'];

// Tag autocomplete extends TagSummary with photo_count
export interface TagAutocomplete extends TagSummary {
  photo_count?: number;
}

// Collections
export type Collection = components['schemas']['PhotoCollectionResponse'];
export type CollectionCreate = components['schemas']['PhotoCollectionCreate'];
export type CollectionUpdate = components['schemas']['PhotoCollectionUpdate'];

// Saved Searches
export type SavedSearch = components['schemas']['SavedPhotoSearchResponse'];
export type SavedSearchSummary = components['schemas']['SavedPhotoSearchSummary'];
export type SavedSearchCreate = components['schemas']['SavedPhotoSearchCreate'];
export type SavedSearchUpdate = components['schemas']['SavedPhotoSearchUpdate'];

// Photo Stacks
export type PhotoStack = components['schemas']['PhotoStackDetail'];
export type PhotoStackSummary = components['schemas']['PhotoStackSummary'];

// Authors
export type Author = components['schemas']['AuthorResponse'];
export type AuthorSummary = components['schemas']['AuthorSummary'];

// Import Sessions -> Input Channels
export type InputChannel = components['schemas']['InputChannelResponse'];
export type InputChannelCreate = components['schemas']['InputChannelCreateRequest'];
export type InputChannelUpdate = components['schemas']['InputChannelUpdateRequest'];

// PhotoText Documents
export type PhotoTextDocument = components['schemas']['PhotoTextDocumentResponse'];
export type PhotoTextDocumentSummary = components['schemas']['PhotoTextDocumentSummary'];
export type PhotoTextDocumentCreate = components['schemas']['PhotoTextDocumentCreate'];
export type PhotoTextDocumentUpdate = components['schemas']['PhotoTextDocumentUpdate'];
export type CoverImage = components['schemas']['CoverImage'];

// Pagination
export type PaginatedResponse<T> = components['schemas']['PaginatedResponse_PhotoResponse_'] extends {
  data: infer D;
  meta: infer M;
}
  ? { data: T[]; meta: M }
  : never;

export type PaginationMeta = components['schemas']['PaginationMeta'];

// ===== Aliases for compatibility =====

export type SearchParams = Partial<PhotoSearch>;

// PhotoMetadata extends PhotoUpdate with GPS fields for frontend convenience
export interface PhotoMetadata extends Partial<PhotoUpdate> {
  gps_latitude?: number | null;
  gps_longitude?: number | null;
}

// ===== Frontend-specific Extensions =====

// Add UI state to backend types
export interface PhotoWithUI extends PhotoWithTags {
  isSelected?: boolean;
  isLoading?: boolean;
  isHovered?: boolean;
}

export interface CollectionWithUI extends Collection {
  isExpanded?: boolean;
  isLoading?: boolean;
}

export interface SavedSearchWithUI extends SavedSearch {
  isExecuting?: boolean;
  hasNewResults?: boolean;
}

// ===== Visibility System (Phase 1) =====

export type VisibilityLevel = 'private' | 'space' | 'authenticated' | 'public';

export const VISIBILITY_LEVELS: { value: VisibilityLevel; label: string; description: string; icon: string }[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see this',
    icon: 'lock'
  },
  {
    value: 'space',
    label: 'Space',
    description: 'Shared with space members (Coming in Phase 2)',
    icon: 'users'
  },
  {
    value: 'authenticated',
    label: 'Authenticated',
    description: 'Any logged-in user can see this',
    icon: 'user-check'
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can see this (including anonymous visitors)',
    icon: 'globe'
  }
];

// ===== Timeline Types =====

export interface TimelineYearNode {
  year: number;
  count: number;
  first_photo: string; // hothash
}

export interface TimelineMonthNode {
  month: number; // 1-12
  count: number;
  first_photo: string;
}

export interface TimelineDayNode {
  day: number; // 1-31
  count: number;
  first_photo: string;
}

export interface TimelineHourNode {
  hour: number; // 0-23
  count: number;
  first_photo: string;
}

export interface TimelineYearsResponse {
  years: TimelineYearNode[];
}

export interface TimelineMonthsResponse {
  months: TimelineMonthNode[];
}

export interface TimelineDaysResponse {
  days: TimelineDayNode[];
}

export interface TimelineHoursResponse {
  hours: TimelineHourNode[];
}

// ===== Utility Types =====

export interface ApiError {
  detail: string;
  status_code: number;
}
