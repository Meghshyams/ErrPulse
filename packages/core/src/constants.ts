export const DEFAULT_SERVER_PORT = 3800;
export const DEFAULT_DB_DIR = ".errlens";
export const DEFAULT_DB_FILENAME = "errlens.db";
export const DEFAULT_SERVER_URL = `http://localhost:${DEFAULT_SERVER_PORT}`;
export const EVENTS_ENDPOINT = "/api/events";
export const ERRORS_ENDPOINT = "/api/errors";
export const REQUESTS_ENDPOINT = "/api/requests";
export const HEALTH_ENDPOINT = "/api/health";
export const STATS_ENDPOINT = "/api/stats";
export const CORRELATION_HEADER = "x-errlens-correlation-id";
export const PROJECT_HEADER = "x-errlens-project-id";
export const MAX_MESSAGE_LENGTH = 2048;
export const MAX_STACK_FRAMES = 50;
export const BATCH_SIZE = 10;
export const BATCH_INTERVAL_MS = 100;
export const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
];
export const SENSITIVE_FIELDS = [
  "password",
  "passwd",
  "secret",
  "token",
  "apiKey",
  "api_key",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "creditCard",
  "credit_card",
  "ssn",
  "cardNumber",
  "card_number",
  "cvv",
  "cvc",
];
