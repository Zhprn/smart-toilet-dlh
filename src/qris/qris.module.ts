import { Module } from '@nestjs/common';
import { QrisService } from './qris.service';
import { QrisController } from './qris.controller';

@Module({
  controllers: [QrisController],
  providers: [QrisService],
})
export class QrisModule {}
