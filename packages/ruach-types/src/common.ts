/**
 * Common utility types
 */

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type ID = string | number;

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface Meta {
  pagination?: Pagination;
}

export interface SEO {
  metaTitle?: string;
  metaDescription?: string;
  metaImage?: any;
  keywords?: string;
  canonicalURL?: string;
}

export type Status = 'draft' | 'published' | 'archived';

export interface Slug {
  slug: string;
}
