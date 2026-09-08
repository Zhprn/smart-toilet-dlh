import { Controller } from '@nestjs/common';
import { BriService } from './bri.service';

@Controller('bri')
export class BriController {
  constructor(private readonly briService: BriService) {}
}
