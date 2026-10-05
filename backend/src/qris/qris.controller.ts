import { Controller } from '@nestjs/common';
import { QrisService } from './qris.service';

@Controller('qris')
export class QrisController {
  constructor(private readonly qrisService: QrisService) {}
}
