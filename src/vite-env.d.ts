/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADZUNA_APP_ID: string
  readonly VITE_ADZUNA_APP_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
