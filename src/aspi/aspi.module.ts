import { Module } from '@nestjs/common';
import { AspiController } from './aspi.controller';
import { AspiService } from './aspi.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AspiController],
  providers: [AspiService],
  exports: [AspiService],
})
export class AspiModule {}
