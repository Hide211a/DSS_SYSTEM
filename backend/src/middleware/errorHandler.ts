import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Unknown error';
  const isClientError = message.includes('не налаштовано') || message.includes('недоступн');
  res.status(isClientError ? 400 : 500).json({
    error: isClientError ? message : 'Внутрішня помилка сервера',
  });
}
