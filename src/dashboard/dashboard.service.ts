import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GateService } from '../gate/gate.service';

@Injectable()
export class DashboardService {
  private static readonly qrAmountKey = 'QR_AMOUNT';
  private static readonly defaultQrAmount = 2000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateService: GateService,
  ) {}

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

  async getSummary(referenceDate = new Date()) {
    const todayStart = new Date(referenceDate);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(referenceDate);
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const [todayTx, monthTx, allTx, gateDevices] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          status: 'SUCCESS',
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          status: 'SUCCESS',
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          status: 'SUCCESS',
        },
      }),
      this.gateService.listDevices(),
    ]);

    const todayRevenue = todayTx.reduce((sum, item) => sum + Number(item.amount), 0);
    const monthRevenue = monthTx.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalVisitors = allTx.length;

    const successCount = await this.prisma.transaction.count({
      where: {
        status: 'SUCCESS',
      },
    });
    const totalTransactions = await this.prisma.transaction.count();
    const successRate = totalTransactions > 0 ? Math.round((successCount / totalTransactions) * 100) : 0;

    const activeGateCount = gateDevices.filter((device) => device.status === 'ACTIVE').length;
    const gateStatus = {
      total: gateDevices.length,
      active: activeGateCount,
      inactive: gateDevices.length - activeGateCount,
      devices: gateDevices.map((device) => ({
        id: device.id,
        name: device.name,
        deviceCode: device.deviceCode,
        status: device.status,
        lastConnectedAt: device.lastConnectedAt,
      })),
    };

    const weeklyTrend = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(referenceDate);
      date.setDate(referenceDate.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dayTransactions = allTx.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return txDate >= date && txDate < nextDate && tx.status === 'SUCCESS';
      });

      return {
        label: date.toLocaleDateString('id-ID', { weekday: 'short' }),
        value: dayTransactions.length,
      };
    });

    return {
      todayRevenue,
      monthRevenue,
      totalVisitors,
      successRate,
      gateStatus,
      weeklyTrend,
      activeGateCount: gateStatus.active,
      totalGateCount: gateStatus.total,
    };
  }
}