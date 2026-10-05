import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ok } from '../utils/response.util';
import { Reflector } from '@nestjs/core';
import { SUCCESS_MESSAGE_KEY } from '../decorators/success-message.decorator';
import { SKIP_RESPONSE_TRANSFORM_KEY } from '../decorators/skip-response-transform.decorator';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skipTransform = this.reflector.get<boolean>(
      SKIP_RESPONSE_TRANSFORM_KEY,
      context.getHandler(),
    );
    if (skipTransform) return next.handle();

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const method = request?.method || 'GET';

    const customMessage =
      this.reflector.get<string>(SUCCESS_MESSAGE_KEY, context.getHandler()) ??
      this.reflector.get<string>(SUCCESS_MESSAGE_KEY, context.getClass());

    const defaultMessage = this.getDefaultMessage(method);
    const finalMessage = customMessage ?? defaultMessage;

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        return ok(data, finalMessage);
      }),
    );
  }

  private getDefaultMessage(method: string): string {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'Created successfully';
      case 'PUT':
      case 'PATCH':
        return 'Updated successfully';
      case 'DELETE':
        return 'Deleted successfully';
      case 'GET':
        return 'Fetched successfully';
      default:
        return 'OK';
    }
  }
}
