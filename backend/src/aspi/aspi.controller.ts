import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AspiService } from './aspi.service';
import { JwtAuthGuard } from '../auth/guard/jwt-guard.auth';

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
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: { deviceCode: { type: 'string', example: 'GATE-001' } },
    },
  })
  generateQr(@Body('deviceCode') deviceCode?: string) {
    return this.aspiService.generateQr(deviceCode);
  }

  @Post('notify')
  @ApiBody({
    schema: {
      example: {
        originalReferenceNo: '202010297777000000009',
        originalPartnerReferenceNo: '2020102900000000000001',
        latestTransactionStatus: '00',
        transactionStatusDesc: 'success',
        customerNumber: '17081945',
        accountType: 'tabungan',
        destinationNumber: '2000020202',
        destinationAccountName: 'John Doe',
        amount: { value: '2000.00', currency: 'IDR' },
        sessionId: 'SESSION001',
        bankCode: '002',
        externalStoreId: '310928924949487',
        additionalInfo: {
          deviceId: '12345679237',
          channel: 'mobilephone',
        },
      },
    },
  })
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
}
