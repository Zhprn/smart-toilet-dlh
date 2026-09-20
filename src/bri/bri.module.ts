import { Module } from '@nestjs/common';
import { BriService } from './bri.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { BriController } from './bri.controller';
import { GateModule } from '../gate/gate.module';

@Module({
  imports: [PrismaModule, DashboardModule, GateModule],
  controllers: [BriController],
  providers: [BriService],
})
export class BriModule {}
