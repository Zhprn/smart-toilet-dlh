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
import { AspiService } from './aspi.service';
import { JwtAuthGuard } from '../auth/guard/jwt-guard.auth';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';

@Controller('aspi')
export class AspiController {
  constructor(private readonly aspiService: AspiService) {}

  @Get('signature-auth')
  signatureAuth() {
    return this.aspiService.signatureAuth();
  }

  @Get('token')
  getToken() {
    return this.aspiService.getAccessToken();
  }

  @Post('qr')
  generateQr() {
    return this.aspiService.generateQr();
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findTransactions() {
    return this.aspiService.findTransactions();
  }

  @Post('notify')
  notify(@Body() body: Record<string, unknown>) {
    return this.aspiService.handlePaymentNotification(body);
  }

  @Post('payment')
  @ApiBody({
    schema: {
      example: {
        partnerReferenceNo: '179000000000012345',
        otp: '123456',
        verificationId: 'verification-id-from-sandbox',
      },
    },
  })
  payment(
    @Body('partnerReferenceNo') partnerReferenceNo: string,
    @Body('otp') otp: string,
    @Body('verificationId') verificationId: string,
  ) {
    return this.aspiService.payment(partnerReferenceNo, otp, verificationId);
  }

  @Post('query')
  @ApiBody({
    schema: { example: { partnerReferenceNo: '179000000000012345' } },
  })
  query(@Body('partnerReferenceNo') partnerReferenceNo: string) {
    return this.aspiService.query(partnerReferenceNo);
  }

  @Post('test/payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      example: {
        partnerReferenceNo: '179000000000012345',
        status: 'SUCCESS',
      },
    },
  })
  simulatePayment(
    @Body('partnerReferenceNo') partnerReferenceNo: string,
    @Body('status') status: 'SUCCESS' | 'FAILED',
  ) {
    if (status !== 'SUCCESS' && status !== 'FAILED') {
      throw new BadRequestException('status must be SUCCESS or FAILED');
    }

    return this.aspiService.simulatePayment(partnerReferenceNo, status);
  }

  @Get('settings/amount')
  getQrAmount() {
    return this.aspiService.getQrAmount();
  }

  @Patch('settings/amount')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiBody({ schema: { example: { amount: 2000 } } })
  updateQrAmount(@Body('amount') amount: number) {
    return this.aspiService.updateQrAmount(Number(amount));
  }
}
