import { Body, Controller, Post } from '@nestjs/common';
import { BriService } from './bri.service';

@Controller('bri')
export class BriController {
  constructor(private readonly briService: BriService) {}

  @Post('generate-qr')
  async generateQR(@Body('amount') amount: number) {
    return this.briService.generateQR(Number(amount));
  }

  @Post('payment')
  async payment(
    @Body()
    body: {
      partnerReferenceNo: string;
      amount: number;
      otp: string;
      verificationId: string;
    },
  ) {
    return this.briService.payment({
      ...body,
      amount: Number(body.amount),
    });
  }
}
