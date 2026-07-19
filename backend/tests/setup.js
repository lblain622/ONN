// This runs before any test file is loaded, so env vars are available
// when modules execute their top-level guards (e.g. JWT_SECRET check).
process.env.JWT_SECRET = 'test-secret-for-vitest';
process.env.NODE_ENV = 'test';
