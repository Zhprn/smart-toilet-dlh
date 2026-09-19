import { Module } from '@nestjs/common';
import { BriService } from './bri.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { BriController } from './bri.controller';

@Module({
  imports: [PrismaModule, DashboardModule],
  controllers: [BriController],
  providers: [BriService],
})
export class BriModule {}
