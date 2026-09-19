import axios from 'axios';
import { AspiService } from './aspi.service';
import { DashboardService } from '../dashboard/dashboard.service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AspiService', () => {
  const prisma = {
    appSetting: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const dashboardService = {
    getQrAmount: jest.fn(),
  };

  beforeEach(() => {
    process.env.ASPI_BASE_URL = 'https://aspi.test';
    process.env.ASPI_CLIENT_ID = 'client-id';
    process.env.ASPI_CLIENT_SECRET = 'client-secret';
    process.env.ASPI_CHANNEL_ID = 'channel-id';
    process.env.ASPI_PRIVATE_KEY = 'dashboard-private-key';
    prisma.appSetting.findUnique.mockResolvedValue({ value: 2000 });
    prisma.appSetting.upsert.mockResolvedValue({ value: 2000 });
    dashboardService.getQrAmount.mockResolvedValue(2000);
    prisma.transaction.create.mockResolvedValue({
      id: 'transaction-1',
      status: 'PENDING',
    });
    jest.clearAllMocks();
  });

  it('generates the ASPI timestamp without milliseconds', () => {
    const service = new AspiService(
      prisma as never,
      dashboardService as unknown as DashboardService,
    );

    expect(service.generateTimestamp()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/,
    );
  });

  it('gets the signature from ASPI using the dashboard private key', async () => {
    const service = new AspiService(
      prisma as never,
      dashboardService as unknown as DashboardService,
    );
    const timestamp = '2026-09-18T13:30:00+07:00';
    mockedAxios.post.mockResolvedValueOnce({
      data: { signature: 'signature-1' },
    } as never);

    await expect(service.generateSignatureAuth(timestamp)).resolves.toBe(
      'signature-1',
    );

    expect(mockedAxios.post.mock.calls[0]).toEqual([
      'https://aspi.test/api/v1.0/utilities/signature-auth',
      {},
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'X-TIMESTAMP': timestamp,
          'X-CLIENT-KEY': 'client-id',
          Private_Key: 'dashboard-private-key',
        },
      }),
    ]);
  });

  it('rejects a missing private key before calling ASPI', async () => {
    delete process.env.ASPI_PRIVATE_KEY;
    const service = new AspiService(
      prisma as never,
      dashboardService as unknown as DashboardService,
    );

    await expect(
      service.generateSignatureAuth('2026-09-18T13:30:00+07:00'),
    ).rejects.toThrow('ASPI_PRIVATE_KEY is not configured');
  });

  it('caches an access token until its expiry buffer', async () => {
    const service = new AspiService(
      prisma as never,
      dashboardService as unknown as DashboardService,
    );
    mockedAxios.post
      .mockResolvedValueOnce({
        data: { signature: 'signature-auth-1' },
      } as never)
      .mockResolvedValueOnce({
        data: { accessToken: 'token-1', expiresIn: 900 },
      } as never);

    await expect(service.getAccessToken()).resolves.toBe('token-1');
    await expect(service.getAccessToken()).resolves.toBe('token-1');

    expect(mockedAxios.post.mock.calls).toHaveLength(2);
  });

  it('uses the same body for signature service and QR generation', async () => {
    const service = new AspiService(
      prisma as never,
      dashboardService as unknown as DashboardService,
    );
    mockedAxios.post
      .mockResolvedValueOnce({
        data: { signature: 'signature-auth-1' },
      } as never)
      .mockResolvedValueOnce({
        data: { accessToken: 'token-1', expiresIn: 900 },
      } as never)
      .mockResolvedValueOnce({ data: { signature: 'signature-1' } } as never)
      .mockResolvedValueOnce({
        data: {
          qrContent: 'qr-content',
          referenceNo: 'reference-1',
          partnerReferenceNo: 'partner-1',
        },
      } as never);
    await expect(service.generateQr()).resolves.toEqual({
      qrContent: 'qr-content',
      referenceNo: 'reference-1',
      partnerReferenceNo: 'partner-1',
      transactionId: 'transaction-1',
      transactionStatus: 'PENDING',
    });

    const signatureRequest = mockedAxios.post.mock.calls[2][1];
    const signatureOptions = mockedAxios.post.mock.calls[2][2] as {
      headers: Record<string, string>;
    };
    const qrRequest = mockedAxios.post.mock.calls[3][1];
    expect(signatureRequest).toMatchObject({
      amount: { value: '2000.00', currency: 'IDR' },
      feeAmount: { value: '0.00', currency: 'IDR' },
      merchantId: 'merch00001',
      terminalId: '213141251124',
    });
    expect(signatureOptions.headers.HttpMethod).toBe('POST');
    expect(signatureOptions.headers.EndpointUrl).toBe(
      '/api/v1.0/qr/qr-mpm-generate',
    );
    expect(signatureOptions.headers.EndpoinUrl).toBe(
      '/api/v1.0/qr/qr-mpm-generate',
    );
    expect(signatureOptions.headers.AccessToken).toBe('token-1');
    expect(qrRequest).toEqual(signatureRequest);
    expect(JSON.stringify(qrRequest)).toBe(JSON.stringify(signatureRequest));
  });

});
