# Implementer Item Visibility i Collections

## Kontekst
Collections inneholder items (photos + text cards) i en JSONB array. Brukere trenger å kunne "disable" items fra visning, spesielt for slideshow-kurasjon. Disabled items skal fortsatt være i collection (for enkel re-enabling), men filtreres bort i slideshow view.

## Use Case
```
Scenario: Bruker har 275 bilder i collection, vil lage 40-bilders slideshow

1. Bruker legger alle 275 bilder i riktig rekkefølge
2. Bruker disabler 235 bilder (beholder 40)
3. Slideshow viser kun de 40 enabled items
4. Bruker kan enkelt toggle visibility for å teste forskjellige kombinasjoner
5. Collection view viser ALLE items (disabled rendres grått)
```

## Krav

### 1. Data Model - Legg til `visible` field i items

**JSONB struktur i `collections.items`:**
```json
{
  "items": [
    {
      "type": "photo",
      "photo_hothash": "abc123...",
      "visible": true
    },
    {
      "type": "text",
      "text_card": {
        "title": "Heading",
        "body": "Content..."
      },
      "visible": false
    }
  ]
}
```

**Validering:**
- `visible` er optional boolean
- Default til `true` hvis ikke satt (bakoverkompatibilitet)
- Både photo og text items kan ha visible field

**Migration:**
- INGEN database migration nødvendig (JSONB er schema-less)
- Eksisterende items uten `visible` field behandles som `visible=true` i app-layer
- Når items oppdateres, legg til `visible: true` hvis mangler

### 2. API Endepunkt - Toggle visibility

```http
PATCH /api/v1/collections/{collection_id}/items/{position}/visibility
Authorization: Bearer <token>
Content-Type: application/json

{
  "visible": false
}
```

**Request:**
- `collection_id`: Collection ID (må tilhøre current user)
- `position`: Index i items array (0-based)
- Body: `{ "visible": true/false }`

**Response (200 OK):**
```json
{
  "collection_id": 3,
  "position": 61,
  "visible": false,
  "item_count": 275,
  "visible_count": 40
}
```

**Validering:**
- Return `404` hvis collection ikke finnes eller ikke tilhører user
- Return `400` hvis position < 0 eller position >= len(items)
- Return `400` hvis visible ikke er boolean

**Implementering:**
```python
@router.patch("/collections/{collection_id}/items/{position}/visibility")
async def toggle_item_visibility(
    collection_id: int,
    position: int,
    request: dict,  # {"visible": bool}
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Hent collection (sjekk ownership)
    collection = db.query(PhotoCollection).filter(
        PhotoCollection.id == collection_id,
        PhotoCollection.user_id == current_user.id
    ).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # 2. Validate position
    items = collection.items or []
    if position < 0 or position >= len(items):
        raise HTTPException(status_code=400, detail=f"Invalid position: {position}")
    
    # 3. Validate visible field
    visible = request.get("visible")
    if not isinstance(visible, bool):
        raise HTTPException(status_code=400, detail="visible must be boolean")
    
    # 4. Update item visibility
    items = list(items)  # Make mutable copy
    items[position]["visible"] = visible
    
    # 5. Save to database
    collection.items = items
    collection.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(collection)
    
    # 6. Count visible items
    visible_count = sum(1 for item in items if item.get("visible", True))
    
    return {
        "collection_id": collection_id,
        "position": position,
        "visible": visible,
        "item_count": len(items),
        "visible_count": visible_count
    }
```

### 3. Normalisering - Legg til default `visible=true`

**I GET /collections/{id} response:**
```python
def normalize_collection_items(items: list) -> list:
    """Ensure all items have visible field (default true)"""
    for item in items:
        if "visible" not in item:
            item["visible"] = True
    return items

# I collection response serializer
collection_dict = {
    "id": collection.id,
    "name": collection.name,
    "items": normalize_collection_items(collection.items or []),
    # ... rest of fields
}
```

**Viktig:** Dette sikrer at frontend alltid får `visible` field, selv for gamle items.

### 4. Bulk Operations (Optional - Nice to have)

```http
PATCH /api/v1/collections/{collection_id}/items/visibility/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "positions": [0, 2, 5, 8],
  "visible": false
}
```

**Response:**
```json
{
  "collection_id": 3,
  "affected_count": 4,
  "visible_count": 36
}
```

Dette gjør det mulig å toggle mange items samtidig (f.eks. "hide all" / "show all").

### 5. Eksisterende endepunkter - Behold visible field

**Viktig:** Når items manipuleres via andre endepunkter, BEHOLD `visible` field:

**INSERT items (POST /collections/{id}/items/insert):**
```python
# Nye items får default visible=true
new_item = {
    "type": "photo",
    "photo_hothash": hothash,
    "visible": True  # DEFAULT for nye items
}
```

**MOVE items (POST /collections/{id}/items/move):**
```python
# Når items flyttes, BEHOLD visible field
moved_item = items[from_position]  # Includes visible field
items.insert(to_position, moved_item)  # Preserved
```

**DELETE items (DELETE /collections/{id}/items):**
```python
# Når items slettes, visible field forsvinner (self-explanatory)
items.pop(position)
```

**REORDER items (PATCH /collections/{id}/items/reorder):**
```python
# Når hele items array sendes, behold visible fields
# Frontend må sende items MED visible field
```

## Testing

### Test Cases

**1. Toggle visibility:**
```bash
# Set item invisible
curl -X PATCH .../collections/3/items/61/visibility \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"visible": false}'

# Response should include visible_count
```

**2. Backward compatibility:**
```bash
# GET collection without visible field in items
# Should return items with visible=true added
```

**3. Invalid position:**
```bash
# Try position=-1 or position=999
# Should return 400 Bad Request
```

**4. Preserve visibility across operations:**
```bash
# 1. Set item invisible
# 2. Move item to new position
# 3. GET collection
# 4. Verify item still has visible=false
```

**5. Bulk operations:**
```bash
# Hide 235 items at once
# Should be faster than 235 individual PATCHes
```

## Frontend Integration

Frontend vil bruke endepunktet slik:

```typescript
// Toggle single item
await apiClient.toggleItemVisibility(collectionId, position, false);

// Bulk hide all
await apiClient.bulkToggleVisibility(collectionId, [0,1,2,...], false);

// Filter for slideshow
const visibleItems = items.filter(item => item.visible !== false);
```

## Oppsummering

**Database endringer:** Ingen (JSONB schema-less)  
**Nye endepunkter:** 1 (+ 1 optional bulk)  
**Estimert arbeid:** 1-2 timer  
**Testing:** 30 minutter  

**Viktigste punkt:** Normaliser ALLTID items med `visible=true` default i GET endepunkter for bakoverkompatibilitet.
