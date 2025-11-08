# Phase 1 Visibility System - Implementation Status

## ✅ Completed

### 1. Core Infrastructure
- **VisibilityLevel Type**: Added enum with 4 levels (private, space, authenticated, public)
- **VISIBILITY_LEVELS**: Constant with UI labels, descriptions, and icons
- **API Client Updates**:
  - All endpoints now use trailing slashes
  - Anonymous access enabled for GET /photos, /phototext
  - Author endpoints added (shared metadata, no auth for GET)
  - `isAuthenticated()` helper method

### 2. UI Components
- **VisibilitySelector**: Dropdown with 4 options, Space disabled with tooltip
- **VisibilityBadge**: Icon + label badge for displaying visibility status
- **PhotoTextVisibilityWarning**: Alert showing how many photos will be synced
- **Radix UI**: Installed select and tooltip primitives

### 3. PhotoText Integration
- **StoryEditor**: 
  - Visibility selector in meta section
  - Warning displayed when changing visibility
  - Visibility included in save payload
- **StoryCard**: 
  - Visibility badge displayed on thumbnails
  - Type updated to accept visibility field

### 4. API Integration
- Trailing slashes on all endpoints
- Anonymous access support
- Author endpoints (GET without auth, POST/PUT/DELETE with auth)
- Visibility filter support in getPhotoTexts()

---

## ⏳ Remaining Tasks

### 1. Photo Upload/Edit with Visibility
- Add VisibilitySelector to photo metadata forms
- Update PhotoDetailDialog component
- Update photo upload flows

### 2. Anonymous/Public Gallery View
- **HomePage**: Show public photos when not logged in
- **Stories List**: Show public stories when not logged in
- **Sign-in Prompt**: "Sign in to see more" message
- **Navigation**: Update auth checks

### 3. Story Viewer Updates
- Add visibility badge to story detail page
- Show "This is a public story" message if applicable
- Test anonymous access to public stories

### 4. Authors Integration
- Update any author dropdowns to fetch all authors (not user-scoped)
- Remove user filtering from author selection
- Test author CRUD with proper auth

### 5. Testing & Validation
- Test anonymous access to public photos
- Test anonymous access to public stories
- Test visibility changes sync to photos
- Test Space option (should work as private)
- Test all API endpoints with trailing slashes

### 6. Edge Cases
- Handle missing visibility field (default to 'private')
- Handle old documents without visibility
- Migration/backward compatibility

---

## 🎯 Next Steps

### Priority 1: Photo Visibility
Update photo upload and edit forms to include visibility selector:
- `components/photo-detail-dialog.tsx`
- Photo upload flows (if they exist)

### Priority 2: Anonymous Gallery
Enable public access for unauthenticated users:
- Update `app/page.tsx` (home page)
- Update `app/stories/page.tsx`
- Add conditional rendering based on `apiClient.isAuthenticated()`

### Priority 3: Story Viewer
Add visibility indicator to story detail page:
- Update `app/stories/[id]/page.tsx`
- Show VisibilityBadge
- Test anonymous access

### Priority 4: Authors
If authors are used anywhere:
- Update author selection components
- Test shared author dropdown

---

## 📝 Implementation Notes

### Backend Expectations
- `visibility` field on Photo and PhotoTextDocument
- Values: 'private' | 'space' | 'authenticated' | 'public'
- Default: 'private'
- Space functionality not yet implemented (acts as private)

### Photo-PhotoText Sync
- Backend automatically syncs photo visibility when PhotoText visibility changes
- Frontend shows warning with affected photo count
- User doesn't need to manually update photos

### Trailing Slashes
- All API endpoints now require trailing slash
- Backend enforces this (redirects otherwise)

### Anonymous Access
- GET requests to photos/phototext work without authentication
- Only returns public content for anonymous users
- Authenticated users see content based on visibility rules

---

## 🐛 Known Issues

### Type Definitions
- `PhotoTextDocumentSummary` doesn't include `visibility` in generated types
- Currently using type extension: `PhotoTextDocumentSummary & { visibility?: string }`
- Should regenerate types from OpenAPI spec after backend update

### Space Option
- Selectable in UI but disabled
- Works as 'private' in Phase 1
- Shows tooltip: "Spaces coming in Phase 2"

---

## 🔄 Future (Phase 2)

### Spaces
- Enable Space visibility option
- Implement space membership UI
- Shared workspaces for photographer collaboration

### Collaborators
- Direct 1-to-1 sharing
- View/Edit permissions
- Invitation workflow

### Advanced Features
- Public galleries (curated collections)
- Discovery (search public content)
- Featured spaces
- Privacy controls (who can see what)

---

## 📚 Documentation

See:
- `docs/STORIES_IMPLEMENTATION.md` - PhotoText implementation guide
- `docs/COMPLETE_API_SPECIFICATION.md` - Full API reference
- `docs/ARCHITECTURE.md` - System architecture

Backend documentation:
- `docs/FRONTEND_VISIBILITY_IMPLEMENTATION.md` (in backend repo)
- Phase 1 visibility API changes

---

Updated: 2025-11-08
