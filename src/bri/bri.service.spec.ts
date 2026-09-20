import { Test, TestingModule } from '@nestjs/testing';
import { BriService } from './bri.service';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { GateService } from '../gate/gate.service';

describe('BriService', () => {
  let service: BriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BriService,
        { provide: PrismaService, useValue: {} },
        { provide: DashboardService, useValue: {} },
        { provide: GateService, useValue: {} },
      ],
    }).compile();

    service = module.get<BriService>(BriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
