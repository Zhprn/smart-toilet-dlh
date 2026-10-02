import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guard/jwt-guard.auth';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';
import { GateService } from '../gate/gate.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly gateService: GateService,
  ) {}

  @Get('gates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  getGates() {
    return this.gateService.listDevices();
  }

  @Get('gate-open-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  getGateOpenLogs() {
    return this.gateService.listOpenLogs();
  }

  @Post('gates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      example: { name: 'Main Gate', deviceCode: 'GATE-001' },
    },
  })
  registerGate(@Body('name') name: string, @Body('deviceCode') deviceCode: string) {
    return this.gateService.registerDevice(name, deviceCode);
  }

  @Post('gate-open')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      example: { deviceCode: 'GATE-001' },
    },
  })
  async openGate(
    @Body('deviceCode') deviceCode: string,
    @Body('transactionId') transactionId?: string,
  ) {
    if (!deviceCode) {
      throw new BadRequestException('deviceCode is required');
    }

    const commandId = transactionId || `manual-${Date.now()}`;
    const sent = await this.gateService.openGate(
      deviceCode,
      commandId,
      'MANUAL',
    );
    if (!sent) {
      throw new BadRequestException(
        'Gate device was not found or is not connected',
      );
    }

    return {
      deviceCode,
      transactionId: commandId,
      sent: true,
    };
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('settings/amount')
  getQrAmount() {
    return this.dashboardService.getQrAmount();
  }

  @Patch('settings/amount')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiBody({ schema: { example: { amount: 2000 } } })
  updateQrAmount(@Body('amount') amount: number) {
    return this.dashboardService.updateQrAmount(Number(amount));
  }
}