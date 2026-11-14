// vite-env.d.ts — Vite environment type definitions (frontend)
// Notes: extend `ImportMetaEnv` with client-side environment variables like `VITE_API_URL`
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
