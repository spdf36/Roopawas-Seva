/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Address of the Roopawas Seva API. When unset, the website uses its built-in mock (sample data in the browser). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
