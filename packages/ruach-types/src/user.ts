/**
 * User-related types
 */

export type UserRole = 'authenticated' | 'partner' | 'moderator' | 'admin' | 'super_admin';

export interface User {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  role?: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
}

export interface AuthTokens {
  jwt: string;
  refreshToken: string;
}

export interface UserSession extends User {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
