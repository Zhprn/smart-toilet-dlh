import { Test, TestingModule } from '@nestjs/testing';
import { BriController } from './bri.controller';
import { BriService } from './bri.service';

describe('BriController', () => {
  let controller: BriController;
  let service: BriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BriController],
      providers: [
        {
          provide: BriService,
          useValue: {
            generateQR: jest.fn(),
            payment: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BriController>(BriController);
    service = module.get<BriService>(BriService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call generateQR on the service', async () => {
    await controller.generateQR('GATE-002');

    expect(service.generateQR).toHaveBeenCalledWith('GATE-002');
  });

  it('should call payment on the service', async () => {
    const payload = {
      partnerReferenceNo: 'GATE-123',
      otp: '123456',
      verificationId: 'abc-123',
    };

    await controller.payment(payload);

    expect(service.payment).toHaveBeenCalledWith(payload);
  });
});
