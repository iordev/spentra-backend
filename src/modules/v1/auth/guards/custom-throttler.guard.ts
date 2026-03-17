import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { Response } from 'express';
import { CustomThrottlerException } from 'src/common/exceptions/throttler.exception';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ip ?? req.headers['x-forwarded-for'] ?? 'unknown';
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const response = context.switchToHttp().getResponse<Response>();

    const retryAfterSeconds = Math.ceil(throttlerLimitDetail.ttl / 1000);
    const resetTime = new Date(Date.now() + throttlerLimitDetail.ttl);

    const minutes = Math.floor(retryAfterSeconds / 60);
    const remainingSeconds = retryAfterSeconds % 60;

    let waitTime = '';
    if (minutes > 0 && remainingSeconds > 0) {
      waitTime = `${minutes} minute${minutes > 1 ? 's' : ''} and ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      waitTime = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      waitTime = `${retryAfterSeconds} second${retryAfterSeconds !== 1 ? 's' : ''}`;
    }

    const resetTimeFormatted = resetTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    response.setHeader('Retry-After', retryAfterSeconds);
    response.setHeader('X-RateLimit-Reset', resetTime.toISOString());

    // ← throw custom exception instead of ThrottlerException
    throw new CustomThrottlerException(
      `Too many requests. Please try again in ${waitTime} (at ${resetTimeFormatted}).`,
    );
  }
}
