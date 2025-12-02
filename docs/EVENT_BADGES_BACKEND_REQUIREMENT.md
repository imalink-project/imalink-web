# Event Badge på Photo Cards - Backend Krav

## Status: Frontend klar ✅ | Backend mangler ❌

**⚠️ NY ARKITEKTUR: One-to-Many** - Ett foto kan være i MAX ÉN event.

### Hva er implementert (Frontend):

**PhotoCard component** (`components/photo-card.tsx`):
- ✅ Viser event badge under tags (blå outline badge med 📅 ikon)
- ✅ Tooltip med event detaljer på hover:
  - Event navn
  - Beskrivelse (hvis tilgjengelig)
  - Startdato (hvis tilgjengelig)
- ✅ Visuell forskjell fra tags (blå border vs secondary)
- ✅ One-to-many: Kun ÉN event vises (fordi foto kun kan være i én event)

**Type definisjon** (`lib/types.ts`):
```typescript
export interface PhotoWithTags extends Omit<Photo, 'tags'> {
  tags?: TagSummary[];
  event_id?: number | null;  // One-to-many: ett foto = maks én event
  event?: {
    id: number;
    name: string;
    description?: string | null;
    start_date?: string | null;
  } | null;  // Populated event detaljer
}
```

### Hva mangler (Backend):

Backend må legge til `events`-feltet i `PhotoResponse`-skjemaet.

#### Foreslått backend-implementering:

**1. Legg til i `PhotoResponse` schema:**
```python
class PhotoResponse(BaseModel):
    # ... existing fields ...
    events: Optional[List[EventSummary]] = None
```

**2. Definer `EventSummary` schema:**
```python
class EventSummary(BaseModel):
    """Minimal event info for photo responses"""
    id: int
    name: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
```

**3. Populate event når photos hentes (anbefalt):**
```python
# I photo service/repository:
def get_photo_with_relations(photo: Photo) -> PhotoResponse:
    # ... existing logic ...
    
    # One-to-many: Foto har direkte event_id kolonne
    event_data = None
    if photo.event_id:
        event = db.query(Event).filter(Event.id == photo.event_id).first()
        if event:
            event_data = EventSummary.from_orm(event)
    
    return PhotoResponse(
        **photo.__dict__,
        event_id=photo.event_id,
        event=event_data  # Populert event detaljer
    )
```

**Alternativ: Kun event_id (frontend må hente event-info separat)**
```python
return PhotoResponse(
    **photo.__dict__,
    event_id=photo.event_id  # Frontend henter event details selv
)
```

### Testing:

Når backend er oppdatert, vil event badges automatisk vises på photo cards som tilhører events.

**Test-scenario:**
1. Opprett en event: "London Trip 2025"
2. Legg til noen bilder i eventen via Input Channels
3. Se bildene i galleriet - de skal nå vise event badge
4. Hover over badge - skal vise tooltip med event detaljer

### Visuelt design:

```
┌─────────────────────┐
│                     │
│   [Photo Image]     │
│                     │
├─────────────────────┤
│ photo-name.jpg      │
│                     │
│ 🏷️ tag1  🏷️ tag2   │  ← Existing tags (secondary)
│                     │
│ 📅 London Trip      │  ← NEW: Event badge (blue outline)
│                     │     ONE-TO-MANY: Kun én event
│ 📍 51.5074, -0.1278 │
└─────────────────────┘
```

### Arkitektur-fordeler:

**One-to-Many (enklere enn many-to-many):**
- ✅ Ingen junction table (`photo_events` trengs ikke)
- ✅ Direkte kolonne `photos.event_id`
- ✅ Enklere queries (ingen joins)
- ✅ Klarere semantikk (ett foto = én primær event)

**For many-to-many gruppering, bruk Collections eller Tags i stedet.**

### Backend API-endepunkt som må oppdateres:

- `GET /api/v1/photos` - List photos
- `GET /api/v1/photos/{hothash}` - Get single photo
- `POST /api/v1/photos/search` - Search photos
- `GET /api/v1/events/{id}/photos` - Allerede implementert

### Prioritet:

**Middels** - Nice-to-have feature som gir bedre oversikt, men ikke kritisk for funksjonalitet.
Events-funksjonaliteten fungerer uten badges, men UX blir bedre med dem.
