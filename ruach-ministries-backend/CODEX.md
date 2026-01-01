# CODEX — Strapi Backend

## Authority
- Governs: Strapi v5 backend (`/ruach-ministries-backend`)
- Subordinate to: /CODEX.md (root), /CLAUDE.md (project instructions)
- Conflicts resolved in favor of root governance
- Scope: Content types, services, controllers, lifecycles, plugins, routes

## Purpose
Enforces schema-driven development for Strapi v5 backend. Schemas are authoritative. Runtime must match schema or fail loudly.

## Allowed
- Access services via `strapi.plugin('name').service('entity')`
- Use `ctx.state.user` for authentication
- Populate relations explicitly: `populate: ['field']`
- Use `afterCreate`, `beforeUpdate` hooks for side effects
- Wrap multi-step writes in transactions
- Validate payloads against schema before POST/PUT
- Reject unknown keys explicitly
- Exit with actionable error messages

## Forbidden
- MUST NOT use `entityService` directly in routes (use services)
- MUST NOT use `ctx.request.body.user` for auth (use `ctx.state.user`)
- MUST NOT mutate `ctx.request.body`
- MUST NOT guess content-type fields
- MUST NOT allow unknown keys in payloads
- MUST NOT mismatch relation shapes vs schema
- MUST NOT skip enum validation against schema.json
- MUST NOT auto-correct schema drift
- MUST NOT expose raw database errors to client
- MUST NOT skip transaction for multi-step writes
- MUST NOT populate relations without explicit field list

## Required Patterns

### Schema Authority (ABSOLUTE)
- `schema.json` files are source of truth
- ALL payload keys MUST exist in schema
- ALL enum values MUST match schema exactly
- ALL relations MUST match schema shape (`oneToMany`, `manyToOne`, etc.)
- If schema and runtime disagree → STOP immediately, surface drift to user

### Service Access Pattern (MANDATORY)
```typescript
// CORRECT
const result = await strapi
  .plugin('kie-core')
  .service('entity')
  .find({ ... });

// FORBIDDEN
const result = await strapi.entityService.findMany('api::item.item', { ... });
```

### Authentication Pattern (MANDATORY)
```typescript
// CORRECT
const user = ctx.state.user;
if (!user) {
  return ctx.unauthorized('Not authenticated');
}

// FORBIDDEN
const userId = ctx.request.body.user;
```

### Payload Validation Pattern (MANDATORY)
```typescript
// Before any create/update
const schema = strapi.contentType('api::item.item');
const allowedKeys = Object.keys(schema.attributes);
const payloadKeys = Object.keys(ctx.request.body.data);

const unknownKeys = payloadKeys.filter(k => !allowedKeys.includes(k));
if (unknownKeys.length > 0) {
  return ctx.badRequest(`Unknown fields: ${unknownKeys.join(', ')}`);
}
```

### Relation Population Pattern (MANDATORY)
```typescript
// CORRECT - explicit fields
const items = await strapi.entityService.findMany('api::item.item', {
  populate: ['author', 'tags', 'category']
});

// FORBIDDEN - implicit wildcard
const items = await strapi.entityService.findMany('api::item.item', {
  populate: '*'
});
```

### Transaction Pattern (REQUIRED for multi-step writes)
```typescript
await strapi.db.transaction(async (trx) => {
  const item = await strapi.entityService.create('api::item.item', {
    data: itemData,
  }, { transacting: trx });

  await strapi.entityService.update('api::log.log', logId, {
    data: { itemId: item.id },
  }, { transacting: trx });
});
```

### Error Response Pattern (MANDATORY)
```typescript
// CORRECT - structured, no DB details
return ctx.badRequest('Invalid item ID', {
  code: 'INVALID_ID',
  details: { provided: itemId, expected: 'positive integer' }
});

// FORBIDDEN - raw DB error
return ctx.internalServerError(dbError.message);
```

## Execution Checklist

### When Schema Validation Fails
1. READ error verbatim (field names, expected vs actual)
2. INSPECT schema.json for relevant content-type
3. IDENTIFY mismatch (missing field, wrong type, unknown key)
4. If runtime data is wrong → fix runtime to match schema
5. If schema is outdated → STOP, request human schema update
6. RE-RUN operation
7. VERIFY validation passes

### When Service Call Fails
1. READ error verbatim
2. INSPECT service implementation
3. VERIFY service accessed via `strapi.plugin()` or `strapi.service()`
4. VERIFY relation population is explicit
5. VERIFY transaction wraps multi-step writes
6. APPLY minimum fix
7. RE-RUN operation
8. VERIFY success

