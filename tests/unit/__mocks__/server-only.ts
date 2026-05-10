// server-only mock for Vitest
// The real 'server-only' package throws when imported outside Next.js server context.
// This no-op allows server-guarded modules to be unit tested safely.
// DO NOT use this mock outside of tests.
export {}
