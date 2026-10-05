import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { join } from 'path';
import requestLogger from './common/middleware/request-logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.use((request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data:; font-src 'self' data: https://cdnjs.cloudflare.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
    );
    if (process.env.NODE_ENV === 'production') {
      response.setHeader('Strict-Transport-Security', 'max-age=31536000');
    }
    next();
  });

  app.enableCors({
    origin: '*',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  // Request logging middleware (logs are written to LOG_FILE_PATH or ./logs/access.log)
  app.use(requestLogger);
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const config = new DocumentBuilder()
    .setTitle('Gate QRIS API')
    .setDescription('Gate QRIS API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const swaggerCustomOptions: SwaggerCustomOptions = {
    customSiteTitle: 'Gate QRIS API Docs',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.3.2/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.3.2/swagger-ui-standalone-preset.js',
    ],
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.3.2/swagger-ui.css',
  };

  SwaggerModule.setup('api', app, document, swaggerCustomOptions);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
