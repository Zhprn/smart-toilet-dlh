import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

const DEFAULT_LOG_PATH = process.env.LOG_FILE_PATH || path.join(process.cwd(), 'logs', 'access.log');

function ensureLogDir(logFilePath: string) {
  const dir = path.dirname(logFilePath);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    // ignore
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const logFile = DEFAULT_LOG_PATH;
  ensureLogDir(logFile);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const now = new Date().toISOString();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const logLine = `${now} | ${String(ip)} | ${req.method} ${req.originalUrl} | ${res.statusCode} | ${duration}ms | ${userAgent}\n`;
    try {
      fs.appendFile(logFile, logLine, (err) => {
        // swallow write errors
      });
    } catch (e) {
      // no-op
    }
  });

  next();
}

export default requestLogger;
