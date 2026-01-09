import { serializeBigInt } from '@/utils/bigintSerializer';
import { Request, Response, NextFunction } from 'express';

export function serializeBigIntMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = (body: any) => {
    const safeBody = serializeBigInt(body);
    return originalJson(safeBody);
  };

  next();
}
