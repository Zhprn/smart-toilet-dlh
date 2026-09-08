import { Test, TestingModule } from '@nestjs/testing';
import { BriController } from './bri.controller';
import { BriService } from './bri.service';

describe('BriController', () => {
  let controller: BriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BriController],
      providers: [BriService],
    }).compile();

    controller = module.get<BriController>(BriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
