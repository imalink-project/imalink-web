# Event Filter in Search - Backend Requirement

## Overview
The frontend search filters now include an event selector dropdown, but the backend PhotoSearchRequest schema doesn't support filtering photos by event_id yet.

**Architecture:** One-to-many - photos have `event_id` column (not junction table).

## Current Frontend Implementation

### UI Components
- Event dropdown in SearchFilters component (`components/search-filters.tsx`)
- Shows all available events with photo counts
- User can select one event to filter by
- Frontend includes `event_id?: number` in search params

### Type Definitions
```typescript
// lib/types.ts
export interface ExtendedSearchParams extends SearchParams {
  event_id?: number; // Filter photos by event_id (one-to-many)
}
```

## Required Backend Changes

### 1. Update PhotoSearchRequest Schema
Add event filtering field to the OpenAPI schema:

```yaml
PhotoSearchRequest:
  type: object
  properties:
    # ... existing fields ...
    event_id:
      type: integer
      nullable: true
      description: Filter photos that are associated with this event (includes descendants if recursive)
```

### 2. Database Query Logic
Modify the photo search endpoint to:
1. Accept `event_id` parameter
2. Filter by `photos.event_id` column (no join needed!)

Example SQL (pseudo-code):
```sql
SELECT p.*
FROM photos p
WHERE 
  -- existing filters --
  AND (
    :event_id IS NULL 
    OR p.event_id = :event_id
  )
```

**Much simpler than many-to-many!** No joins, no DISTINCT needed.

### 3. Optional: Include Descendant Events
Consider adding a `include_descendant_events` boolean parameter to also include photos from child events in the hierarchy.

## Testing Scenarios

### Test Case 1: Basic Event Filter
1. Create event "Ferie 2024" (id=10)
2. Set 5 photos with event_id=10
3. Search with event_id=10
4. Verify only those 5 photos are returned

### Test Case 2: Event + Tag Combination
1. Photos in event_id=10 have various tags
2. Search with event_id=10 + tag_ids=[1,5]
3. Verify only photos matching BOTH filters are returned

### Test Case 3: No Event Selected
1. Search without event_id (null/undefined)
2. Verify all photos are returned (no event filtering)

### Test Case 4: Empty Event
1. Create event (id=20) with no photos
2. Search with event_id=20
3. Verify empty results (no photos have event_id=20)

### Test Case 5: Photos Without Events
1. Search with event_id=null explicitly
2. Should return photos where event_id IS NULL
3. Useful for finding "unorganized" photos

## API Example

### Request
```http
POST /api/v1/photos/search
Content-Type: application/json

{
  "event_id": 123,
  "tag_ids": [1, 5],
  "rating_min": 3,
  "offset": 0,
  "limit": 50
}
```

### Response
```json
{
  "photos": [
    {
      "hothash": "abc123...",
      "rating": 4,
      "event_id": 123,
      "event": {"id": 123, "name": "Ferie 2024"},
      "tags": [{"id": 1, "name": "nature"}, {"id": 5, "name": "summer"}]
    }
  ],
  "total": 1
}
```

## Priority
Medium - The UI is implemented but the filter won't work until backend support is added. Similar to event badges, this is a frontend-ready feature waiting for backend implementation.

## Architecture Benefits
**One-to-Many Advantages:**
- Simpler queries (no joins needed)
- Better performance (direct column filter)
- Clearer semantics (one photo = one primary event)
- Easier to implement and maintain

**Use Collections for many-to-many grouping if needed.**

## Related Features
- Event badges on photo cards (requires backend `event_id` + optional `event` in PhotoResponse)
- Event hierarchy navigation (already working)
- Set photos event (already working with hothashes via setPhotosEvent)
