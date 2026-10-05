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

  it('returns the BRI access-token response format with string expiry', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-02T00:00:00Z'));
    (service as any).accessToken = 'token-123';
    (service as any).accessTokenExpiredAt = Date.now() + 899_000;

    try {
      await expect(service.getAccessTokenResponse()).resolves.toEqual({
        accessToken: 'token-123',
        tokenType: 'BearerToken',
        expiresIn: '899',
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('matches the vendor webhook body-hash and hex-ASCII examples', () => {
    const rawBody =
      '{"originalReferenceNo":"648681020722","originalPartnerReferenceNo":"000008526196","latestTransactionStatus":"00","transactionStatusDesc":"success","customerNumber":"9360000213214291591","accountType":"Unspecified Acct","destinationAccountName":"LAILI SEPTIAN ZUFRI YAHYA","amount":{"value":"5000.00","currency":"IDR"},"bankCode":"002","AdditionalInfo":{"ReffId":"2004429726","issuerName":"BRI","issuerRrn":"296259544768"}}';
    const bodyHash = crypto
      .createHash('sha256')
      .update(rawBody)
      .digest('hex');

    expect(bodyHash).toBe(
      '35db209a558de1f69c240b9202d99d9995fdfb9a52f0193b2abfe46f208b525f',
    );
    expect(Buffer.from(bodyHash, 'utf8').toString('hex')).toBe(
      '33356462323039613535386465316636396332343062393230326439396439393935666466623961353266303139336232616266653436663230386235323566',
    );
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
    const timestamp = '2026-10-02T15:32:22+07:00';
    const accessToken = 'test-access-token';
    const rawBody = Buffer.from(JSON.stringify(payload));
    const bodyHash = crypto
      .createHash('sha256')
      .update(rawBody)
      .digest('hex');
    const bodyHashAscii = Buffer.from(bodyHash, 'utf8').toString('hex');
    const stringToSign = `POST:/v1.1/qr-dynamic/qr-mpm-notify:${accessToken}:${bodyHashAscii}:${timestamp}`;
    const signature = crypto
      .createHmac('sha512', secret)
      .update(stringToSign)
      .digest('base64');

    await expect(
      svc.handleNotification(payload as any, signature, {
        rawBody,
        timestamp,
        authorization: `Bearer ${accessToken}`,
      }),
    ).resolves.toBeDefined();
    expect(gate.openGateForTransaction).toHaveBeenCalledWith(
      'gate-1',
      'txn-1',
    );
  });
});
