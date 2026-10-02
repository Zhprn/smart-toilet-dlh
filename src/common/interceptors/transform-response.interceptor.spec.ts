import { Reflector } from '@nestjs/core';
import { firstValueFrom, of } from 'rxjs';
import { SkipResponseTransform } from '../decorators/skip-response-transform.decorator';
import { TransformResponseInterceptor } from './transform-response.interceptor';

describe('TransformResponseInterceptor', () => {
  it('returns raw data for handlers marked to skip response transformation', async () => {
    class TokenController {
      @SkipResponseTransform()
      getToken() {}
    }

    const handler = TokenController.prototype.getToken;
    const interceptor = new TransformResponseInterceptor(new Reflector());
    const context = { getHandler: () => handler };
    const response = {
      accessToken: 'token-123',
      tokenType: 'BearerToken',
      expiresIn: '899',
    };

    await expect(
      firstValueFrom(
        interceptor.intercept(context as never, {
          handle: () => of(response),
        }),
      ),
    ).resolves.toEqual(response);
  });
});