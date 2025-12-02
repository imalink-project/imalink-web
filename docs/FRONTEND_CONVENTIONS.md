# Frontend Development Conventions

## Page Structure Guidelines

### ✅ Standard Page Pattern

All pages inside the authenticated app MUST follow this structure:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
// ... other imports

export default function PageName() {
  const { isAuthenticated, loading } = useAuth();
  
  // Redirect if not authenticated (handled by layout or useEffect)
  
  // Page state and logic
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Page Title</h1>
      
      {/* Page content */}
    </div>
  );
}
```

### ❌ INCORRECT - Do NOT Use

**Never wrap pages in `min-h-screen` or full-screen background:**

```tsx
// ❌ WRONG - AppLayout already handles this
return (
  <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
    <div className="container mx-auto px-4 py-8">
      {/* content */}
    </div>
  </div>
);
```

### Why?

1. **AppLayout handles full-screen layout** - It already provides:
   - `min-h-screen` wrapper
   - Sidebar navigation
   - Main content area with `flex-1 overflow-auto`

2. **Single Responsibility** - Pages focus on content, not layout

3. **Consistency** - All pages follow the same structure

4. **Maintainability** - Layout changes happen in one place

## Layout Architecture

```
app/
  layout.tsx              → Root layout (wraps everything)
    └─ AppLayout          → Sidebar + main content area (min-h-screen)
         └─ page.tsx      → Just content (container mx-auto px-4 py-8)
```

### AppLayout Structure

```tsx
// components/app-layout.tsx
<div className="flex min-h-screen">
  <Sidebar />
  <main className="flex-1 overflow-auto">
    {children}  {/* Pages render here */}
  </main>
</div>
```

### Page Structure

```tsx
// app/some-page/page.tsx
<div className="container mx-auto px-4 py-8">
  {/* Content only - no layout concerns */}
</div>
```

## Loading and Auth States

### Authenticated Pages

```tsx
export default function AuthenticatedPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page content */}
    </div>
  );
}
```

### Public Pages (Login, etc.)

Login and other public pages can have their own layout:

```tsx
// app/login/page.tsx
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <AuthForm />
    </div>
  );
}
```

## Common Patterns

### Page Header

```tsx
<div className="container mx-auto px-4 py-8">
  {/* Header */}
  <div className="mb-8 flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold">Page Title</h1>
      <p className="mt-2 text-muted-foreground">
        Description of the page
      </p>
    </div>
    
    <Button onClick={handleAction}>
      Action
    </Button>
  </div>

  {/* Content */}
</div>
```

### Error States

```tsx
{error && (
  <div className="mb-6 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
    {error}
  </div>
)}
```

### Empty States

```tsx
{items.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12">
    <Icon className="mb-4 h-16 w-16 text-muted-foreground/30" />
    <h2 className="mb-2 text-xl font-semibold">No items yet</h2>
    <p className="mb-6 text-center text-muted-foreground">
      Description of empty state
    </p>
    <Button onClick={handleCreate}>
      Create First Item
    </Button>
  </div>
)}
```

## File Organization

```
app/
  page.tsx                → Home (authenticated)
  login/
    page.tsx              → Login (public, own layout)
  events/
    page.tsx              → Events list (authenticated)
    [id]/
      page.tsx            → Event detail (authenticated)
  collections/
    page.tsx              → Collections list (authenticated)
    [id]/
      page.tsx            → Collection detail (authenticated)

components/
  app-layout.tsx          → Main layout wrapper
  ui/                     → Reusable UI components
  [feature]/              → Feature-specific components
```

## Styling Conventions

### Container Widths

- **Default**: `container mx-auto px-4 py-8` (responsive, max-width)
- **Wide**: `container mx-auto px-4 py-8 max-w-7xl`
- **Narrow**: `container mx-auto px-4 py-8 max-w-4xl`

### Spacing

- **Page padding**: `px-4 py-8`
- **Section margin**: `mb-6` or `mb-8`
- **Element gap**: `gap-4` or `gap-6`

### Typography

- **Page title**: `text-3xl font-bold`
- **Section title**: `text-xl font-semibold`
- **Description**: `text-muted-foreground`

## Next.js Specific

### Client Components

Most interactive pages need `'use client'` directive:

```tsx
'use client';

import { useState } from 'react';
// ...
```

### Server Components

Static pages can omit the directive (default in App Router).

### Loading States

Use inline loading for better UX instead of Next.js loading.tsx:

```tsx
{loading && (
  <div className="flex min-h-[400px] items-center justify-center">
    <LoadingSpinner />
  </div>
)}
```

## Examples

### ✅ Good Example - Events Page

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function EventsPage() {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEvents();
    }
  }, [isAuthenticated]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Events</h1>
      {/* Content */}
    </div>
  );
}
```

### ❌ Bad Example - DO NOT DO THIS

```tsx
export default function EventsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        <h1>Events</h1>
        {/* Redundant wrapper - AppLayout already provides min-h-screen */}
      </div>
    </div>
  );
}
```

## Checklist for New Pages

- [ ] Use `'use client'` if page has interactivity
- [ ] Import `useAuth` for authentication
- [ ] Handle loading and auth states
- [ ] Start with `<div className="container mx-auto px-4 py-8">`
- [ ] NO `min-h-screen` wrapper
- [ ] NO background color on outer wrapper
- [ ] Include proper page title
- [ ] Add helpful empty states
- [ ] Handle errors gracefully

## References

- Next.js Layouts: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
- Tailwind Container: https://tailwindcss.com/docs/container
- shadcn/ui Components: https://ui.shadcn.com

---

Last updated: 2025-12-02
