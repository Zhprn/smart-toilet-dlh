import { Test, TestingModule } from '@nestjs/testing';
import { QrisController } from './qris.controller';
import { QrisService } from './qris.service';

describe('QrisController', () => {
  let controller: QrisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QrisController],
      providers: [QrisService],
    }).compile();

    controller = module.get<QrisController>(QrisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
