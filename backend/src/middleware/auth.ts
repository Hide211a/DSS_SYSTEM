import type { Request, Response, NextFunction } from 'express';
import {
  decodeToken,
  getBearerToken,
  getTokenPayloadFromHeader,
  type TokenPayload,
} from '../services/auth.js';

declare global {
  namespace Express {
    interface Request {
      auth?: TokenPayload;
      customerId?: string;
    }
  }
}

function unauthorized(res: Response, message: string) {
  res.status(401).json({ error: message });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const payload = getTokenPayloadFromHeader(req.headers.authorization);
  if (!payload || payload.role !== 'admin') {
    unauthorized(res, 'Потрібна авторизація адміністратора');
    return;
  }
  req.auth = payload;
  next();
}

export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  const payload = getTokenPayloadFromHeader(req.headers.authorization);
  if (!payload || payload.role !== 'customer') {
    unauthorized(res, 'Потрібна авторизація клієнта');
    return;
  }
  req.auth = payload;
  req.customerId = payload.sub;
  next();
}

export function optionalCustomer(req: Request, _res: Response, next: NextFunction) {
  const payload = getTokenPayloadFromHeader(req.headers.authorization);
  if (payload?.role === 'customer') {
    req.auth = payload;
    req.customerId = payload.sub;
  }
  next();
}

/** @deprecated use requireAdmin */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  requireAdmin(req, res, next);
}

export function getOptionalCustomerId(req: Request): string | null {
  const token = getBearerToken(req.headers.authorization);
  if (!token) return null;
  const payload = decodeToken(token);
  return payload?.role === 'customer' ? payload.sub : null;
}
