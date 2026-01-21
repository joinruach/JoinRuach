# Anti-Patterns
**What NOT to do — Load this for code review tasks**

---

## Code Structure

### ❌ Hardcoded Configuration
```ts
const API_URL = "https://api.example.com"; // ❌ Should be env var
```
✅ **Instead:** `const API_URL = process.env.NEXT_PUBLIC_API_URL;`

### ❌ God Objects
```ts
class Application {
  handleAuth() { ... }
  processPayment() { ... }
  sendEmail() { ... }
  generateReport() { ... }
} // ❌ Too many responsibilities
```
✅ **Instead:** Split into `AuthService`, `PaymentService`, etc.

### ❌ Deep Nesting
```ts
if (user) {
  if (user.isActive) {
    if (user.subscription) {
      if (user.subscription.isPaid) { ... } // ❌ Pyramid of doom
```
✅ **Instead:** Early returns + guard clauses

### ❌ Magic Numbers
```ts
if (status === 3) { ... } // ❌ What is 3?
```
✅ **Instead:** `if (status === OrderStatus.Shipped) { ... }`

---

## Next.js Specific

### ❌ Client-Side Data Fetching in Server Components
```tsx
'use client'
export default function Page() {
  const [data, setData] = useState();
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData); // ❌
  }, []);
}
```
✅ **Instead:** Server Component with direct fetch

### ❌ Mixing `await` with `.then()`
```ts
const data = await fetch(url).then(r => r.json()); // ❌ Pick one style
```
✅ **Instead:** `const res = await fetch(url); const data = await res.json();`

### ❌ Not Using `next/image`
```tsx
<img src="/photo.jpg" /> // ❌ No optimization
```
✅ **Instead:** `<Image src="/photo.jpg" width={500} height={300} />`

### ❌ Loading Everything at Once
```tsx
import HugeComponent from './HugeComponent'; // ❌ Always loaded
```
✅ **Instead:** `const HugeComponent = dynamic(() => import('./HugeComponent'));`

---

## Strapi Specific

### ❌ Direct `entityService` in Routes
```ts
async find(ctx) {
  return strapi.entityService.findMany('api::post.post'); // ❌
}
```
✅ **Instead:** `return strapi.plugin('kie-core').service('post').find();`

### ❌ Mutating Request Body
```ts
async create(ctx) {
  ctx.request.body.userId = ctx.state.user.id; // ❌ Mutates input
}
```
✅ **Instead:** Create new object: `const data = { ...ctx.request.body, userId }`

### ❌ Missing Populate
```ts
const posts = await strapi.entityService.findMany('api::post.post');
// ❌ Relations not loaded, causes N+1
```
✅ **Instead:** `findMany('api::post.post', { populate: ['author'] })`

### ❌ No Transaction for Multi-Step
```ts
await strapi.entityService.create('api::order.order', { data });
await strapi.entityService.update('api::inventory.inventory', { ... });
// ❌ Second call might fail, leaving inconsistent state
```
✅ **Instead:** Wrap in `strapi.db.transaction()`

---

## Redis Specific

### ❌ Unstructured Keys
```ts
redis.set('user123', data); // ❌ No namespace
```
✅ **Instead:** `redis.set('prod:user:123', data)`

### ❌ Large Payloads
```ts
redis.set('cache', JSON.stringify(hugeObject)); // ❌ > 1 MB
```
✅ **Instead:** Store in DB, cache ID only

### ❌ Sequential Commands
```ts
await redis.get('key1');
await redis.get('key2');
await redis.get('key3'); // ❌ 3 round trips
```
✅ **Instead:** `const [v1, v2, v3] = await redis.mget('key1', 'key2', 'key3');`

### ❌ No Expiry
```ts
redis.set('temp-data', value); // ❌ Lives forever
```
✅ **Instead:** `redis.setex('temp-data', 300, value)` (5 min)

---

## TypeScript Specific

### ❌ Using `any`
```ts
function process(data: any) { ... } // ❌ Defeats TypeScript
```
✅ **Instead:** `function process<T>(data: T) { ... }` or proper type

### ❌ Type Assertions Without Validation
```ts
const user = data as User; // ❌ No runtime check
```
✅ **Instead:** Use Zod schema: `const user = userSchema.parse(data);`

### ❌ Optional Properties Everywhere
```ts
interface User {
  id?: string;
  name?: string;
  email?: string; // ❌ Everything optional
}
```
✅ **Instead:** Required by default, `Partial<User>` when needed

