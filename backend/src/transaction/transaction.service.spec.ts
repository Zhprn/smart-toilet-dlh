import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TransactionService', () => {
  let service: TransactionService;
  const prisma = {
    transaction: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('filters transactions by status', async () => {
    prisma.transaction.findMany.mockResolvedValue([]);
    prisma.transaction.count.mockResolvedValue(0);

    await service.findAll(1, 20, 'SUCCESS');

    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      where: { status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    });
    expect(prisma.transaction.count).toHaveBeenCalledWith({
      where: { status: 'SUCCESS' },
    });
  });

  it('rejects an unknown status', async () => {
    await expect(service.findAll(1, 20, 'PAID')).rejects.toThrow(
      'Invalid status',
    );
  });
});
