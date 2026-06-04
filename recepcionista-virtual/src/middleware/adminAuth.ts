import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token || token !== env.adminToken) {
    return res.status(401).json({ error: 'Não autorizado. Token inválido.' });
  }

  next();
}