### ❌ Ignoring Errors
```ts
try {
  await riskyOperation();
} catch {} // ❌ Silent failure
```
✅ **Instead:** Log error + return error response

---

## Database Specific

### ❌ N+1 Queries
```ts
const posts = await db.post.findMany();
for (const post of posts) {
  post.author = await db.user.findUnique({ where: { id: post.authorId } }); // ❌
}
```
✅ **Instead:** `db.post.findMany({ include: { author: true } })`

### ❌ Returning All Records
```ts
const users = await db.user.findMany(); // ❌ Could be 100k records
```
✅ **Instead:** `db.user.findMany({ take: 100 })`

### ❌ String Concatenation SQL
```ts
db.query(`SELECT * FROM users WHERE id = ${userId}`); // ❌ SQL injection
```
✅ **Instead:** `db.query('SELECT * FROM users WHERE id = ?', [userId])`

### ❌ No Indexes
```sql
SELECT * FROM orders WHERE user_id = 123; -- ❌ Full table scan
```
✅ **Instead:** `CREATE INDEX idx_orders_user_id ON orders(user_id);`

---

## Security Specific

### ❌ Secrets in Code
```ts
const API_KEY = "sk_live_abc123"; // ❌ Committed to git
```
✅ **Instead:** `const API_KEY = process.env.API_KEY;`

### ❌ Logging Sensitive Data
```ts
console.log('User data:', { password: user.password }); // ❌
```
✅ **Instead:** Never log passwords/tokens/PII

### ❌ Trusting Client Input
```ts
const userId = ctx.request.body.userId; // ❌ Client could send any ID
```
✅ **Instead:** `const userId = ctx.state.user.id;`

### ❌ No Rate Limiting
```ts
app.post('/api/login', loginHandler); // ❌ Brute force vulnerable
```
✅ **Instead:** Add rate limiter middleware

---

## Performance Specific

### ❌ Loading All Data Upfront
```tsx
const [allUsers, setAllUsers] = useState([]);
useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(setAllUsers); // ❌ 10k users
}, []);
```
✅ **Instead:** Paginate + virtual scrolling

### ❌ Blocking Operations in Request Handler
```ts
app.post('/upload', async (req, res) => {
  await processLargeFile(req.file); // ❌ Blocks for 5 minutes
  res.json({ success: true });
});
```
✅ **Instead:** Queue job + return immediately

### ❌ No Caching
```ts
app.get('/expensive-data', async (req, res) => {
  const data = await runExpensiveQuery(); // ❌ Every request
  res.json(data);
});
```
✅ **Instead:** Cache with Redis

### ❌ Loading Full Images
```tsx
<img src="/4k-photo.jpg" /> // ❌ 10 MB load
```
✅ **Instead:** `<Image src="/4k-photo.jpg" width={800} height={600} />`

---

## Testing Specific

### ❌ Testing Implementation Details
```ts
test('increments counter', () => {
  const { container } = render(<Counter />);
  const button = container.querySelector('.increment-btn'); // ❌ Relies on class
});
```
✅ **Instead:** Test user-visible behavior

### ❌ No Test Isolation
```ts
let userId;
test('creates user', async () => {
  userId = await createUser(); // ❌ Shared state
});
test('deletes user', async () => {
  await deleteUser(userId);
});
```
✅ **Instead:** Each test creates its own data

### ❌ Testing Framework Internals
```ts
test('React renders correctly', () => {
  // ❌ Testing React, not your code
});
```
✅ **Instead:** Test your business logic

---

## Commit Specific

### ❌ Vague Messages
```
git commit -m "fix stuff" // ❌
git commit -m "update code" // ❌
git commit -m "wip" // ❌
```
✅ **Instead:** `fix(auth): resolve JWT expiry edge case (#123)`

### ❌ Giant Commits
```
git commit -m "feat: complete rewrite"
// ❌ 50 files changed, 10k lines
```
✅ **Instead:** Break into logical chunks

---

## General Antipatterns

### ❌ Premature Optimization
```ts
// ❌ Spent 2 days optimizing function called once per day
```
✅ **Instead:** Measure first, optimize hot paths only

### ❌ Over-Engineering
```ts
// ❌ Created abstract factory for 2 objects
```
✅ **Instead:** Simple solutions first, refactor when needed

### ❌ Copying Without Understanding
```ts
// ❌ Pasted Stack Overflow code without reading
```
✅ **Instead:** Understand what it does before using

### ❌ Not Reading Error Messages
```
// ❌ "It doesn't work" (didn't check console)
```
✅ **Instead:** Read full error + stack trace

---

**Use this file for code review with `Q check`**
