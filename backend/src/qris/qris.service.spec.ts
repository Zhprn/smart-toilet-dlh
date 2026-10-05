import { Test, TestingModule } from '@nestjs/testing';
import { QrisService } from './qris.service';

describe('QrisService', () => {
  let service: QrisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QrisService],
    }).compile();

    service = module.get<QrisService>(QrisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
