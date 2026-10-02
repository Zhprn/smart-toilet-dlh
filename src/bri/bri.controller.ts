import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { BriService } from './bri.service';
import { ApiBody, ApiOkResponse } from '@nestjs/swagger';

@Controller('bri')
export class BriController {
  constructor(private readonly briService: BriService) {}

  @Post('generate-qr')
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: { deviceCode: { type: 'string', example: 'GATE-001' } },
    },
  })
  async generateQR(@Body('deviceCode') deviceCode?: string) {
    return this.briService.generateQR(deviceCode);
  }

  @Get('token')
  getToken() {
    return this.briService.getAccessToken();
  }

  @Post('inquiry')
  @ApiBody({
      description: 'Inquiry Request',
      schema: {
        example: {
          partnerReferenceNo: '1234567890',
        },
      },
    })
  @ApiOkResponse({
    description: 'Inquiry successfully',
  })
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

  @Get('snap/v1.1/access-token/b2b')
  getAccessToken() {
    return this.briService.getAccessToken();
  }
}
