# Timeline Aggregation API Specification

## Overview

Timeline aggregation enables hierarchical browsing of photos organized by time: Year → Month → Day → Hour. Each level shows photo counts and a representative preview image (first photo chronologically).

## Design Principles

1. **Lazy Loading**: Only aggregate data for the level being requested
2. **Minimal Data Transfer**: Return only counts + first photo hash per period
3. **User-Scoped**: Respect visibility rules (own photos + authenticated + public)
4. **Performance**: Single SQL query per level with GROUP BY aggregation
5. **Chronological Order**: Always sort by time ascending (oldest first)

## Endpoints

### 1. Get Timeline Years

**Endpoint**: `GET /api/v1/photos/timeline/years/`

**Authentication**: Optional
- No auth: Returns years with `public` photos only
- With auth: Returns years with user's photos + `authenticated` + `public`

**Query Parameters**:
- `from_year` (integer, optional): Start year (default: 1990)
- `to_year` (integer, optional): End year (default: current year)

**Response** (`200 OK`):
```json
{
  "years": [
    {
      "year": 2024,
      "count": 1234,
      "first_photo": "abc123def456..."
    },
    {
      "year": 2023,
      "count": 2567,
      "first_photo": "def456ghi789..."
    }
  ]
}
```

**SQL Logic**:
```sql
SELECT 
  strftime('%Y', taken_at) as year,
  COUNT(*) as count,
  (
    SELECT hothash FROM photos p2 
    WHERE strftime('%Y', p2.taken_at) = year
      AND <visibility_filter>
    ORDER BY p2.taken_at ASC 
    LIMIT 1
  ) as first_photo
FROM photos
WHERE taken_at IS NOT NULL
  AND <visibility_filter>
  AND strftime('%Y', taken_at) BETWEEN :from_year AND :to_year
GROUP BY year
ORDER BY year ASC
```

**Notes**:
- Only returns years with `count > 0`
- `first_photo` is the earliest photo in that year (ORDER BY taken_at ASC)
- Years without photos are omitted

---

### 2. Get Timeline Months for Year

**Endpoint**: `GET /api/v1/photos/timeline/year/{year}/months/`

**Authentication**: Optional (same visibility rules)

**Path Parameters**:
- `year` (integer, required): Year to get months for (e.g., 2024)

**Response** (`200 OK`):
```json
{
  "year": 2024,
  "months": [
    {
      "month": 11,
      "count": 89,
      "first_photo": "abc123..."
    },
    {
      "month": 10,
      "count": 123,
      "first_photo": "def456..."
    }
  ]
}
```

**SQL Logic**:
```sql
SELECT 
  CAST(strftime('%m', taken_at) AS INTEGER) as month,
  COUNT(*) as count,
  (
    SELECT hothash FROM photos p2 
    WHERE strftime('%Y', p2.taken_at) = :year
      AND strftime('%m', p2.taken_at) = printf('%02d', month)
      AND <visibility_filter>
    ORDER BY p2.taken_at ASC 
    LIMIT 1
  ) as first_photo
FROM photos
WHERE taken_at IS NOT NULL
  AND strftime('%Y', taken_at) = :year
  AND <visibility_filter>
GROUP BY month
ORDER BY month ASC
```

**Notes**:
- `month` is 1-12 (January = 1, December = 12)
- Only months with photos are returned
- Months sorted chronologically (1 → 12)

---

### 3. Get Timeline Days for Month

**Endpoint**: `GET /api/v1/photos/timeline/year/{year}/month/{month}/days/`

**Authentication**: Optional (same visibility rules)

**Path Parameters**:
- `year` (integer, required): Year (e.g., 2024)
- `month` (integer, required): Month 1-12

**Response** (`200 OK`):
```json
{
  "year": 2024,
  "month": 11,
  "days": [
    {
      "day": 9,
      "count": 12,
      "first_photo": "abc123..."
    },
    {
      "day": 10,
      "count": 8,
      "first_photo": "def456..."
    }
  ]
}
```

**SQL Logic**:
```sql
SELECT 
  CAST(strftime('%d', taken_at) AS INTEGER) as day,
  COUNT(*) as count,
  (
    SELECT hothash FROM photos p2 
    WHERE strftime('%Y', p2.taken_at) = :year
      AND strftime('%m', p2.taken_at) = printf('%02d', :month)
      AND strftime('%d', p2.taken_at) = printf('%02d', day)
      AND <visibility_filter>
    ORDER BY p2.taken_at ASC 
    LIMIT 1
  ) as first_photo
FROM photos
WHERE taken_at IS NOT NULL
  AND strftime('%Y', taken_at) = :year
  AND strftime('%m', taken_at) = printf('%02d', :month)
  AND <visibility_filter>
GROUP BY day
ORDER BY day ASC
```

