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
  }

  async openGate(deviceCode: string, transactionId: string) {
    const device = await this.prisma.gateDevices.findUnique({
      where: { deviceCode },
    });
    if (!device || !this.server) {
      return false;
    }

    this.server.to(`device:${deviceCode}`).emit('gate:open', {
      transactionId,
      deviceCode,
      durationMs: 1000,
    });
    return true;
  }
}