import { BadRequestException, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const ensureDirExists = (folder: string) => {
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }
};

export function UploadImageInterceptor(folderName: string = '') {
  const folderPath = `./uploads/${folderName}`;

  ensureDirExists(folderPath);

  return UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, folderPath);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  );
}

export function UploadImagesInterceptor(folderName: string, maxCount = 3) {
  const folderPath = `./uploads/${folderName}`;
  ensureDirExists(folderPath);

  return UseInterceptors(
    FilesInterceptor('files', maxCount, {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, folderPath),
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  );
}

export function UploadPdfInterceptor(
  folderName: string = 'pdfs',
  maxSizeBytes = 10 * 1024 * 1024,
) {
  const folderPath = `./uploads/${folderName}`;
  ensureDirExists(folderPath);

  return UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, folderPath),
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname) || '.pdf';
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(
            new BadRequestException('Only PDF files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: maxSizeBytes,
      },
    }),
  );
}