**Notes**:
- `day` is 1-31 depending on month
- Only days with photos are returned

---

### 4. Get Timeline Hours for Day

**Endpoint**: `GET /api/v1/photos/timeline/year/{year}/month/{month}/day/{day}/hours/`

**Authentication**: Optional (same visibility rules)

**Path Parameters**:
- `year` (integer, required)
- `month` (integer, required): 1-12
- `day` (integer, required): 1-31

**Response** (`200 OK`):
```json
{
  "year": 2024,
  "month": 11,
  "day": 9,
  "hours": [
    {
      "hour": 14,
      "count": 3,
      "first_photo": "abc123..."
    },
    {
      "hour": 15,
      "count": 5,
      "first_photo": "def456..."
    }
  ]
}
```

**SQL Logic**:
```sql
SELECT 
  CAST(strftime('%H', taken_at) AS INTEGER) as hour,
  COUNT(*) as count,
  (
    SELECT hothash FROM photos p2 
    WHERE strftime('%Y', p2.taken_at) = :year
      AND strftime('%m', p2.taken_at) = printf('%02d', :month)
      AND strftime('%d', p2.taken_at) = printf('%02d', :day)
      AND strftime('%H', p2.taken_at) = printf('%02d', hour)
      AND <visibility_filter>
    ORDER BY p2.taken_at ASC 
    LIMIT 1
  ) as first_photo
FROM photos
WHERE taken_at IS NOT NULL
  AND strftime('%Y', taken_at) = :year
  AND strftime('%m', taken_at) = printf('%02d', :month)
  AND strftime('%d', taken_at) = printf('%02d', :day)
  AND <visibility_filter>
GROUP BY hour
ORDER BY hour ASC
```

**Notes**:
- `hour` is 0-23 (00:00 - 23:00)
- Represents the hour bucket (14 = 14:00-14:59)

---

### 5. Get Photos for Hour

**Endpoint**: `GET /api/v1/photos/timeline/year/{year}/month/{month}/day/{day}/hour/{hour}/photos/`

**Authentication**: Optional (same visibility rules)

**Path Parameters**:
- `year` (integer, required)
- `month` (integer, required): 1-12
- `day` (integer, required): 1-31
- `hour` (integer, required): 0-23

**Query Parameters**:
- `offset` (integer, optional): Pagination offset (default: 0)
- `limit` (integer, optional): Max results (default: 100, max: 500)

**Response** (`200 OK`):
```json
{
  "data": [
    {
      "hothash": "abc123...",
      "width": 4000,
      "height": 3000,
      "taken_at": "2024-11-09T14:30:15Z",
      "rating": 4,
      "visibility": "private",
      ...
    }
  ],
  "meta": {
    "total": 3,
    "offset": 0,
    "limit": 100
  }
}
```

**SQL Logic**:
```sql
SELECT * FROM photos
WHERE taken_at IS NOT NULL
  AND strftime('%Y', taken_at) = :year
  AND strftime('%m', taken_at) = printf('%02d', :month)
  AND strftime('%d', taken_at) = printf('%02d', :day)
  AND strftime('%H', taken_at) = printf('%02d', :hour)
  AND <visibility_filter>
ORDER BY taken_at ASC
LIMIT :limit OFFSET :offset
```

**Notes**:
- Returns full Photo objects (same as `GET /photos`)
- Hour represents photos taken between `HH:00:00` and `HH:59:59`

---

## Visibility Filter Logic

The `<visibility_filter>` placeholder should be replaced with:

**Anonymous (no auth)**:
```sql
visibility = 'public'
```

**Authenticated**:
```sql
(user_id = :current_user_id OR visibility IN ('authenticated', 'public'))
```

## Error Responses

**400 Bad Request** - Invalid parameters:
```json
{
  "detail": "Invalid year: must be between 1900 and 2100"
}
```

**401 Unauthorized** - Auth required for non-public content:
```json
{
  "detail": "Authentication required"
}
```

**404 Not Found** - No photos found:
```json
{
  "detail": "No photos found for specified period"
}
```

## Performance Considerations

### Indexes Required

```sql
CREATE INDEX idx_photos_taken_at ON photos(taken_at);
CREATE INDEX idx_photos_visibility ON photos(visibility);
CREATE INDEX idx_photos_user_visibility ON photos(user_id, visibility);
CREATE INDEX idx_photos_taken_year ON photos((strftime('%Y', taken_at)));
```

