import path from 'path';
import fs from 'fs';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFilePath = process.env.LOG_FILE_PATH || path.join(process.cwd(), 'logs', 'access.log');
const logDir = path.dirname(logFilePath) || path.join(process.cwd(), 'logs');

try {
  fs.mkdirSync(logDir, { recursive: true });
} catch (e) {
  // ignore
}

const rotateTransport = new DailyRotateFile({
  dirname: logDir,
  filename: 'access-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} ${level.toUpperCase()} ${message} ${metaStr}`.trim();
    })
  ),
  transports: [rotateTransport, new transports.Console({ level: 'debug' })],
});

export default logger;
