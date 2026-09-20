import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { GateService } from '../gate/gate.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    transaction: {
      findMany: jest.Mock;
    };
  };
  let gateService: { listDevices: jest.Mock };

  beforeEach(async () => {
    prisma = {
      transaction: {
        findMany: jest.fn(),
      },
    };

    gateService = {
      listDevices: jest.fn().mockResolvedValue([
        { deviceCode: 'GATE-001', status: 'ACTIVE' },
        { deviceCode: 'GATE-002', status: 'OFFLINE' },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
        { provide: GateService, useValue: gateService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should build a dashboard summary with revenue, visitors, success rate and weekly trend', async () => {
    const now = new Date('2026-09-20T10:00:00.000Z');
    const today = new Date(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    prisma.transaction.findMany.mockImplementation(({ where }) => {
      const createdAt = where?.createdAt ?? {};
      const gte = createdAt.gte;
      const lte = createdAt.lte;

      const rows = [
        {
          id: '1',
          amount: 5000,
          status: 'SUCCESS',
          createdAt: new Date('2026-09-20T09:00:00.000Z'),
        },
        {
          id: '2',
          amount: 2000,
          status: 'SUCCESS',
          createdAt: new Date('2026-09-20T11:00:00.000Z'),
        },
        {
          id: '3',
          amount: 1000,
          status: 'FAILED',
          createdAt: new Date('2026-09-20T12:00:00.000Z'),
        },
        {
          id: '4',
          amount: 3000,
          status: 'SUCCESS',
          createdAt: new Date('2026-09-10T09:00:00.000Z'),
        },
      ];

      return Promise.resolve(
        rows.filter((row) => {
          const rowDate = new Date(row.createdAt);
          const inRange = (!gte || rowDate >= new Date(gte)) && (!lte || rowDate <= new Date(lte));
          return inRange;
        }),
      );
    });

    const result = await service.getSummary(now);

    expect(result.todayRevenue).toBe(7000);
    expect(result.monthRevenue).toBe(10000);
    expect(result.totalVisitors).toBe(2);
    expect(result.successRate).toBe(67);
    expect(result.weeklyTrend).toHaveLength(7);
    expect(result.gateStatus.total).toBe(2);
    expect(result.gateStatus.active).toBe(1);
    expect(result.gateStatus.inactive).toBe(1);
  });
});
