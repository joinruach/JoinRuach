/**
 * Strapi-specific types
 */

import { Timestamps, Pagination, Meta } from './common';

export interface StrapiResponse<T> {
  data: T;
  meta?: Meta;
}

export interface StrapiEntity<T = Record<string, any>> extends Timestamps {
  id: number;
  attributes: T;
}

export interface StrapiCollection<T> {
  data: StrapiEntity<T>[];
  meta?: Meta;
}

export interface StrapiSingle<T> {
  data: StrapiEntity<T>;
  meta?: Meta;
}

export interface StrapiMedia {
  id: number;
  name: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  formats?: Record<string, StrapiMediaFormat>;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrapiMediaFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  path?: string;
  url: string;
}

export interface StrapiError {
  status: number;
  name: string;
  message: string;
  details?: Record<string, any>;
}
