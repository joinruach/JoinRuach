/**
 * Test Data Factories
 *
 * Factory functions for creating mock data for tests
 */

export interface User {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  provider: string;
  role?: {
    id: number;
    name: string;
    type: string;
  };
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  published: boolean;
  lessons?: Lesson[];
  thumbnail?: Media;
}

export interface Lesson {
  id: number;
  title: string;
  slug: string;
  description: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  published: boolean;
}

export interface Media {
  id: number;
  name: string;
  url: string;
  mime: string;
  size: number;
  provider: string;
}

export interface Testimony {
  id: number;
  name: string;
  email: string;
  content: string;
  videoUrl?: string;
  approved: boolean;
  published: boolean;
}

export interface Partner {
  id: number;
  userId: number;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'canceled' | 'past_due';
  tier: 'monthly' | 'yearly';
}

/**
 * User Factory
 */
export const createUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  confirmed: true,
  blocked: false,
  provider: 'local',
  role: {
    id: 1,
    name: 'Authenticated',
    type: 'authenticated',
  },
  ...overrides,
});

/**
 * Course Factory
 */
export const createCourse = (overrides: Partial<Course> = {}): Course => ({
  id: 1,
  title: 'Test Course',
  slug: 'test-course',
  description: 'A test course for automated testing',
  published: true,
  ...overrides,
});

/**
 * Lesson Factory
 */
export const createLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 1,
  title: 'Test Lesson',
  slug: 'test-lesson',
  description: 'A test lesson for automated testing',
  videoUrl: 'https://example.com/video.mp4',
  duration: 600,
  order: 1,
  published: true,
  ...overrides,
});

/**
 * Media Factory
 */
export const createMedia = (overrides: Partial<Media> = {}): Media => ({
  id: 1,
  name: 'test-image.jpg',
  url: 'https://example.com/test-image.jpg',
  mime: 'image/jpeg',
  size: 102400,
  provider: 'cloudflare-r2',
  ...overrides,
});

/**
 * Testimony Factory
 */
export const createTestimony = (overrides: Partial<Testimony> = {}): Testimony => ({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  content: 'This is a test testimony about my experience.',
  approved: false,
  published: false,
  ...overrides,
});

/**
 * Partner Factory
 */
export const createPartner = (overrides: Partial<Partner> = {}): Partner => ({
  id: 1,
  userId: 1,
  stripeCustomerId: 'cus_test123',
  stripeSubscriptionId: 'sub_test123',
  status: 'active',
  tier: 'monthly',
  ...overrides,
});

/**
 * JWT Token Factory
 */
export const createJWT = (userId: number = 1): string => {
  // Simple mock JWT for testing - NOT for production use
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(
    JSON.stringify({
      id: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64');
  const signature = Buffer.from('test-signature').toString('base64');
  return `${header}.${payload}.${signature}`;
};

/**
 * Stripe Webhook Event Factory
 */
export const createStripeWebhookEvent = (
  type: string,
  data: Record<string, unknown> = {}
) => ({
  id: `evt_test_${Math.random().toString(36).substring(7)}`,
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  type,
  data: {
    object: data,
  },
  livemode: false,
});

/**
 * R2 Presigned URL Factory
 */
export const createPresignedUrl = (key: string = 'test-file.jpg'): string => {
  return `https://r2.example.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=3600`;
};

/**
 * API Response Factory
 */
export const createAPIResponse = <T = unknown>(
  data: T,
  meta?: Record<string, unknown>
) => ({
  data,
  meta: meta || {},
});

/**
 * Pagination Meta Factory
 */
export const createPaginationMeta = (
  page: number = 1,
  pageSize: number = 25,
  total: number = 100
) => ({
  pagination: {
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
    total,
  },
});
