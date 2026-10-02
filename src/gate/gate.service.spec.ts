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
      update: jest.Mock;
    };
  };
  let emit: jest.Mock;
  let fetchSockets: jest.Mock;

  beforeEach(() => {
    prisma = {
      gateDevices: {
        findUnique: jest.fn().mockResolvedValue({ id: 'device-1' }),
      },
      gateOpenLog: {
        create: jest.fn().mockResolvedValue({ id: 'command-1' }),
        findFirst: jest.fn(),
        findMany: jest.fn(),
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
});
