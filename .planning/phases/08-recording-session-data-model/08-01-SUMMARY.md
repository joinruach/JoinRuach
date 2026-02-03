---
phase: 08-recording-session-data-model
plan: 01
subsystem: strapi-schemas
requires: []
provides: [recording-session-schema, media-asset-schema, edit-decision-list-schema, render-job-schema]
affects: [09, 10, 11, 12, 13]
tags: [data-model, strapi, multi-camera, v2.0]
tech-stack:
  added: [recording-session content-type, media-asset content-type, edit-decision-list content-type, render-job content-type]
  patterns: [Strapi v5 schema structure, versioned EDL via self-referential relations, BullMQ job tracking]
key-decisions:
  - "recording-session groups 3+ angles with sync offsets stored as JSON"
  - "media-asset tracks original/proxy/mezzanine URLs for multi-resolution workflow"
  - "edit-decision-list supports versioning via parentVersion self-referential relation"
  - "render-job integrates with BullMQ via bullmq_job_id field"
  - "versionHash field enables deterministic rendering"
key-files: [ruach-ministries-backend/src/api/recording-session/content-types/recording-session/schema.json, ruach-ministries-backend/src/api/media-asset/content-types/media-asset/schema.json, ruach-ministries-backend/src/api/edit-decision-list/content-types/edit-decision-list/schema.json, ruach-ministries-backend/src/api/render-job/content-types/render-job/schema.json]
patterns-established:
  - "Multi-camera session data model with sync offset storage"
  - "Versioned EDL workflow with parent/child relations"
  - "Render job tracking with BullMQ integration"
---

# Phase 8 Plan 1: Recording Session Data Model Summary

**Established data foundation for multi-camera video production pipeline with four content types supporting 3+ angles, versioned EDLs, and render orchestration.**

## Accomplishments

- Created recording-session schema: Groups 3+ camera angles, stores sync offsets, tracks workflow state
- Created media-asset schema: Tracks original/proxy/mezzanine URLs for each angle with technical metadata
- Created edit-decision-list schema: Supports versioned EDL workflow with parent/child relations
- Created render-job schema: Integrates with BullMQ job queue for render orchestration
- All schemas follow Strapi v5 patterns with proper relations, indexes, and validation
- TypeScript types regenerated successfully

## Files Created/Modified

- `ruach-ministries-backend/src/api/recording-session/content-types/recording-session/schema.json` - Session grouping and sync data
- `ruach-ministries-backend/src/api/media-asset/content-types/media-asset/schema.json` - Multi-resolution media asset tracking
- `ruach-ministries-backend/src/api/edit-decision-list/content-types/edit-decision-list/schema.json` - Versioned EDL storage
- `ruach-ministries-backend/src/api/render-job/content-types/render-job/schema.json` - Render job queue integration
- TypeScript types regenerated in `types/generated/contentTypes.d.ts`

## Decisions Made

1. **Sync offsets stored as JSON** - `{A: 0, B: 1830, C: -420}` format enables flexible multi-angle sync
2. **Three URL types per asset** - original (raw), proxy (preview), mezzanine (rendering) support efficient workflows
3. **Versioned EDL via self-referential relations** - parentVersion/childVersions enable v1 AI → v2 human → v3 final workflow
4. **BullMQ integration via bullmq_job_id** - Direct link to async job queue for render orchestration
5. **versionHash for deterministic rendering** - SHA256 of edlData ensures reproducible renders

## Issues Encountered

None

## Next Phase Readiness

Phase 9 (Media Ingestion & Sync) can proceed:
- recording-session schema supports sync offset storage (requirement for Phase 9b)
- media-asset schema tracks original/proxy/mezzanine URLs (requirement for Phase 9a)
- Separation of normalization from sync supported by distinct URL fields

Phase 10 (Transcript Integration) can proceed:
- recording-session has oneToOne relation to library-transcription (existing)
- Master transcript can be linked to session via this relation

Phase 11 (AI Edit Decision List) can proceed:
- edit-decision-list schema supports versioned workflow
- edlData JSON field ready for AI-generated cuts/overlays/chapters/shorts

Phase 12 (Remotion Renderer) can proceed:
- render-job schema tracks format (full_16_9, short_9_16, clip_1_1, thumbnail)
- Links to edl for deterministic rendering from EDL + assets + versionHash

Phase 13 (Studio Operator UI) can proceed:
- All schemas have status enumerations for workflow state tracking
- Relations enable full session → assets → EDL → renders query paths
