import crypto from 'crypto';

const ADMIN_USER = process.env.ADMIN_USER ?? 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';
const JWT_SECRET = process.env.JWT_SECRET ?? 'stockwise-diploma-secret-change-in-production';
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

export type AuthRole = 'admin' | 'customer';

export interface TokenPayload {
  sub: string;
  role: AuthRole;
  exp: number;
}

function sign(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function decodeToken(token: string): TokenPayload | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload;
    if (!payload.sub || payload.exp <= Date.now()) return null;
    if (!payload.role) payload.role = 'admin';
    return payload;
  } catch {
    return null;
  }
}

export function verifyToken(token: string): boolean {
  return decodeToken(token) !== null;
}

export function createToken(sub: string, role: AuthRole): string {
  return sign({
    sub,
    role,
    exp: Date.now() + TOKEN_TTL_MS,
  });
}

export function adminLogin(username: string, password: string): string | null {
  if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) return null;
  return createToken(username, 'admin');
}

/** @deprecated use adminLogin */
export function login(username: string, password: string): string | null {
  return adminLogin(username, password);
}

export function getBearerToken(authHeader?: string): string | null {
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

export function getTokenPayloadFromHeader(authHeader?: string): TokenPayload | null {
  const token = getBearerToken(authHeader);
  return token ? decodeToken(token) : null;
}
