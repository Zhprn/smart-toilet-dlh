import { Module } from '@nestjs/common';
import { AspiController } from './aspi.controller';
import { AspiService } from './aspi.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [PrismaModule, DashboardModule],
  controllers: [AspiController],
  providers: [AspiService],
  exports: [AspiService],
})
export class AspiModule {}
