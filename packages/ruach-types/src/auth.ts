/**
 * Authentication and session types
 * Provides type-safe auth state management
 */

import type { UserRole } from './user';

export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

export interface BaseUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthenticatedUser extends BaseUser {
  strapiJwt: string;
  strapiUserId: number;
  role: UserRole;
  membershipStatus?: MembershipStatus;
}

export interface UnauthenticatedSession {
  status: 'unauthenticated';
  user: null;
}

export interface LoadingSession {
  status: 'loading';
  user: null;
}

export interface AuthenticatedSession {
  status: 'authenticated';
  user: AuthenticatedUser;
  expires: string;
  error?: 'RefreshAccessTokenError' | 'IdleTimeout';
  lastActivity?: number;
}

export type Session =
  | UnauthenticatedSession
  | LoadingSession
  | AuthenticatedSession;

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  strapiJwt: string;
  accessTokenExpires: number;
  lastActivity: number;
  error?: 'RefreshAccessTokenError' | 'IdleTimeout';
}

export type MembershipStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export const ACTIVE_MEMBERSHIP_STATUSES: ReadonlySet<MembershipStatus> = new Set([
  'trialing',
  'active',
  'past_due',
  'paused',
]);

export function isMembershipActive(status: MembershipStatus | undefined | null): boolean {
  if (!status) return false;
  return ACTIVE_MEMBERSHIP_STATUSES.has(status);
}

export const MODERATOR_ROLES: ReadonlySet<UserRole> = new Set([
  'moderator',
  'admin',
  'super_admin',
]);

export function isModerator(role: UserRole | undefined | null): boolean {
  if (!role) return false;
  return MODERATOR_ROLES.has(role);
}
