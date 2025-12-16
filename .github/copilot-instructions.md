# GitHub Copilot Instructions for imalink-web

## Project Overview

imalink-web is a Next.js 14+ photo management application with TypeScript, Tailwind CSS, and shadcn/ui components. The backend is a FastAPI service.

## Critical Conventions

### 1. Page Structure (MANDATORY)

**✅ ALWAYS use this pattern for authenticated pages:**

```tsx
'use client';

export default function PageName() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Content only - NO min-h-screen wrapper */}
    </div>
  );
}
```

**❌ NEVER wrap pages in `min-h-screen`:**

```tsx
// WRONG - AppLayout already provides this
<div className="min-h-screen bg-zinc-50">
  <div className="container mx-auto px-4 py-8">
```

**Why:** `AppLayout` component handles full-screen layout, sidebar, and navigation. Pages should ONLY contain content.

### 2. Architecture

```
AppLayout (min-h-screen + sidebar)
  └─ Pages (container mx-auto px-4 py-8 only)
```

**See:** `docs/FRONTEND_CONVENTIONS.md` for complete guidelines.

### 3. Authentication

All authenticated pages must:
- Import `useAuth` from `@/lib/auth-context`
- Handle loading and unauthenticated states
- Redirect to `/login` if not authenticated

```tsx
const { isAuthenticated, loading } = useAuth();

useEffect(() => {
  if (!loading && !isAuthenticated) {
    router.push('/login');
  }
}, [loading, isAuthenticated, router]);
```

### 4. API Client

- All API calls go through `apiClient` from `@/lib/api-client`
- Backend base URL: `https://api.trollfjell.com/api/v1`
- Authentication: JWT token in localStorage (`imalink_token`)

### 5. Component Patterns

**Loading states:**
```tsx
<div className="flex min-h-[400px] items-center justify-center">
  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
</div>
```

**Error states:**
```tsx
<div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
  {error}
</div>
```

**Empty states:**
```tsx
<div className="flex flex-col items-center justify-center py-12">
  <Icon className="mb-4 h-16 w-16 text-muted-foreground/30" />
  <h2 className="mb-2 text-xl font-semibold">No items yet</h2>
  <Button>Create First Item</Button>
</div>
```

### 6. Shared Components (CRITICAL - Use These!)

**✅ ALWAYS use shared components instead of duplicating code:**

- **Thumbnails:** Use `<Thumbnail>` from `@/components/ui/thumbnail`
  ```tsx
  <Thumbnail src={url} alt="Photo" aspect="square" hoverScale />
  ```
  
- **Cards:** Use `CardContainer`, `CardHeader`, `CardMeta` from `@/components/ui/card-container`
  ```tsx
  <CardContainer clickable onClick={...}>
    <CardHeader title="Title" description="Desc" />
    <CardMeta>
      <CardMetaItem icon={<Icon />} label="Label" />
    </CardMeta>
  </CardContainer>
  ```

- **Formatting:** Use utils from `@/lib/utils`
  ```tsx
  formatDate(date, 'short')    // "15. des 2025"
  formatDate(date, 'relative') // "2 dager siden"
  formatBytes(1024)            // "1.00 KB"
  formatNumber(1234567)        // "1 234 567"
  ```

**See:** `docs/SHARED_COMPONENTS.md` for complete guide

### 7. Styling

- **Typography:** Tailwind utility classes
- **Components:** shadcn/ui from `@/components/ui`
- **Icons:** lucide-react
- **Dark mode:** Use Tailwind's `dark:` prefix

**Standard spacing:**
- Page padding: `px-4 py-8`
- Section margin: `mb-6` or `mb-8`
- Grid gap: `gap-4` or `gap-6`

### 8. File Organization

```
app/
  page.tsx              → Home (content only)
  [feature]/
    page.tsx            → Feature page (content only)
    [id]/
      page.tsx          → Detail page (content only)

components/
  app-layout.tsx        → Layout wrapper (handles min-h-screen)
  ui/                   → shadcn/ui primitives
  [feature]/            → Feature components

lib/
  api-client.ts         → API calls
  auth-context.tsx      → Authentication
  types.ts              → TypeScript types
```

