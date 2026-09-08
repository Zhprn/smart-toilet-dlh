import { Module } from '@nestjs/common';
import { BriService } from './bri.service';
import { BriController } from './bri.controller';

@Module({
  controllers: [BriController],
  providers: [BriService],
})
export class BriModule {}
