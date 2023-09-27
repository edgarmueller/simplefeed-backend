import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app/app.module';
import { RedisIoAdapter } from './app/chat/adapters/redis.adapter';


async function bootstrap() {
  initializeTransactionalContext() 
  const app = await NestFactory.create(AppModule, { 
    abortOnError: true
  })
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3333
  app.use(cookieParser())
  app.enableCors({
    // FIXME
    origin: ["http://localhost:3000", "https://simplefeed-frontend.vercel.app"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
    exposedHeaders: [],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
  })
  app.useGlobalPipes(new ValidationPipe({
    forbidNonWhitelisted: true,
    whitelist: true
  }))

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(app);
  app.useWebSocketAdapter(redisIoAdapter);


  await app.listen(port)
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
