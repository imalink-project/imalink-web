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
  event_id?: number | null; // One-to-many: photo belongs to max ONE event
  event?: {
    id: number;
    name: string;
    description?: string | null;
  } | null; // Populated event details (when backend includes them)
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

// Collection Items (Photo + Text Cards)
export type CollectionItemType = 'photo' | 'text';

export interface CollectionTextCard {
  title: string; // max 200 chars
  body: string;  // max 2000 chars (plain text)
}

export interface CollectionPhotoItem {
  type: 'photo';
  photo_hothash: string;
}

export interface CollectionTextItem {
  type: 'text';
  text_card: CollectionTextCard;
}

export type CollectionItem = CollectionPhotoItem | CollectionTextItem;

// Extended Collection with items (instead of hothashes)
export interface CollectionWithItems {
  id: number;
  name: string;
  description: string | null;
  items: CollectionItem[];          // Mixed content array
  item_count: number;                // Total items
  photo_count: number;               // Just photos
  text_card_count: number;           // Just text cards
  cover_photo_hothash: string | null;
  created_at: string;
  updated_at: string;
}

// Saved Searches
export type SavedSearch = components['schemas']['SavedPhotoSearchResponse'];
export type SavedSearchSummary = components['schemas']['SavedPhotoSearchSummary'];
export type SavedSearchCreate = components['schemas']['SavedPhotoSearchCreate'];
export type SavedSearchUpdate = components['schemas']['SavedPhotoSearchUpdate'];

// Photo Stacks
export type PhotoStack = components['schemas']['PhotoStackDetail'];
export type PhotoStackSummary = components['schemas']['PhotoStackSummary'];

// Authors (Photographers)
export type Author = components['schemas']['AuthorResponse'];
export type AuthorSummary = components['schemas']['AuthorSummary'];
export type AuthorCreate = components['schemas']['AuthorCreateRequest'];
export type AuthorUpdate = components['schemas']['AuthorUpdateRequest'];

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

// PhotoMetadata extends PhotoUpdate with GPS fields and event_id for frontend convenience
export interface PhotoMetadata extends Partial<PhotoUpdate> {
  gps_latitude?: number | null;
  gps_longitude?: number | null;
  event_id?: number | null; // One-to-many: photo belongs to max ONE event
}

// Extended search params with event and collection filtering
export interface ExtendedSearchParams extends SearchParams {
  event_id?: number; // Filter photos by event membership
  collection_id?: number; // Filter photos by collection membership
  include_descendants?: boolean; // Include photos from child events
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

export type TimelineBucket = components['schemas']['TimelineBucket'];
export type TimelineResponse = components['schemas']['TimelineResponse'];
export type TimelineMeta = components['schemas']['TimelineMeta'];
export type DateRange = components['schemas']['DateRange'];

export type TimelineGranularity = 'year' | 'month' | 'day' | 'hour';

export interface TimelineParams {
  granularity?: TimelineGranularity;
  year?: number | null;
  month?: number | null;
  day?: number | null;
}

// ===== Events (Hierarchical Photo Organization) =====

export interface Event {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  parent_event_id: number | null;
  
  // Spatial context
  location_name: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  
  // UI ordering
  sort_order: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EventWithPhotos extends Event {
  photo_count: number;  // Direct photos only (not recursive)
}

export interface EventTreeNode extends Event {
  children: EventTreeNode[];
  photo_count: number;
}

export interface EventTreeResponse {
  events: EventTreeNode[];
  total_events: number;
}

// Request types
export interface EventCreate {
  name: string;
  description?: string | null;
  parent_event_id?: number | null;
  location_name?: string | null;
  gps_latitude?: number | null;
  gps_longitude?: number | null;
  sort_order?: number;
}

export interface EventUpdate {
  name?: string;
  description?: string | null;
  parent_event_id?: number | null;
  location_name?: string | null;
  gps_latitude?: number | null;
  gps_longitude?: number | null;
  sort_order?: number;
}

export interface EventMove {
  new_parent_id: number | null;
}

export interface EventPhotosResponse {
  event_id: number;
  photos_added?: number;
  photos_removed?: number;
  affected_count?: number;
  photo_count?: number;
}

// ===== Utility Types =====

export interface ApiError {
  detail: string;
  status_code: number;
}
