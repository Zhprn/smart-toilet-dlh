import { GateService } from './gate.service';
import { PrismaService } from '../prisma/prisma.service';
import { Server } from 'socket.io';

describe('GateService', () => {
  let service: GateService;
  let prisma: {
    gateDevices: { findUnique: jest.Mock };
    gateOpenLog: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
  };
  let emit: jest.Mock;
  let fetchSockets: jest.Mock;

  beforeEach(() => {
    prisma = {
      gateDevices: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'device-1', deviceCode: 'GATE-001' }),
      },
      gateOpenLog: {
        create: jest.fn().mockResolvedValue({ id: 'command-1' }),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };
    emit = jest.fn();
    fetchSockets = jest.fn().mockResolvedValue([{}]);

    service = new GateService(prisma as unknown as PrismaService);
    service.setServer({
      in: jest.fn().mockReturnValue({ fetchSockets }),
      to: jest.fn().mockReturnValue({ emit }),
    } as unknown as Server);
  });

  it('records a payment command and emits its correlation ID', async () => {
    await expect(
      service.openGate('GATE-001', 'transaction-1', 'PAYMENT'),
    ).resolves.toBe(true);

    expect(prisma.gateOpenLog.create).toHaveBeenCalledWith({
      data: {
        transactionId: 'transaction-1',
        deviceCode: 'GATE-001',
        source: 'PAYMENT',
      },
    });
    expect(emit).toHaveBeenCalledWith('gate:open', {
      commandId: 'command-1',
      transactionId: 'transaction-1',
      deviceCode: 'GATE-001',
      durationMs: 1000,
    });
  });

  it('uses GATE-001 as the default and validates the selected device code', async () => {
    await expect(service.resolveDevice()).resolves.toEqual({
      id: 'device-1',
      deviceCode: 'GATE-001',
    });
    expect(prisma.gateDevices.findUnique).toHaveBeenCalledWith({
      where: { deviceCode: 'GATE-001' },
      select: { id: true, deviceCode: true },
    });

    await service.resolveDevice('GATE-002');
    expect(prisma.gateDevices.findUnique).toHaveBeenLastCalledWith({
      where: { deviceCode: 'GATE-002' },
      select: { id: true, deviceCode: true },
    });
  });

  it('opens the gate associated with the transaction', async () => {
    await expect(
      service.openGateForTransaction('device-1', 'transaction-1'),
    ).resolves.toBe(true);

    expect(prisma.gateOpenLog.create).toHaveBeenCalledWith({
      data: {
        transactionId: 'transaction-1',
        deviceCode: 'GATE-001',
        source: 'PAYMENT',
      },
    });
  });

  it('rejects unregistered gate device codes', async () => {
    prisma.gateDevices.findUnique.mockResolvedValueOnce(null);

    await expect(service.resolveDevice('GATE-MISSING')).rejects.toThrow(
      'Gate device "GATE-MISSING" is not registered',
    );
  });

  it('records an offline device instead of reporting the command as sent', async () => {
    fetchSockets.mockResolvedValue([]);

    await expect(service.openGate('GATE-001', 'manual-1')).resolves.toBe(false);

    expect(prisma.gateOpenLog.update).toHaveBeenCalledWith({
      where: { id: 'command-1' },
      data: { status: 'DEVICE_OFFLINE', error: 'Gate device is offline' },
    });
    expect(emit).not.toHaveBeenCalled();
  });

  it('stores the Raspberry Pi acknowledgement outcome', async () => {
    prisma.gateOpenLog.findFirst.mockResolvedValue({ id: 'command-1' });

    await service.acknowledgeOpenGate({
      commandId: 'command-1',
      deviceCode: 'GATE-001',
      success: false,
      error: 'Relay unavailable',
    });

    expect(prisma.gateOpenLog.update).toHaveBeenCalledTimes(1);
    const updateCalls = prisma.gateOpenLog.update.mock
      .calls as unknown as Array<
      [
        {
          data: {
            status: string;
            error?: string;
            acknowledgedAt?: Date;
          };
        },
      ]
    >;
    const updateData = updateCalls[0][0].data;
    expect(updateData.status).toBe('FAILED');
    expect(updateData.error).toBe('Relay unavailable');
    expect(updateData.acknowledgedAt).toBeInstanceOf(Date);
  });

  it('paginates gate-open logs and returns pagination metadata', async () => {
    prisma.gateOpenLog.findMany.mockResolvedValue([{ id: 'command-1' }]);
    prisma.gateOpenLog.count.mockResolvedValue(41);

    await expect(service.listOpenLogs(3, 15)).resolves.toEqual({
      data: [{ id: 'command-1' }],
      meta: { page: 3, limit: 15, total: 41, totalPages: 3 },
    });
    expect(prisma.gateOpenLog.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      skip: 30,
      take: 15,
    });
    expect(prisma.gateOpenLog.count).toHaveBeenCalledWith();
  });
});
