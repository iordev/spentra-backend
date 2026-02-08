import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      whitelist: true,
      // forbidNonWhitelisted: true,
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
        const messages = errors.map((error) => {
          const constraints = error.constraints || {};
          return `${error.property} has wrong value ${error.value}, ${Object.values(constraints).join(', ')}`;
        });
        return new BadRequestException(messages.join('. '));
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
