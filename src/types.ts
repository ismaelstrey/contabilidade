import type { Context } from "hono";

// Tipos de usuário autenticado
export interface AuthenticatedUser {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  active: boolean;
}

// Extensão do Request para incluir dados do usuário
declare global {
  interface Request {
    user?: AuthenticatedUser | null;
  }
}

export type AppContext = Context<{ Bindings: Env }>;
export type HandleArgs = [AppContext];

// Tipos para middleware de autenticação
export interface AuthMiddlewareContext {
  user?: AuthenticatedUser | null;
}

// Tipos para respostas da API
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  code?: string;
}

// Tipos para paginação
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
