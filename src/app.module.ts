import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { QrisModule } from './qris/qris.module';
import { TransactionModule } from './transaction/transaction.module';
import { BriModule } from './bri/bri.module';
import { BribriQrisServiceTsService } from './bribri-qris.service.ts/bribri-qris.service.ts.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    QrisModule,
    TransactionModule,
    BriModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
    AppService,
    BribriQrisServiceTsService,
  ],
})
export class AppModule {}
