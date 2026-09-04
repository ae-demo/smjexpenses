// Typed read of platform-injected runtime config. The platform mounts
// /env-config.js into the served root at request time; it populates
// window._env_ before the bundle evaluates (see index.html). Never build-time
// (no import.meta.env, no .env files) — see react-webapp skill.
type Env = {
  // user-auth (Thunder SSO) platform-resource dependency.
  USER_AUTH_CLIENT_ID: string;
  USER_AUTH_ISSUER: string;
  USER_AUTH_JWKS_URL: string;
  USER_AUTH_SCOPES: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
