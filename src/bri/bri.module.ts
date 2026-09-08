import { Module } from '@nestjs/common';
import { BriService } from './bri.service';
import { BriController } from './bri.controller';
import { BriQrisService } from './bri-qris/bri-qris.service';

@Module({
  controllers: [BriController],
  providers: [BriService, BriQrisService],
})
export class BriModule {}
