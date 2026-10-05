import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      console.log('Trying to connect Prisma to DB...');
      await this.$connect();
      await this.$queryRawUnsafe('SELECT 1');
      console.log('Prisma connected to DB successfully');
    } catch (err) {
      console.error('Prisma failed to connect to DB');
      console.error(err);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
