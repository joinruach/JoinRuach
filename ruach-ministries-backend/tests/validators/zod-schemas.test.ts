/**
 * Regression tests for Zod validator schemas.
 *
 * Tests that each schema rejects known-bad payloads and accepts known-good ones.
 * These are security tripwires — if a schema silently starts accepting garbage,
 * the corresponding controller is exposed.
 */

import { TriggerRenderRequestSchema } from '../../src/api/render-job/validators/render-job-validators';
import { EmitEventRequestSchema } from '../../src/api/formation-engine/validators/formation-validators';
import { QueueTranscodeRequestSchema, QuickQueueRequestSchema } from '../../src/api/media-transcode/validators/transcode-validators';
import { UpdateEDLRequestSchema, UpdateChaptersRequestSchema } from '../../src/api/recording-session/validators/edl-validators';

// ─── Render Job ───────────────────────────────

describe('TriggerRenderRequestSchema', () => {
  it('accepts valid payload', () => {
    const result = TriggerRenderRequestSchema.safeParse({
      sessionId: 'abc-123',
      format: 'full_16_9',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing sessionId', () => {
    const result = TriggerRenderRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty sessionId', () => {
    const result = TriggerRenderRequestSchema.safeParse({ sessionId: '' });
    expect(result.success).toBe(false);
  });
});

// ─── Formation ────────────────────────────────

describe('EmitEventRequestSchema', () => {
  const validPayload = {
    eventType: 'content_viewed',
    eventData: { contentId: '123' },
    userId: 'user-1',
  };

  it('accepts valid payload with userId', () => {
    const result = EmitEventRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('accepts valid payload with anonymousUserId', () => {
    const result = EmitEventRequestSchema.safeParse({
      eventType: 'prayer_logged',
      eventData: { duration: 10 },
      anonymousUserId: 'anon-abc',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid eventType', () => {
    const result = EmitEventRequestSchema.safeParse({
      ...validPayload,
      eventType: 'DROP_TABLE_USERS',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing both userId and anonymousUserId', () => {
    const result = EmitEventRequestSchema.safeParse({
      eventType: 'content_viewed',
      eventData: { contentId: '123' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty eventData', () => {
    const result = EmitEventRequestSchema.safeParse({
      eventType: 'content_viewed',
      eventData: {},
      userId: 'user-1',
    });
    expect(result.success).toBe(false);
  });
});

// ─── Transcode ────────────────────────────────

describe('QueueTranscodeRequestSchema', () => {
  const validPayload = {
    mediaItemId: 42,
    sourceFileUrl: 'https://r2.example.com/video.mp4',
    sourceFileName: 'video.mp4',
    mediaType: 'video' as const,
    jobType: 'transcode' as const,
  };

  it('accepts valid payload', () => {
    const result = QueueTranscodeRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects non-URL sourceFileUrl', () => {
    const result = QueueTranscodeRequestSchema.safeParse({
      ...validPayload,
      sourceFileUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative mediaItemId', () => {
    const result = QueueTranscodeRequestSchema.safeParse({
      ...validPayload,
      mediaItemId: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid jobType', () => {
    const result = QueueTranscodeRequestSchema.safeParse({
      ...validPayload,
      jobType: 'rm -rf /',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid mediaType', () => {
    const result = QueueTranscodeRequestSchema.safeParse({
      ...validPayload,
      mediaType: 'executable',
    });
    expect(result.success).toBe(false);
  });
});

describe('QuickQueueRequestSchema', () => {
  it('accepts valid payload', () => {
    const result = QuickQueueRequestSchema.safeParse({
      mediaItemId: 1,
      sourceFileUrl: 'https://cdn.example.com/file.mov',
      sourceFileName: 'file.mov',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing sourceFileName', () => {
    const result = QuickQueueRequestSchema.safeParse({
      mediaItemId: 1,
      sourceFileUrl: 'https://cdn.example.com/file.mov',
    });
    expect(result.success).toBe(false);
  });
});

// ─── EDL ──────────────────────────────────────

describe('UpdateEDLRequestSchema', () => {
  it('accepts valid cuts', () => {
    const result = UpdateEDLRequestSchema.safeParse({
      cuts: [
        { cameraId: 'cam1', startTime: 0, endTime: 10 },
        { cameraId: 'cam2', startTime: 10, endTime: 20 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty cuts array', () => {
    const result = UpdateEDLRequestSchema.safeParse({ cuts: [] });
    expect(result.success).toBe(false);
  });

  it('rejects cut where endTime <= startTime', () => {
    const result = UpdateEDLRequestSchema.safeParse({
      cuts: [{ cameraId: 'cam1', startTime: 10, endTime: 5 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects cut with negative startTime', () => {
    const result = UpdateEDLRequestSchema.safeParse({
      cuts: [{ cameraId: 'cam1', startTime: -1, endTime: 10 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects cut with confidence > 1', () => {
    const result = UpdateEDLRequestSchema.safeParse({
      cuts: [
        { cameraId: 'cam1', startTime: 0, endTime: 10, confidence: 1.5 },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateChaptersRequestSchema', () => {
  it('accepts valid chapters', () => {
    const result = UpdateChaptersRequestSchema.safeParse({
      chapters: [
        { title: 'Introduction', startTime: 0 },
        { title: 'Main Body', startTime: 120, endTime: 600 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty chapters array', () => {
    const result = UpdateChaptersRequestSchema.safeParse({ chapters: [] });
    expect(result.success).toBe(false);
  });

  it('rejects chapter with empty title', () => {
    const result = UpdateChaptersRequestSchema.safeParse({
      chapters: [{ title: '', startTime: 0 }],
    });
    expect(result.success).toBe(false);
  });
});
