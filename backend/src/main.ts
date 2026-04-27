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

  // Enable CORS - use FRONTEND_URL in production, allow all in development
  const frontendUrl = process.env.FRONTEND_URL;
  const isDev = process.env.NODE_ENV !== 'production';

  app.enableCors({
    origin: isDev ? 'http://localhost:5173' : frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    maxAge: 86400,
  });

  void app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
