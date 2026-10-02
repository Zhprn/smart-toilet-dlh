import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
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

  it('should resolve the BRI private key from the secrets directory when env is not set', () => {
    const original = process.env.BRI_PRIVATE_KEY;
    delete process.env.BRI_PRIVATE_KEY;

    try {
      const key = (service as any).resolvePrivateKey();
      expect(key).toContain('BEGIN PRIVATE KEY');
      expect(key).toContain('END PRIVATE KEY');
    } finally {
      if (original) {
        process.env.BRI_PRIVATE_KEY = original;
      } else {
        delete process.env.BRI_PRIVATE_KEY;
      }
    }
  });

  it('should accept notification payload using partnerReferenceNo alias', async () => {
    const payload = {
      partnerReferenceNo: 'test-ref-1',
      latestTransactionStatus: '00',
      amount: { value: '2000.00', currency: 'IDR' },
    };

    const prisma = {
      transaction: {
        findUnique: jest.fn().mockResolvedValue({
          partnerReferenceNo: 'test-ref-1',
          amount: '2000.00',
          status: 'PENDING',
          terminalId: 'ABC123',
        }),
        update: jest.fn().mockResolvedValue({
          partnerReferenceNo: 'test-ref-1',
          amount: '2000.00',
          status: 'SUCCESS',
          terminalId: 'ABC123',
          gateDeviceId: 'gate-1',
          id: 'txn-1',
        }),
      },
    };

    const gate = {
      emitPaymentStatus: jest.fn(),
      openGateForTransaction: jest.fn(),
    };

    const svc = new BriService(
      prisma as any,
      { getQrAmount: jest.fn() } as any,
      gate as any,
    );

    const secret = 'test-secret';
    (svc as any).webhookSecret = secret;
    const signature = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(payload))
      .digest('base64');

    await expect(
      svc.handleNotification(payload as any, signature),
    ).resolves.toBeDefined();
    expect(gate.openGateForTransaction).toHaveBeenCalledWith(
      'gate-1',
      'txn-1',
    );
  });
});
