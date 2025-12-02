# Events Implementation - One-to-Many Architecture

## Oversikt

Events-funksjonen er **fullstendig implementert** i frontend med **one-to-many** arkitektur.

**Nøkkelkonsept:** Ett foto kan være i maksimalt ÉN event (ikke many-to-many).

## Arkitektur

### One-to-Many vs Many-to-Many

**Events (One-to-Many):**
- Ett foto kan være i **ÉN event**
- Hierarkisk organisering (parent-child relasjoner)
- Database: `photos.event_id` kolonne (direkte foreign key)
- Bruksområde: Primær organisering (reiser, anledninger, prosjekter)

**Collections (Many-to-Many):**
- Ett foto kan være i **FLERE collections**
- Flat struktur (ingen hierarki)
- Database: Junction table `collection_photos`
- Bruksområde: Fleksibel gruppering, album, porteføljer

**Tags (Many-to-Many):**
- Ett foto kan ha **FLERE tags**
- Flat struktur
- Database: Junction table `photo_tags`
- Bruksområde: Kategorisering, metadata

## Implementerte Features

### ✅ 1. Events List Page (`app/events/page.tsx`)
- **List View:** Flat liste av alle events med metadata
- **Tree View:** Hierarkisk visning med collapsible nodes
- Drill-down navigation (klikk for å se child events)
- Breadcrumb navigation tilbake til parents
- Photo count per event
- Create new event dialog

### ✅ 2. Event Detail Page (`app/events/[id]/page.tsx`)
- Event metadata (navn, beskrivelse, datoer, lokasjon)
- Breadcrumb navigation (viser hele stien fra rot)
- Child events visning (under-events)
- Photo grid (photos direkte i denne eventen)
- Toggle for å inkludere photos fra child events
- Actions: Edit, Move, Delete
- Create child event

### ✅ 3. EventTreeView Component (`components/event-tree-view.tsx`)
- Recursive rendering av event-hierarki
- Collapsible nodes (auto-expand første 2 nivåer)
- Photo count per event
- Date range formatting
- Click handler for navigation

### ✅ 4. EventBreadcrumb Component (`components/event-breadcrumb.tsx`)
- Walks up parent_event_id chain
- Builds breadcrumb path array
- Clickable navigation to any parent
- Displays current event name

### ✅ 5. Add To Event Dialog (`components/add-to-event-dialog.tsx`)
- Visual event selector (alle events vises)
- Search/filter events
- **One-to-many:** Setter event_id (erstatter eksisterende)
- Warning at eksisterende event erstattes
- Photo count per event
- Create new event option

### ✅ 6. Move Event Dialog (`components/move-event-dialog.tsx`)
- Move event to new parent
- Move to root (no parent)
- Search/filter target events
- Prevents circular references (filtrerer ut current event)
- Shows current parent

### ✅ 7. Input Channels Integration (`app/input-channels/[id]/page.tsx`)
- Bulk select photos
- "Legg til i Event" button
- Uses AddToEventDialog
- Batch operation med hothashes

### ✅ 8. Photo Card Event Badge (`components/photo-card.tsx`)
- Single event badge (one-to-many)
- Tooltip med event detaljer
- Blue outline badge med 📅 ikon
- **Venter på backend:** `event_id` + `event` i PhotoResponse

### ✅ 9. Search Filters Event Dropdown (`components/search-filters.tsx`)
- Event dropdown i advanced filters
- Filter photos by event_id
- **Venter på backend:** `event_id` i PhotoSearchRequest

### ✅ 10. Sidebar Navigation
- Events link i sidebar (`components/app-layout.tsx`)
- CalendarDays icon
- Plassert mellom Collections og Saved Searches

## API Client Metoder (`lib/api-client.ts`)

