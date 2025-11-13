# TypeScript Type-Safety Standards

**JoinRuach Codebase - TypeScript Best Practices**

This document outlines the type-safety standards established during the comprehensive TypeScript audit (Sprints 1-3). All new code should follow these patterns to maintain type safety across the codebase.

---

## Table of Contents

1. [General Principles](#general-principles)
2. [Eliminating `any` Types](#eliminating-any-types)
3. [Runtime Validation Patterns](#runtime-validation-patterns)
4. [API Route Type Safety](#api-route-type-safety)
5. [Strapi Integration Patterns](#strapi-integration-patterns)
6. [Database Query Safety](#database-query-safety)
7. [Window Globals & Analytics](#window-globals--analytics)
8. [Error Handling](#error-handling)
9. [Common Patterns & Examples](#common-patterns--examples)

---

## General Principles

### 1. Never Use `any`

**❌ Bad:**
```typescript
function handleData(data: any) {
  return data.value;
}
```

**✅ Good:**
```typescript
function handleData(data: unknown) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data');
  }

  const obj = data as { value?: unknown };
  if (typeof obj.value === 'string') {
    return obj.value;
  }

  throw new Error('Value must be a string');
}
```

### 2. Use `unknown` for External Data

When receiving data from external sources (APIs, user input, etc.), always use `unknown` and validate before use:

```typescript
// API response
const response = await fetch('/api/data');
const data: unknown = await response.json();

// Validate before use
if (isValidData(data)) {
  // Now TypeScript knows the shape
  return data.items;
}
```

### 3. Prefer Type Guards Over Type Assertions

**❌ Bad:**
```typescript
const user = data as User; // Unsafe - no runtime check
```

**✅ Good:**
```typescript
function isUser(data: unknown): data is User {
  if (!data || typeof data !== 'object') return false;
  const u = data as Partial<User>;
  return typeof u.id === 'number' && typeof u.name === 'string';
}

if (isUser(data)) {
  // TypeScript knows data is User
  console.log(data.name);
}
```

---

## Eliminating `any` Types

### Common Replacements

| Instead of | Use | Example |
|------------|-----|---------|
| `any` | `unknown` | External data that needs validation |
| `any[]` | `unknown[]` | Array from external source |
| `Record<string, any>` | `Record<string, unknown>` | Generic object type |
| `(param: any)` | `(param: unknown)` | Function parameter |
| `Promise<any>` | `Promise<unknown>` | Async function return |

### When You Must Be Generic

If you truly need a generic type, use proper TypeScript generics:

**❌ Bad:**
```typescript
function first(arr: any[]): any {
  return arr[0];
}
```

**✅ Good:**
```typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

---

## Runtime Validation Patterns

### Pattern 1: Assertion Functions

For validating request bodies or critical data:

```typescript
interface SignupBody {
  email: string;
  password: string;
}

function assertSignupBody(body: unknown): asserts body is SignupBody {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const b = body as Partial<SignupBody>;

  if (!b.email || typeof b.email !== 'string' || !b.email.includes('@')) {
    throw new Error('Valid email is required');
  }

  if (!b.password || typeof b.password !== 'string' || b.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
}

// Usage
export async function POST(req: NextRequest) {
  const body: unknown = await req.json();

  try {
    assertSignupBody(body);
    // Now TypeScript knows body is SignupBody
    const { email, password } = body;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

### Pattern 2: Type Guards

For checking if data matches a type:

```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function isChatMessage(msg: unknown): msg is ChatMessage {
  if (!msg || typeof msg !== 'object') return false;

  const m = msg as Partial<ChatMessage>;

  return (
    (m.role === 'user' || m.role === 'assistant' || m.role === 'system') &&
    typeof m.content === 'string' &&
    m.content.length > 0
  );
}

// Usage
const messages: unknown[] = await req.json();
const validMessages = messages.filter(isChatMessage);
```

### Pattern 3: Discriminated Unions

For data that can be one of several types:

```typescript
interface MediaResult {
  type: 'media';
  id: string;
  title: string;
  videoUrl: string;
}

interface BlogResult {
  type: 'blog';
  id: string;
  title: string;
  content: string;
}

type SearchResult = MediaResult | BlogResult;

// TypeScript can narrow the type based on discriminant
function handleResult(result: SearchResult) {
  if (result.type === 'media') {
    // TypeScript knows result is MediaResult
    console.log(result.videoUrl);
  } else {
    // TypeScript knows result is BlogResult
    console.log(result.content);
  }
}
```

---

## API Route Type Safety

### Pattern: Complete API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Request body interface
interface CreatePostBody {
  title: string;
  content: string;
  tags?: string[];
}

// Response types
interface SuccessResponse {
  id: number;
  message: string;
}

interface ErrorResponse {
  error: string;
}

// Validation
function assertCreatePostBody(body: unknown): asserts body is CreatePostBody {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const b = body as Partial<CreatePostBody>;

  if (!b.title || typeof b.title !== 'string' || b.title.trim().length === 0) {
    throw new Error('Title is required');
  }

  if (!b.content || typeof b.content !== 'string') {
    throw new Error('Content is required');
  }

  if (b.tags !== undefined && !Array.isArray(b.tags)) {
    throw new Error('Tags must be an array');
  }
}

// Handler with return type annotation
export async function POST(
  req: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  // Parse JSON
  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  // Validate
  try {
    assertCreatePostBody(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    );
  }

  // Use validated data
  const { title, content, tags } = body;

  // ... create post logic ...

  return NextResponse.json({ id: 123, message: 'Post created' });
}
```

---

## Strapi Integration Patterns

### Pattern 1: Define Strapi Entity Types

```typescript
interface StrapiMediaItem {
  id: number;
  attributes: {
    title: string;
    slug: string;
    description?: string | null;
    thumbnail?: {
      data?: {
        attributes?: {
          url?: string;
        } | null;
      } | null;
    } | null;
  };
}
```

### Pattern 2: Type Guards for Strapi Responses

```typescript
function isValidMediaItem(item: unknown): item is StrapiMediaItem {
  if (!item || typeof item !== 'object') return false;

  const i = item as Partial<StrapiMediaItem>;

  return (
    typeof i.id === 'number' &&
    i.attributes !== null &&
    i.attributes !== undefined &&
    typeof i.attributes === 'object' &&
    typeof i.attributes.title === 'string' &&
    typeof i.attributes.slug === 'string'
  );
}
```

### Pattern 3: Use Type Guards with API Responses

```typescript
const response = await getJSON<{ data: unknown[] }>(`/api/media-items?${params}`);
const validItems = (response.data || []).filter(isValidMediaItem);

// Now validItems is StrapiMediaItem[]
for (const item of validItems) {
  console.log(item.attributes.title); // Type-safe!
}
```

### Pattern 4: Type-Safe Array Filtering

```typescript
// Extract speakers with type filtering
const speakers = item.attributes?.speakers?.data
  ?.map((s) => s.attributes?.name)
  .filter((name): name is string => typeof name === 'string') || [];
```

---

## Database Query Safety

### Pattern 1: Define Query Parameter Types

```typescript
type QueryParam = string | number | boolean | null | Date | string[] | number[];

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: QueryParam[]
): Promise<{ rows: T[]; rowCount: number }> {
  // Validate parameters
  if (params) {
    for (const param of params) {
      if (param === undefined) {
        throw new Error('Query parameters cannot be undefined - use null instead');
      }
      // ... additional validation
    }
  }

  const client = getPool();
  const result = await client.query<T>(text, params);

  return {
    rows: result.rows,
    rowCount: result.rowCount || result.rows.length,
  };
}
```

### Pattern 2: Discriminated Union Metadata

```typescript
interface MediaMetadata {
  contentType: 'media';
  title: string;
  speakers?: string[];
  duration?: number;
}

interface LessonMetadata {
  contentType: 'lesson';
  title: string;
  courseSlug: string;
  lessonNumber?: number;
}

type ContentMetadata = MediaMetadata | LessonMetadata;

// Usage in query
const result = await query<{
  content_type: string;
  metadata: ContentMetadata;
}>(sql, params);

// Type assertion when parsing JSON
const metadata = typeof row.metadata === 'string'
  ? JSON.parse(row.metadata) as ContentMetadata
  : row.metadata;
```

---

## Window Globals & Analytics

### Pattern: Consistent Window Interface

Create a single declaration that can be imported everywhere:

```typescript
// In lib/analytics.ts or similar
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
    gtag?: (command: string, action: string, params?: Record<string, string | number>) => void;
  }
}

// Usage - no more (window as any)!
if (typeof window !== "undefined" && window.plausible) {
  window.plausible("Event Name", {
    props: { key: "value" },
  });
}

if (typeof window !== "undefined" && window.gtag) {
  window.gtag("event", "action_name", {
    event_category: "category",
  });
}
```

---

## Error Handling

### ❌ Antipattern: Silent Failures

```typescript
// BAD - swallows errors silently
const data = await fetch('/api/data')
  .then(r => r.json())
  .catch(() => ({}));
```

### ✅ Best Practice: Explicit Error Handling

```typescript
// GOOD - explicit error handling
let data: unknown;
try {
  const response = await fetch('/api/data');
  data = await response.json();
} catch (error) {
  console.error('Failed to fetch data:', error);
  return NextResponse.json(
    { error: 'Failed to fetch data' },
    { status: 500 }
  );
}

// Validate data
if (!isValidData(data)) {
  return NextResponse.json(
    { error: 'Invalid data format' },
    { status: 500 }
  );
}

// Use validated data
return processData(data);
```

---

## Common Patterns & Examples

### JSON Parsing with Validation

```typescript
let json: unknown;
try {
  json = await response.json();
} catch (error) {
  console.error('Failed to parse JSON:', error);
  if (!response.ok) {
    return { error: 'Request failed' };
  }
  return { ok: true }; // Response was OK but no JSON
}

// Validate parsed JSON
if (!isValidResponse(json)) {
  return { error: 'Invalid response format' };
}

// Now use validated json
return processResponse(json);
```

### Type-Safe Event Handlers

```typescript
// Define event types
interface ClickEvent {
  type: 'click';
  elementId: string;
  timestamp: number;
}

interface ScrollEvent {
  type: 'scroll';
  position: number;
  timestamp: number;
}

type AppEvent = ClickEvent | ScrollEvent;

// Type-safe handler
function handleEvent(event: AppEvent) {
  switch (event.type) {
    case 'click':
      console.log('Clicked:', event.elementId);
      break;
    case 'scroll':
      console.log('Scrolled to:', event.position);
      break;
  }
}
```

### Type-Safe Reducer Pattern

```typescript
interface State {
  count: number;
  loading: boolean;
}

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setLoading'; payload: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'decrement':
      return { ...state, count: state.count - 1 };
    case 'setLoading':
      return { ...state, loading: action.payload };
  }
}
```

---

## Summary Checklist

When writing new TypeScript code, ensure:

- [ ] No `any` types used anywhere
- [ ] External data uses `unknown` and is validated
- [ ] Type guards implemented for complex validation
- [ ] API routes have request/response type definitions
- [ ] All functions have return type annotations
- [ ] Error handling is explicit (no `.catch(() => {})`)
- [ ] Database queries use typed parameters
- [ ] Window globals properly declared
- [ ] Discriminated unions used for variant types
- [ ] Arrays filtered with type predicates when needed

---

## Migration Guide

When refactoring existing code with `any` types:

1. **Identify the source**: Is it external data, user input, or API response?
2. **Replace with `unknown`**: Change `any` to `unknown`
3. **Add validation**: Create a type guard or assertion function
4. **Use validated data**: After validation, TypeScript knows the type
5. **Test**: Ensure runtime validation catches invalid data

**Example Migration:**

```typescript
// Before
function handleData(data: any) {
  return data.items.map((item: any) => item.name);
}

// After
interface DataWithItems {
  items: Array<{ name: string }>;
}

function isDataWithItems(data: unknown): data is DataWithItems {
  if (!data || typeof data !== 'object') return false;
  const d = data as Partial<DataWithItems>;
  return Array.isArray(d.items) && d.items.every(
    item => item && typeof item === 'object' && typeof item.name === 'string'
  );
}

function handleData(data: unknown): string[] {
  if (!isDataWithItems(data)) {
    throw new Error('Invalid data format');
  }
  return data.items.map(item => item.name);
}
```

---

## Resources

- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

---

**Last Updated:** November 2025
**Audit Completion:** Sprints 1-3 (16 files, 88+ `any` types eliminated)
