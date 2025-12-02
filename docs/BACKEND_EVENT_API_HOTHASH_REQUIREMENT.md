# Backend API Requirements for Event Integration

## Issue: Events API Photo Identifier Inconsistency

### Problem

The **Events API** currently requires `photo_ids` (integer array) to add/remove photos:

```typescript
POST /api/v1/events/{event_id}/photos
{
  "photo_ids": [1, 2, 3]  // Integer IDs
}
```

However, the **Collections API** uses `hothashes` (string array):

```typescript
POST /api/v1/collections/{collection_id}/photos
{
  "hothashes": ["abc123...", "def456..."]  // Hothashes
}
```

### Why This is Problematic

1. **PhotoResponse doesn't expose photo.id**: The TypeScript type generated from OpenAPI spec does not include an `id` field
2. **Hothash is the primary identifier**: Frontend uses `hothash` everywhere as the photo identifier
3. **Inconsistent API design**: Collections use hothashes, Events use IDs
4. **Unnecessary complexity**: Frontend must maintain ID↔hothash mapping or make extra API calls

### Recommended Solution

**Update Events API to accept hothashes** (matching Collections API):

#### Add Photos to Event
```typescript
POST /api/v1/events/{event_id}/photos
{
  "hothashes": ["abc123...", "def456..."]  // Change from photo_ids to hothashes
}
```

#### Remove Photos from Event
```typescript
DELETE /api/v1/events/{event_id}/photos
{
  "hothashes": ["abc123...", "def456..."]  // Change from photo_ids to hothashes
}
```

### Backend Implementation

The backend should:

1. Accept `hothashes` array in request body
2. Look up photos by hothash (already indexed)
3. Extract photo IDs internally
4. Perform the event association

```python
# Example backend change (pseudo-code)
@router.post("/events/{event_id}/photos")
def add_photos_to_event(
    event_id: int,
    request: AddPhotosRequest,  # Contains hothashes: list[str]
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Look up photos by hothashes
    photos = db.query(Photo).filter(
        Photo.hothash.in_(request.hothashes),
        Photo.user_id == current_user.id
    ).all()
    
    # Extract IDs and create associations
    photo_ids = [p.id for p in photos]
    # ... rest of implementation
```

### Alternative (Less Preferred)

If backend cannot be updated immediately, add `id` field to `PhotoResponse`:

```python
class PhotoResponse(BaseModel):
    id: int  # Add this field
    hothash: str
    # ... rest of fields
```

This would allow frontend to maintain the ID↔hothash mapping, but is less elegant than supporting hothashes directly.

### Impact

**Backend changes required:**
- Update Events API endpoints to accept `hothashes` instead of `photo_ids`
- Update OpenAPI spec
- Update tests

**Frontend benefits:**
- Consistent API usage (same pattern as Collections)
- No need for ID↔hothash mapping
- Simpler, more maintainable code

### Priority

**High** - This blocks full Event integration in frontend. Current workaround throws errors.

---

## Current Frontend Workaround

Frontend currently throws an error when trying to use Events API:

```typescript
throw new Error(
  'Backend API limitation: Cannot convert hothashes to photo IDs. ' +
  'Backend Events API should accept hothashes directly.'
);
```

This forces developers to address the issue rather than implementing hacky workarounds.

---

## Related Files

- Backend: `/src/api/v1/events.py`
- Backend: `/src/schemas/event_schemas.py`
- Frontend: `/lib/api-client.ts` (methods: `addPhotosToEventByHothash`, `removePhotosFromEventByHothash`)
- Frontend: `/components/add-to-event-dialog.tsx`

---

**Date:** December 2, 2025  
**Author:** Frontend Team  
**Status:** Blocked - Awaiting backend update
