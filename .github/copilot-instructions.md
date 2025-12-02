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

### 6. Styling

- **Typography:** Tailwind utility classes
- **Components:** shadcn/ui from `@/components/ui`
- **Icons:** lucide-react
- **Dark mode:** Use Tailwind's `dark:` prefix

**Standard spacing:**
- Page padding: `px-4 py-8`
- Section margin: `mb-6` or `mb-8`
- Grid gap: `gap-4` or `gap-6`

### 7. File Organization

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

- One-to-many: Photo has single `event_id`
- Hierarchical: Events can have parent events
- API endpoints: `/api/v1/events/`, `/api/v1/events/tree`

### 10. Recent Changes

- ✅ Dedicated `/login` page (logout redirects here)
- ✅ Consistent page structure (no min-h-screen wrappers)
- ✅ Events system implemented and deployed
- ✅ AppLayout handles all layout concerns

## When Creating New Pages

1. Start with `'use client'` if interactive
2. Import `useAuth` for authentication
3. Use ONLY `<div className="container mx-auto px-4 py-8">`
4. Handle loading/auth states
5. Follow patterns in existing pages

## References

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

---

**Remember:** Pages handle CONTENT, AppLayout handles LAYOUT. Keep this separation clear.
