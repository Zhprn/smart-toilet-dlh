import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { BriService } from './bri.service';

@Controller('bri')
export class BriController {
  constructor(private readonly briService: BriService) {}

  @Post('generate-qr')
  async generateQR() {
    return this.briService.generateQR();
  }

  @Get('token')
  getToken() {
    return this.briService.getAccessToken();
  }

  @Post('inquiry')
  inquiry(@Body('partnerReferenceNo') partnerReferenceNo: string) {
    return this.briService.inquiry(partnerReferenceNo);
  }

}

@Controller()
export class BriWebhookController {
  constructor(private readonly briService: BriService) {}

  @Post('v1.1/qr-dynamic/qr-mpm-notify')
  notify(
    @Body() body: Record<string, unknown>,
    @Headers('x-signature') signature?: string,
  ) {
    return this.briService.handleNotification(body, signature);
  }
}
