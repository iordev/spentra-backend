import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter, TransformInterceptor } from './common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://10.10.12.10:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      // exceptionFactory: (errors) => {
      //   // Get the first error from the first field
      //   const firstError = errors[0];
      //   const firstConstraint = Object.values(firstError.constraints || {})[0];
      //
      //   return new UnprocessableEntityException({
      //     message: firstConstraint,
      //     error: 'Validation Error',
      //     statusCode: 422,
      //   });
      // },
      exceptionFactory: (errors) => {
        if (!errors.length) return null;

        // Take the first error
        const firstError = errors[0];
        const constraints = firstError.constraints || {};

        // Take the first constraint message
        const firstConstraintMessage = Object.values(constraints)[0] || 'Invalid input';

        // Capitalize the first letter
        const message =
          firstConstraintMessage.charAt(0).toUpperCase() + firstConstraintMessage.slice(1);

        return new BadRequestException(message);
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
