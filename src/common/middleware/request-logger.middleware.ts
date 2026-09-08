import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const message = `${req.method} ${req.originalUrl}`;
    logger.info(message, {
      ip: String(ip),
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent,
    });
  });

  next();
}

export default requestLogger;
