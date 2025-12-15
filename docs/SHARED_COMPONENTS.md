# Shared Components Guide

Dette dokumentet beskriver de gjenbrukbare komponentene som brukes på tvers av hele applikasjonen for å sikre konsistent design og oppførsel.

## 🎯 Filosofi

**DRY (Don't Repeat Yourself):** Alle elementer som ligner skal bruke samme kode.
- ✅ Ett sted å endre - oppdateringer gjelder overalt
- ✅ Konsistent oppførsel og styling
- ✅ Færre bugs (mindre kode)
- ✅ Enklere vedlikehold

---

## 🖼️ Thumbnail Component

**Fil:** `components/ui/thumbnail.tsx`

Unified komponent for å vise alle miniatyrbilder i applikasjonen.

### Funksjoner

- ✅ Konsistente aspect ratios
- ✅ Automatisk loading state (spinner)
- ✅ Fallback placeholder ved feil
- ✅ Hover scale effect (valgfri)
- ✅ Error handling

### Bruk

```tsx
import { Thumbnail } from '@/components/ui/thumbnail';

<Thumbnail
  src={imageUrl}
  alt="Beskrivelse"
  aspect="video"        // 'square' | 'video' | '4/3' | '3/2' | '21/9'
  hoverScale={true}     // Scale på hover
/>
```

### Aspect Ratios

| Type | Ratio | Bruksområde |
|------|-------|-------------|
| `square` | 1:1 | Photo cards, avatarer |
| `video` | 16:9 | Collection covers |
| `4/3` | 4:3 | Landscape photos |
| `3/2` | 3:2 | Wide photos |
| `21/9` | 21:9 | Story covers |

### Eksempel

```tsx
// Collection cover
<Thumbnail
  src={apiClient.getHotPreviewUrl(photo.hothash)}
  alt={collection.name}
  aspect="video"
  hoverScale
/>

// Photo grid
<Thumbnail
  src={imageUrl}
  alt={photo.filename}
  aspect="square"
/>
```

---

## 📦 Card Components

**Fil:** `components/ui/card-container.tsx`

Standardiserte card-komponenter for konsistent layout.

### CardContainer

Base card wrapper med hover og click states.

```tsx
import { CardContainer } from '@/components/ui/card-container';

<CardContainer
  clickable={true}      // Cursor pointer + onClick
  hover={true}          // Shadow effekt på hover
  onClick={() => {}}
>
  {children}
</CardContainer>
```

### CardHeader

Standard header med title, description og extra content.

```tsx
import { CardHeader } from '@/components/ui/card-container';

<CardHeader
  title="Tittel"
  description="Beskrivelse (valgfri)"
  extra={<Star />}      // Badges, ikoner, etc (valgfri)
/>
```

### CardMeta + CardMetaItem

Container for metadata med ikoner.

```tsx
import { CardMeta, CardMetaItem } from '@/components/ui/card-container';

<CardMeta>
  <CardMetaItem
    icon={<Calendar className="h-3 w-3" />}
    label="15. des 2025"
  />
  <CardMetaItem
    icon={<ImageIcon className="h-3 w-3" />}
    label="24 bilder"
  />
</CardMeta>
```

### Komplett Eksempel

```tsx
import { CardContainer, CardHeader, CardMeta, CardMetaItem } from '@/components/ui/card-container';

<CardContainer clickable onClick={() => navigate(`/item/${id}`)}>
  <Thumbnail src={imageUrl} alt={name} aspect="video" hoverScale />
  
  <div className="p-4">
    <CardHeader
      title="Mitt Album"
      description="Bilder fra sommeren 2025"
      extra={<Star className="text-yellow-400" />}
    />
    
    <CardMeta>
      <CardMetaItem
        icon={<Calendar className="h-3 w-3" />}
        label={formatDate(date)}
      />
      <CardMetaItem
        icon={<ImageIcon className="h-3 w-3" />}
        label="24 bilder"
      />
    </CardMeta>
  </div>
</CardContainer>
```

---

## 🛠️ Utility Functions

**Fil:** `lib/utils.ts`

Felles hjelpefunksjoner for formatering.

### formatDate()

Formater dato med norsk locale.

```tsx
import { formatDate } from '@/lib/utils';

formatDate(dateString, 'short')    // "15. des 2025"
formatDate(dateString, 'long')     // "15. desember 2025, 14:30"
formatDate(dateString, 'relative') // "2 dager siden"
```

**Relative format:**
- I dag
- I går
- X dager siden
- X uker siden
- X måneder siden
- X år siden

### formatDateTime()

Full dato og tid.

```tsx
import { formatDateTime } from '@/lib/utils';

formatDateTime(dateString) // "15. desember 2025, 14:30"
```

### formatNumber()

Tall med norsk tusenskille.

```tsx
import { formatNumber } from '@/lib/utils';

formatNumber(1234567) // "1 234 567"
```

### formatBytes()

Filstørrelse i lesbart format.

```tsx
import { formatBytes } from '@/lib/utils';

formatBytes(1024)       // "1.00 KB"
formatBytes(1048576)    // "1.00 MB"
formatBytes(1234567, 1) // "1.2 MB"  (1 desimal)
```

---

## 📋 Migreringsguide

### Før (duplikert kode)

```tsx
export function MyCard({ item }: Props) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg" onClick={...}>
      <div className="relative aspect-video overflow-hidden bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold">{item.name}</h3>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(item.date)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

### Etter (med felles komponenter)

```tsx
import { Thumbnail } from '@/components/ui/thumbnail';
import { CardContainer, CardHeader, CardMeta, CardMetaItem } from '@/components/ui/card-container';
import { formatDate } from '@/lib/utils';

export function MyCard({ item }: Props) {
  return (
    <CardContainer clickable onClick={...}>
      <Thumbnail src={imageUrl} alt={item.name} aspect="video" hoverScale />
      
      <div className="p-4">
        <CardHeader
          title={item.name}
          description={item.description}
        />
        
        <CardMeta>
          <CardMetaItem
            icon={<Calendar className="h-3 w-3" />}
            label={formatDate(item.date)}
          />
        </CardMeta>
      </div>
    </CardContainer>
  );
}
```

**Resultater:**
- ✅ 50+ linjer redusert til 20 linjer
- ✅ Ingen duplikasjon av formatDate
- ✅ Ingen duplikasjon av image loading logic
- ✅ Konsistent styling automatisk

---

## 🎨 Styling Conventions

Alle felles komponenter følger disse prinsippene:

### Spacing
- Card padding: `p-4` eller `p-6`
- Metadata gap: `gap-3` eller `gap-4`
- Section margins: `mb-3`

### Typography
- Card title: `text-lg font-semibold`
- Description: `text-sm text-muted-foreground`
- Metadata: `text-xs text-muted-foreground`

### Icons
- Metadata icons: `h-3 w-3`
- Header icons: `h-4 w-4`
- Placeholders: `h-16 w-16`

### Colors
- Muted background: `bg-muted`
- Muted text: `text-muted-foreground`
- Hover shadow: `hover:shadow-lg`

---

## 📍 Hvor brukes komponentene?

### Thumbnail
- ✅ `photo-card.tsx` - Foto i grid
- ✅ `collection-card.tsx` - Collection cover
- ✅ `timeline/timeline-nodes.tsx` - Timeline previews
- ✅ `phototext/ImagePicker.tsx` - Image selection
- 🔄 Kan også brukes i Stories, PhotoDetailDialog, etc.

### CardContainer
- ✅ `collection-card.tsx`
- ✅ `input-channel-card.tsx`
- ✅ `saved-search-card.tsx`
- 🔄 Kan brukes for alle card-lignende UI

### Utils (formatDate, formatBytes, etc)
- ✅ `collection-card.tsx`
- ✅ `input-channel-card.tsx`
- ✅ `saved-search-card.tsx`
- ✅ `photo-card.tsx`
- ✅ `admin/stats/page.tsx`
- 🔄 Bør brukes overalt i stedet for lokale format-funksjoner

---

## 🚀 Neste Steg

### Flere kandidater for unifikasjon

1. **Grid Layouts**
   - PhotoGrid er allerede unified
   - Men andre grid-visninger kan standardiseres

2. **Loading States**
   - Spinner-komponent i `ui/loading-spinner.tsx`
   - Consistent loading skeleton

3. **Empty States**
   - `ui/empty-state.tsx` med icon, tittel, og action

4. **Error States**
   - `ui/error-message.tsx` med konsistent styling

5. **Badges og Tags**
   - Unified badge colors og sizes
   - Tag cloud component

---

## 💡 Best Practices

### Når du lager nye komponenter

1. ✅ **Sjekk først om det finnes en shared component**
2. ✅ **Bruk Thumbnail i stedet for egen Image-implementering**
3. ✅ **Bruk CardContainer for alle card-lignende UI**
4. ✅ **Bruk formatDate/formatBytes i stedet for custom formatering**
5. ✅ **Følg spacing/typography conventions fra shared components**

### Når du ser duplikasjon

1. 🔍 **Identifiser mønsteret** (thumbnail? card? formatting?)
2. ♻️ **Refaktorer til shared component**
3. 📝 **Oppdater denne dokumentasjonen**
4. ✅ **Migrer alle bruksområder**

---

## 📚 Relaterte Dokumenter

- **Frontend Conventions:** `docs/FRONTEND_CONVENTIONS.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Copilot Instructions:** `.github/copilot-instructions.md`

---

**Sist oppdatert:** 15. desember 2025
