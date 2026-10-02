import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GateService {
  private server?: Server;

  constructor(private readonly prisma: PrismaService) {}

  setServer(server: Server) {
    this.server = server;
  }

  registerDevice(name: string, deviceCode: string) {
    return this.prisma.gateDevices.create({
      data: {
        name,
        deviceCode,
        status: 'OFFLINE',
      },
      select: {
        id: true,
        name: true,
        deviceCode: true,
        authToken: true,
        status: true,
      },
    });
  }

  async listDevices() {
    const devices = await this.prisma.gateDevices.findMany({
      orderBy: { name: 'asc' },
    });
    const activeSince = new Date(Date.now() - 30_000);

    return devices.map((device) => ({
      id: device.id,
      name: device.name,
      deviceCode: device.deviceCode,
      status:
        device.lastConnectedAt && device.lastConnectedAt >= activeSince
          ? 'ACTIVE'
          : 'OFFLINE',
      lastConnectedAt: device.lastConnectedAt,
    }));
  }

  async setDeviceStatus(deviceCode: string, status: string) {
    await this.prisma.gateDevices.update({
      where: { deviceCode },
      data: { status, lastConnectedAt: new Date() },
    });
    this.server?.to('dashboard').emit('gate:status', {
      deviceCode,
      status,
      lastConnectedAt: new Date().toISOString(),
    });
  }

  emitPaymentStatus(payload: Record<string, unknown>) {
    this.server?.to('dashboard').emit('payment:status', payload);
    const partnerReferenceNo = payload.partnerReferenceNo;
    if (typeof partnerReferenceNo === 'string') {
      this.server?.to(`payment:${partnerReferenceNo}`).emit('payment:status', payload);
    }
  }

  async openGate(
    deviceCode: string,
    transactionId: string,
    source: 'PAYMENT' | 'MANUAL' = 'MANUAL',
  ) {
    const log = await this.prisma.gateOpenLog.create({
      data: { transactionId, deviceCode, source },
    });
    const device = await this.prisma.gateDevices.findUnique({
      where: { deviceCode },
    });

    if (!device) {
      await this.prisma.gateOpenLog.update({
        where: { id: log.id },
        data: { status: 'DEVICE_NOT_FOUND', error: 'Gate device not found' },
      });
      return false;
    }

    if (!this.server) {
      await this.prisma.gateOpenLog.update({
        where: { id: log.id },
        data: {
          status: 'SERVER_UNAVAILABLE',
          error: 'WebSocket server unavailable',
        },
      });
      return false;
    }

    const room = `device:${deviceCode}`;
    const connectedSockets = await this.server.in(room).fetchSockets();
    if (connectedSockets.length === 0) {
      await this.prisma.gateOpenLog.update({
        where: { id: log.id },
        data: { status: 'DEVICE_OFFLINE', error: 'Gate device is offline' },
      });
      return false;
    }

    this.server.to(room).emit('gate:open', {
      commandId: log.id,
      transactionId,
      deviceCode,
      durationMs: 1000,
    });
    return true;
  }

  async acknowledgeOpenGate(payload: Record<string, unknown>) {
    const deviceCode = payload.deviceCode;
    const transactionId = payload.transactionId;
    const commandId = payload.commandId;
    if (typeof deviceCode !== 'string') return null;

    const log =
      typeof commandId === 'string'
        ? await this.prisma.gateOpenLog.findFirst({
            where: { id: commandId, deviceCode, status: 'PENDING' },
          })
        : typeof transactionId === 'string'
          ? await this.prisma.gateOpenLog.findFirst({
              where: { transactionId, deviceCode, status: 'PENDING' },
              orderBy: { createdAt: 'desc' },
            })
          : null;

    if (!log) return null;

    const succeeded = payload.success === true;
    const error = payload.error;
    return this.prisma.gateOpenLog.update({
      where: { id: log.id },
      data: {
        status: succeeded ? 'SUCCESS' : 'FAILED',
        acknowledgedAt: new Date(),
        ...(!succeeded
          ? {
              error:
                typeof error === 'string' && error.length > 0
                  ? error
                  : 'Gate device reported that opening failed',
            }
          : {}),
      },
    });
  }

  listOpenLogs() {
    return this.prisma.gateOpenLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}