```typescript
// Event CRUD
getEvents(parentId?: number): Promise<EventWithPhotos[]>
getEventTree(): Promise<EventTreeResponse>
getEvent(id: number): Promise<Event>
createEvent(data: EventCreate): Promise<Event>
updateEvent(id: number, data: EventUpdate): Promise<Event>
deleteEvent(id: number): Promise<void>
moveEvent(id: number, newParentId: number | null): Promise<Event>

// Photo-Event Operations (One-to-Many)
setPhotosEvent(eventId: number, hothashes: string[]): Promise<EventPhotosResponse>
removePhotosFromEvent(hothashes: string[]): Promise<EventPhotosResponse>
getEventPhotos(eventId: number, includeDescendants: boolean): Promise<Photo[]>
```

## Type Definitions (`lib/types.ts`)

```typescript
// Event with photo count
interface EventWithPhotos extends Event {
  photo_count: number;  // Direct photos only
}

// Tree node for hierarchical display
interface EventTreeNode extends Event {
  children: EventTreeNode[];
  photo_count: number;
}

// Photo with event (one-to-many)
interface PhotoWithTags extends Omit<Photo, 'tags'> {
  tags?: TagSummary[];
  event_id?: number | null;  // ONE event
  event?: {
    id: number;
    name: string;
    description?: string | null;
    start_date?: string | null;
  } | null;
}
```

## Backend Requirements

### 🔴 Mangler (Frontend er klar)

#### 1. Event Badges på Photos
**Status:** Frontend implementert, venter på backend

Backend må legge til i `PhotoResponse`:
```python
class PhotoResponse(BaseModel):
    # ... existing fields ...
    event_id: Optional[int] = None
    event: Optional[EventSummary] = None  # Populated event details (anbefalt)
```

Se detaljer: `docs/EVENT_BADGES_BACKEND_REQUIREMENT.md`

#### 2. Event Filter i Search
**Status:** Frontend implementert, venter på backend

Backend må legge til i `PhotoSearchRequest`:
```python
class PhotoSearchRequest(BaseModel):
    # ... existing fields ...
    event_id: Optional[int] = None  # Filter by event
```

Query logic:
```sql
SELECT p.* FROM photos p
WHERE (event_id IS NULL OR p.event_id = :event_id)
```

Se detaljer: `docs/EVENT_FILTER_SEARCH_BACKEND_REQUIREMENT.md`

## Brukerflytt

### Scenario 1: Organiser bilder fra ny import
1. Gå til **Input Channels** → Velg import
2. Aktiver seleksjons-modus
3. Velg bilder
4. Klikk "Legg til i Event"
5. Velg eksisterende event ELLER opprett ny
6. Bildene får event_id satt (erstatter evt. eksisterende)

### Scenario 2: Utforsk event-hierarki
1. Gå til **Events** via sidebar
2. Toggle mellom List og Tree view
3. I Tree view: Klikk på event for å drille ned
4. Breadcrumb viser hvor du er i hierarkiet
5. Klikk på parent i breadcrumb for å gå opp

### Scenario 3: Reorganiser event-struktur
1. Gå til event detail page
2. Klikk på ⋮ meny → "Flytt event"
3. Velg ny parent ELLER "Rot-nivå"
4. Event (inkl. alle children) flyttes

### Scenario 4: Finn bilder i event
1. Gå til søk/filter
2. Åpne "Advanced filters"
3. Velg event fra dropdown
4. *(Venter på backend support)*

## Database Schema (Backend)

```sql
-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_event_id INTEGER REFERENCES events(id),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    location_name VARCHAR(255),
    gps_latitude DECIMAL(9,6),
    gps_longitude DECIMAL(9,6),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Photos table (event_id added)
ALTER TABLE photos ADD COLUMN event_id INTEGER REFERENCES events(id);
CREATE INDEX idx_photos_event_id ON photos(event_id);

-- NO junction table needed (one-to-many)
```

## Fordeler med One-to-Many

### Performance
- ✅ Direkte kolonne-filter (ingen joins)
- ✅ Ingen GROUP BY / DISTINCT nødvendig
- ✅ Enklere indexes
- ✅ Raskere queries

### Semantikk
- ✅ Klarere modell: Ett foto = én primær organisering
- ✅ Enklere for brukere å forstå
- ✅ Unngår forvirring om "hovedevent"

