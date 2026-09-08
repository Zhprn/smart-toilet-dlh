import { Controller, Get } from '@nestjs/common';
import { BriService } from './bri.service';
import { ResponseLoginDto } from 'src/auth/dto/response-login.dto';
import { ApiOkResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

@Controller('bri')
export class BriController {
  constructor(private readonly briService: BriService) {}

  @Get('access-token')
  @ApiOkResponse({
    description: 'Get access token successfully',
    type: ResponseLoginDto,
  })
  async getAccessToken() {
    return this.briService.getAccessToken();
  }
}
