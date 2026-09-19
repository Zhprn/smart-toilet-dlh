import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private static readonly qrAmountKey = 'QR_AMOUNT';
  private static readonly defaultQrAmount = 2000;

  constructor(private readonly prisma: PrismaService) {}

  async getQrAmount(): Promise<number> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key: DashboardService.qrAmountKey },
    });

    return setting ? Number(setting.value) : DashboardService.defaultQrAmount;
  }

  async updateQrAmount(amount: number): Promise<number> {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('QR amount must be greater than zero');
    }

    const setting = await this.prisma.appSetting.upsert({
      where: { key: DashboardService.qrAmountKey },
      create: { key: DashboardService.qrAmountKey, value: amount },
      update: { value: amount },
    });

    return Number(setting.value);
  }
}