### Query Optimization

1. **Avoid NULL dates**: `WHERE taken_at IS NOT NULL` filter first
2. **Use indexes**: Ensure `taken_at` and `visibility` are indexed
3. **Limit subquery**: Subquery for `first_photo` uses `LIMIT 1` with `ORDER BY`
4. **Cache results**: Frontend should cache aggregation results for 5-10 minutes

### Expected Performance

With proper indexes:
- Years aggregation: < 50ms for 10,000 photos
- Months aggregation: < 20ms per year
- Days aggregation: < 15ms per month
- Hours aggregation: < 10ms per day
- Photos list: < 5ms per hour (with typical hour having < 100 photos)

## Frontend Integration

Frontend should:
1. **Cache aggregations**: Store year/month/day aggregations to avoid re-fetching
2. **Lazy load**: Only fetch months when year is expanded
3. **Prefetch**: Consider prefetching adjacent periods (previous/next year)
4. **Loading states**: Show skeleton loaders during fetch
5. **Error handling**: Gracefully handle empty periods (no photos)

## Implementation Checklist

Backend (FastAPI):
- [ ] Create `/api/v1/photos/timeline/years/` endpoint
- [ ] Create `/api/v1/photos/timeline/year/{year}/months/` endpoint
- [ ] Create `/api/v1/photos/timeline/year/{year}/month/{month}/days/` endpoint
- [ ] Create `/api/v1/photos/timeline/year/{year}/month/{month}/day/{day}/hours/` endpoint
- [ ] Create `/api/v1/photos/timeline/.../photos/` endpoint
- [ ] Add visibility filter logic
- [ ] Add database indexes
- [ ] Add input validation (year 1900-2100, month 1-12, etc.)
- [ ] Add unit tests
- [ ] Update OpenAPI schema

Frontend (Next.js):
- [x] Create Timeline types
- [x] Add API client methods
- [x] Create Timeline components
- [x] Implement lazy loading
- [ ] Add caching strategy
- [ ] Add error handling
- [ ] Add loading states

## Example Usage

### JavaScript/TypeScript
```typescript
// Frontend already implemented:
const data = await apiClient.getTimelineYears({ from_year: 1990, to_year: 2025 });
// data.years = [{ year: 2024, count: 1234, first_photo: "abc..." }, ...]

const months = await apiClient.getTimelineMonths(2024);
// months.months = [{ month: 11, count: 89, first_photo: "def..." }, ...]

const days = await apiClient.getTimelineDays(2024, 11);
const hours = await apiClient.getTimelineHours(2024, 11, 9);
const photos = await apiClient.getTimelinePhotos(2024, 11, 9, 14);
```

### Python (Backend Implementation Example)
```python
@router.get("/timeline/years/")
async def get_timeline_years(
    from_year: int = 1990,
    to_year: int = Query(default_factory=lambda: datetime.now().year),
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    # Build visibility filter
    if current_user:
        visibility_filter = or_(
            Photo.user_id == current_user.id,
            Photo.visibility.in_(['authenticated', 'public'])
        )
    else:
        visibility_filter = Photo.visibility == 'public'
    
    # Aggregate by year
    years = db.query(
        func.strftime('%Y', Photo.taken_at).label('year'),
        func.count().label('count')
    ).filter(
        Photo.taken_at.isnot(None),
        visibility_filter,
        func.strftime('%Y', Photo.taken_at).between(str(from_year), str(to_year))
    ).group_by('year').order_by('year').all()
    
    # Get first photo for each year
    result = []
    for year, count in years:
        first_photo = db.query(Photo.hothash).filter(
            func.strftime('%Y', Photo.taken_at) == year,
            visibility_filter
        ).order_by(Photo.taken_at.asc()).first()
        
        result.append({
            "year": int(year),
            "count": count,
            "first_photo": first_photo[0] if first_photo else None
        })
    
    return {"years": result}
```

## Notes

- **Timezone Handling**: All dates in UTC. Frontend can convert to local timezone for display.
- **Missing `taken_at`**: Photos without `taken_at` are excluded from timeline.
- **Future Dates**: Support photos with future `taken_at` (e.g., scheduled posts).
- **Large Datasets**: Consider pagination for years list if user has photos spanning 50+ years.

## Version

- **API Version**: 2.3 (Timeline Aggregation)
- **Status**: Specification - Ready for Implementation
- **Created**: November 10, 2025
- **Author**: ImaLink Team