### When Lifecycle Hook Triggers
1. IDENTIFY hook type (`beforeCreate`, `afterUpdate`, etc.)
2. VERIFY hook does NOT mutate `event.params.data` directly
3. VERIFY side effects are idempotent or transaction-wrapped
4. VERIFY errors are thrown, not swallowed
5. If modifying data → use proper mutation pattern
6. RE-RUN triggering operation
7. VERIFY hook executes correctly

### Before Modifying Content-Type Schema
1. STOP - schema changes require human approval
2. Document requested change and reason
3. Wait for approval
4. After approval: update schema.json
5. Run `pnpm develop` to apply migration
6. Update affected services/controllers
7. Verify no breaking changes to frontend

## Change Rules

### Human Approval Required
- Content-type schema modifications
- Adding new content-types
- Changing relation types
- Adding/removing plugins
- Modifying lifecycle hooks behavior
- Database migration files
- Strapi configuration changes

### AI Auto-Modification Allowed
- Fixing service access patterns (entityService → service wrapper)
- Adding payload validation against existing schema
- Correcting relation population to be explicit
- Adding transactions to multi-step writes
- Fixing authentication to use `ctx.state.user`
- Improving error messages (hiding DB details)

### Rollback Requirements
- If schema drift detected → STOP, do not auto-correct
- If migration fails → STOP, do not retry without approval
- If lifecycle hook breaks → revert hook, investigate separately

## Failure Modes

### Common Mistakes
1. **Schema Drift**: Runtime expects fields not in schema
   - **Detection**: Validation errors, unexpected undefined values
   - **Recovery**: STOP immediately, compare runtime vs schema, surface to user

2. **Direct entityService Usage**: Routes call entityService directly
   - **Detection**: Code pattern `strapi.entityService` in controllers
   - **Recovery**: Replace with service wrapper: `strapi.service('entity')`

3. **Implicit Population**: Using `populate: '*'`
   - **Detection**: Code pattern `populate: '*'` or missing populate
   - **Recovery**: Replace with explicit array: `populate: ['field1', 'field2']`

4. **Auth from Body**: Using `ctx.request.body.user`
   - **Detection**: Code pattern accessing user from body
   - **Recovery**: Replace with `ctx.state.user`, add auth check

5. **Missing Transactions**: Multi-step writes without transaction
   - **Detection**: Partial data on error, orphaned records
   - **Recovery**: Wrap in `strapi.db.transaction()`

6. **Unknown Keys Accepted**: No validation of payload keys
   - **Detection**: Extra fields silently ignored or cause errors
   - **Recovery**: Add key validation against schema before operation

7. **Raw DB Errors Exposed**: Database errors sent to client
   - **Detection**: Stack traces or SQL in API responses
   - **Recovery**: Catch DB errors, return structured error with code

### Universal Recovery Pattern
1. STOP current action
2. READ error and identify error source (schema, service, validation)
3. IDENTIFY root cause:
   - Schema drift → STOP, surface to user
   - Pattern violation → fix pattern per Required Patterns
   - Missing validation → add validation per schema
4. APPLY minimum fix following patterns above
5. RE-RUN operation
6. VERIFY error resolved
7. If schema issue → STOP, do not proceed without approval

## Validation Commands

All changes MUST pass:
```bash
# Backend must start without errors
cd ruach-ministries-backend
pnpm develop

# Typecheck must pass
pnpm typecheck

# If service/controller changed, test the route
curl http://localhost:1337/api/ROUTE -H "Authorization: Bearer TOKEN"
```

## Done Definition

A Strapi backend task is COMPLETE only when ALL conditions met:
- [ ] Schema and runtime are aligned (no drift)
- [ ] Service access follows pattern (`strapi.service()`)
- [ ] Authentication uses `ctx.state.user`
- [ ] Payload validation against schema present
- [ ] Relations populated explicitly
- [ ] Multi-step writes wrapped in transactions
- [ ] Error responses structured (no raw DB errors)
- [ ] `pnpm develop` starts without errors
- [ ] `pnpm typecheck` passes
- [ ] Route tested successfully (if applicable)
- [ ] No unrelated files changed

Partial success MUST be declared as partial with specific blockers identified.

## Cross-References

### Root CODEX
- Follows root Operator Mode rules: /CODEX.md#operator-mode
- Follows root Scripting Rules: /CODEX.md#scripting-rules-tsx-node
- Follows root Path Handling Rules: /CODEX.md#path-handling-rules

### CLAUDE.md Framework Rules
- Strapi v5 patterns: /CLAUDE.md#strapi-v5
- Error handling: /CLAUDE.md#error-handling
- Security: /CLAUDE.md#security

## Operating Principle

**Schemas are law.**
**Runtime obeys schema or fails.**
**Drift is escalated, not corrected.**
