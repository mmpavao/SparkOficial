/**
 * Centralized type definitions for better type safety
 */

export type UserRole = 'super_admin' | 'admin' | 'importer' | 'inactive';

export type CreditStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled';

export type ImportStatus = 'planning' | 'ordered' | 'in_transit' | 'customs' | 'delivered' | 'cancelled';

export type Currency = 'USD' | 'EUR' | 'CNY' | 'BRL';

export interface MetricsData {
  totalUsers: number;
  totalCreditRequested: number;
  totalCreditApproved: number;
  usedCredit: number;
  availableCredit: number;
  totalImports: number;
  activeImports: number;
  completedImports: number;
  totalImportValue: number;
  utilizationRate: number;
  totalSuppliers: number;
  totalCreditApplications: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// Error types for better error handling
export type ApiErrorType = 'validation' | 'authentication' | 'authorization' | 'not_found' | 'server_error';

export interface ApiError extends Error {
  type: ApiErrorType;
  statusCode: number;
  details?: Record<string, any>;
}