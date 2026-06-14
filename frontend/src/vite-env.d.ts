/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Production API URL, e.g. https://your-app.up.railway.app/api */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
