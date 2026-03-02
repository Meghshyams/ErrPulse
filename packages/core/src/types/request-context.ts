export interface RequestContext {
  method?: string;
  url?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  ip?: string;
  userAgent?: string;
  duration?: number;
}
