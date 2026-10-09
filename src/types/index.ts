// Mirrors the PostPrep backend DTOs.

export type Role = 'USER' | 'ADMIN';
export type ArticleStatus = 'PROCESSING' | 'PROCESSED' | 'INTERRUPTED';

/** Client-side session. The backend has no "who am I" endpoint, so this is assembled at login. */
export interface User {
  email: string | null;
  role: Role;
}

export interface AppUserDTO {
  id: string;
  username: string;
  email: string;
  role: Role;
}

/** LiteArticleDTO: used by every list endpoint. */
export interface LiteArticle {
  id: string;
  title: string | null;
  owner: string;
  status: ArticleStatus;
}

export interface OutputJson {
  summary: string | null;
  categories: string[] | null;
  seoTitle: string | null;
  confidenceScore: number | null;
  keywords: string[] | null;
}

/** ArticleDTO: returned by GET /article/{id} and the upload endpoints. */
export interface Article {
  id: string;
  title: string | null;
  language: string | null;
  owner: string;
  status: ArticleStatus;
  outputJson: OutputJson | null;
  createdAt: string | null;
}

export interface ChartDataDTO {
  label: string;
  value: number;
}

export interface GlobalStats {
  articles: number;
  users: number;
}
