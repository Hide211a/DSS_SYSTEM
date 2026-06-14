/** API base URL. Local/Docker: `/api`. Vercel + Railway: set VITE_API_URL at build time. */
export function getApiBase(): string {
  const configured = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
  return configured || '/api';
}