### Implementering
- ✅ Enklere database schema
- ✅ Færre queries
- ✅ Enklere backend-kode
- ✅ Lettere å vedlikeholde

## Sammenligning: Events vs Collections vs Tags

| Feature | Events | Collections | Tags |
|---------|--------|-------------|------|
| **Relasjon** | One-to-Many | Many-to-Many | Many-to-Many |
| **Struktur** | Hierarkisk (parent-child) | Flat | Flat |
| **Database** | `photos.event_id` kolonne | Junction table | Junction table |
| **Antall per foto** | Maks ÉN | Ubegrenset | Ubegrenset |
| **Bruk** | Primær organisering | Gruppering | Kategorisering |
| **Eksempler** | Reise, Prosjekt | Portefølje, Album | "nature", "summer" |
| **Performance** | Raskest (direkte filter) | Middels (join) | Middels (join) |

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Events List Page | ✅ Complete | List + Tree views |
| Event Detail Page | ✅ Complete | Breadcrumb, children, photos |
| EventTreeView | ✅ Complete | Recursive collapsible |
| EventBreadcrumb | ✅ Complete | Parent chain navigation |
| Add To Event Dialog | ✅ Complete | One-to-many semantics |
| Move Event Dialog | ✅ Complete | Prevents circular refs |
| Input Channels Integration | ✅ Complete | Bulk operations |
| Photo Card Badge | ⏳ Frontend ready | Waiting for backend |
| Search Event Filter | ⏳ Frontend ready | Waiting for backend |
| API Client | ✅ Complete | All endpoints |
| Types | ✅ Complete | One-to-many model |

## Neste Steg

### Backend Team
1. ✅ Legg til `event_id` kolonne i `photos` table
2. ⏳ Legg til `event_id` + `event` i `PhotoResponse`
3. ⏳ Legg til `event_id` filter i `PhotoSearchRequest`
4. ✅ Test alle event endpoints (CRUD, move, photos)

### Frontend Team
1. ✅ Events implementering fullført
2. ⏳ Venter på backend for event badges
3. ⏳ Venter på backend for event filter i search
4. ⏳ Implementer Saved Searches (API finnes)
5. ⏳ Implementer PhotoText publishing workflow

## Testing

### Manual Testing Checklist

**Events CRUD:**
- [ ] Opprett rot-event
- [ ] Opprett child event
- [ ] Rediger event metadata
- [ ] Flytt event til ny parent
- [ ] Flytt event til rot-nivå
- [ ] Slett event (children blir roots)

**Photo-Event Operations:**
- [ ] Sett event for photos fra Input Channel
- [ ] Erstatt eksisterende event (one-to-many)
- [ ] Fjern event fra photos
- [ ] Se photos i event detail
- [ ] Toggle "include descendants"

**Navigation:**
- [ ] List view → klikk event → detail
- [ ] Tree view → klikk node → drille ned
- [ ] Breadcrumb → klikk parent → navigasjon
- [ ] Sidebar Events link

**UI/UX:**
- [ ] Event badges vises (når backend klar)
- [ ] Event filter fungerer (når backend klar)
- [ ] Loading states
- [ ] Error handling
- [ ] Responsive design

## Dokumentasjon

- **Denne filen:** Fullstendig implementeringsoversikt
- `docs/EVENT_BADGES_BACKEND_REQUIREMENT.md` - Backend krav for event badges
- `docs/EVENT_FILTER_SEARCH_BACKEND_REQUIREMENT.md` - Backend krav for event filter
- `docs/ARCHITECTURE.md` - Overall app architecture
- `README.md` - Updated med Events-features

## Konklusjon

Events-funksjonen er **100% klar i frontend** med ren **one-to-many** arkitektur.

Frontend venter på to backend-oppdateringer:
1. Event badges på photos (`event_id` + `event` i PhotoResponse)
2. Event filter i search (`event_id` i PhotoSearchRequest)

Implementeringen følger beste praksis:
- Consistent med backend API design
- Type-safe med TypeScript
- Performant med optimized queries
- User-friendly med intuitive UI
- Well-documented med comprehensive docs
