import { describe, expect, it, vi } from 'vitest';
import { getApiBase } from './apiBase';

describe('getApiBase', () => {
  it('defaults to /api when VITE_API_URL is unset', () => {
    expect(getApiBase()).toBe('/api');
  });

  it('uses VITE_API_URL without trailing slash', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/api/');
    expect(getApiBase()).toBe('https://api.example.com/api');
    vi.unstubAllEnvs();
  });
});
