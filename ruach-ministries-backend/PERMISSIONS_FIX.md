# Strapi Permissions Fix for lesson-progresses

## Issue
Frontend getting 403 when calling GET /api/lesson-progresses

## Root Cause
The Authenticated role doesn't have permission to access lesson-progresses, even though the controller has user-scoping built in.

## Fix Steps

### 1. Open Strapi Admin
```bash
# Make sure Strapi is running
pnpm develop

# Open in browser
open http://localhost:1337/admin
```

### 2. Navigate to Permissions
1. Click **Settings** (gear icon in left sidebar)
2. Click **Users & Permissions Plugin** → **Roles**
3. Click **Authenticated** role

### 3. Enable lesson-progress Permissions
Scroll down to **Lesson-progress** section and enable:
- ✅ **find** (List/search entries)
- ✅ **findOne** (Get one entry)
- ✅ **create** (Create an entry)
- ✅ **update** (Update an entry)

**Leave disabled:** delete (users shouldn't delete their progress)

### 4. Click "Save" (top right)

## Why This Is Safe

The custom controller (src/api/lesson-progress/controllers/lesson-progress.ts) automatically scopes all queries:

```typescript
// Line 182-184: Auto-scopes to authenticated user
const where = userAttr.isRelation
  ? { [userAttr.key]: user.id }
  : { [userAttr.key]: user.id };
```

Users can ONLY see/modify their own progress records. ✅

## Verify the Fix

```bash
# Check the account page
open http://localhost:3000/en/members/account

# Should see:
# ✅ No 403 errors in console
# ✅ Progress data loads
# ✅ Recent lessons appear
```

## Alternative: API-Only Access

If you want to restrict access to only go through your Next.js API (not direct Strapi calls), you can:
1. Keep these permissions disabled
2. Create a service account JWT in Strapi
3. Use that JWT in your Next.js API routes
4. This adds an extra layer but is more complex

For most use cases, the controller's user-scoping is sufficient security.
