import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guard/jwt-guard.auth';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('settings/amount')
  getQrAmount() {
    return this.dashboardService.getQrAmount();
  }

  @Patch('settings/amount')
  @ApiBody({ schema: { example: { amount: 2000 } } })
  updateQrAmount(@Body('amount') amount: number) {
    return this.dashboardService.updateQrAmount(Number(amount));
  }
}