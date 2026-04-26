import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { helmetMiddleware } from './common/security/helmet.config';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Request size limiting to prevent DoS

  const httpAdapter = app.getHttpAdapter();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const expressInstance = httpAdapter.getInstance();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  expressInstance.use(express.json({ limit: '10kb' }));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  expressInstance.use(express.urlencoded({ limit: '10kb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(helmetMiddleware);

  app.use(cookieParser());

  // Enable CORS for all origins
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true, // Allow sending cookies and authorization headers
    maxAge: 86400, // Cache preflight for 24 hours
  });

  void app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