### 8. TypeScript

- Strict mode enabled
- Use types from `@/lib/types`
- API types auto-generated in `lib/api-types.generated.ts`

### 9. Events System

- **Architecture:** One-to-many (photo can only be in ONE event)
- **Dates:** Removed from structure - now purely informational in description field
- **Hierarchical:** Events can have parent events for organization
- **API:** 
  - Set event: `PUT /photos/{hothash}/event` with body as plain integer (event_id)
  - Get events: `GET /api/v1/events/`, `GET /api/v1/events/tree`
- **Workflow:** Manual curation - desktop app may auto-suggest from folders

### 10. Photo Organization Features

- **PhotoGrid Component:** Unified photo workspace with batch operations
  - **Philosophy:** Workspace tool, NOT an album viewer
  - **Always sorts by date:** Newest first (descending), regardless of source
  - **Configurable limit:** 30-1000 photos (default 500)
  - **Date grouping toggle:** Optional month/day headers (Calendar button)
  - **Batch selection:** Checkboxes with Shift-click range selection
  - **Batch operations:** "Add to Collection" (many-to-many), "Add to Event" (one-to-many)
  - **Processed state:** Grayed out after action
  - **Floating action bar:** When photos selected
  - **Transparent count:** Shows "Showing X of Y (sorted by date, newest first)"

- **PhotoGrid Sorting Behavior:**
  - **Always sorts:** Uses `sortedPhotos` from `photos.sort()` by date taken (newest first)
  - **Partial data:** Sorts what's loaded, "Load More" appends and re-sorts
  - **All views:** Both flat and grouped rendering use same `sortedPhotos` array
  - **Shift-select:** Uses `sortedPhotos` for correct range indexing
  - **Future plans:** Multi-criteria sorting (name, size, rating), direction toggle

- **Timeline Temporary Grids:**
  - Click "View Photos" on any Timeline bucket (year/month/day/hour)
  - Opens PhotoGrid dialog with batch operations enabled
  - Easy to select and organize photos by time period

- **Input Channel Organization:**
  - PhotoGrid with batch operations after import
  - Organize photos immediately after upload

### 11. Recent Changes (Dec 2025)

- ✅ Removed start/end dates from Events (now in description)
- ✅ Added "Add to Event" batch operation alongside Collections
- ✅ Timeline temporary grids with PhotoGrid dialog
- ✅ Fixed Events API: PUT /photos/{hothash}/event sends plain integer
- ✅ Unified PhotoGrid component everywhere (removed BildelisteViewer)
- ✅ User profile moved to top of sidebar
- ✅ Consistent page structure (no min-h-screen wrappers)
- ✅ **Shared components refactor:** Thumbnail, CardContainer, format utils (see `docs/SHARED_COMPONENTS.md`)
- ✅ **PhotoGrid always-sort:** Workspace philosophy, always sorts by date (newest first)
- ✅ **Configurable limit:** 30-1000 with dropdown (default 500)
- ✅ **Date grouping:** Calendar toggle with month/day headers
- ✅ **Shift-click range selection:** Desktop app behavior for batch selection

## When Creating New Pages

1. Start with `'use client'` if interactive
2. Import `useAuth` for authentication
3. Use ONLY `<div className="container mx-auto px-4 py-8">`
4. Handle loading/auth states
5. Follow patterns in existing pages

## References

- **Shared Components:** `docs/SHARED_COMPONENTS.md` ⭐ **READ THIS FIRST**
- **Frontend Conventions:** `docs/FRONTEND_CONVENTIONS.md`
- **API Spec:** `docs/COMPLETE_API_SPECIFICATION.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Phase 1 Status:** `docs/PHASE1_VISIBILITY_STATUS.md`

## Common Mistakes to Avoid

1. ❌ Adding `min-h-screen` to pages
2. ❌ Adding background colors to page wrappers
3. ❌ Not handling auth states properly
4. ❌ Forgetting `'use client'` directive
5. ❌ Not using `apiClient` for API calls
6. ❌ **Duplicating thumbnail/card/formatting code instead of using shared components**

---

**Remember:** Pages handle CONTENT, AppLayout handles LAYOUT. Keep this separation clear.
