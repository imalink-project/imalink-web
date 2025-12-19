# Implementer Atomic Collections API for robuste item-operasjoner

## Kontekst
Frontend bruker workaround (append + reload + reorder) for å sette inn items på spesifikk posisjon. Dette er tregt (3 API-kall), sender stort payload (alle 276 items) ved reorder, og er sårbart for race conditions.

## Krav: Implementer atomic operations API

### 1. INSERT - Sett inn items på spesifikk posisjon
```http
POST /api/v1/collections/{collection_id}/items/insert
Authorization: Bearer <token>
Content-Type: application/json

{
  "position": 61,
  "items": [
    { "type": "text", "text_card": { "content": "...", "title": "..." } },
    { "type": "photo", "photo_hothash": "abc123..." }
  ]
}
```

**Response:**
```json
{
  "collection_id": 3,
  "item_count": 277,
  "affected_count": 2,
  "affected_positions": [61, 62]
}
```

**Validering:**
- `position` må være 0 til `len(items)` (inklusiv)
- `position = 0` = sett inn først
- `position = len(items)` = append til slutten
- Photos må eksistere og tilhøre brukeren
- Return 400 hvis invalid position
- Return 404 hvis photo ikke finnes

**Oppførsel:**
- Items settes inn FØR nåværende item på `position`
- Eksisterende items fra `position` og oppover skyves oppover
- Atomisk operasjon (database transaction)

### 2. MOVE - Flytt items fra én posisjon til en annen
```http
POST /api/v1/collections/{collection_id}/items/move
Authorization: Bearer <token>
Content-Type: application/json

{
  "from_position": 100,
  "count": 5,
  "to_position": 50
}
```

**Response:**
```json
{
  "collection_id": 3,
  "item_count": 276,
  "affected_range": [50, 104]
}
```

**Validering:**
- `from_position` + `count` må være <= `len(items)`
- `to_position` må være 0 til `len(items) - count`
- Return 400 hvis invalid range

**Oppførsel:**
- Fjern `count` items fra `from_position`
- Sett inn på `to_position`
- Atomisk operasjon

### 3. DELETE BY POSITION - Slett items på spesifikk posisjon
```http
DELETE /api/v1/collections/{collection_id}/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "position": 61,
  "count": 1
}
```

**Response:**
```json
{
  "collection_id": 3,
  "item_count": 275,
  "deleted_count": 1
}
```

**Validering:**
- `position` + `count` må være <= `len(items)`
- Return 400 hvis invalid range

**Oppførsel:**
- Slett `count` items fra `position`
- Items etter skyves ned
- Atomisk operasjon

## Eksisterende endepunkter (BEHOLD for bakoverkompatibilitet):

```
POST /api/v1/collections/{id}/items        # Append (eksisterer)
PUT /api/v1/collections/{id}/items/reorder # Full reorder (eksisterer)
DELETE /api/v1/collections/{id}/items/{position} # Delete single (eksisterer?)
```

## Database-struktur (antar JSONB i PostgreSQL):
```sql
collections table:
  - id: integer
  - user_id: integer
  - name: text
  - items: jsonb  -- Array of {type, photo_hothash?, text_card?}
```

## Testing:
- Test insert på position 0 (først)
- Test insert på position len(items) (sist)
- Test insert midten (position 61)
- Test move oppover og nedover
- Test delete første, siste, midten
- Test invalid positions (return 400)
- Test concurrent requests (database locking)

## Implementer i:
- `routers/collections.py` (FastAPI)
- Bruk database transactions for atomicity
- Log operasjoner for debugging

## Returner kun:
Koden for de nye endepunktene (INSERT, MOVE, DELETE). Ingen forklaring utover koden.
