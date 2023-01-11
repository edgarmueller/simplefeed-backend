import { INestApplication } from '@nestjs/common';
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser';
import { Connection } from 'typeorm';
import { initializeTransactionalContext } from 'typeorm-transactional';

import { AppModule } from './app/app.module'


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
    origin: ["http://localhost:3000"],
    credentials: true,
    // allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
    // exposedHeaders: [],
    // methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    // preflightContinue: false,
  })
  app.useGlobalPipes(new ValidationPipe({
    forbidNonWhitelisted: true,
    whitelist: true
  }))
  await createSchemaIfNecessary(app)
  await app.listen(port)
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

const createSchemaIfNecessary = async (app: INestApplication) => {
  const schema = 'realworld'
  const connection = app.get(Connection)
  const queryRunner = connection.createQueryRunner()
  const hasSchema = await queryRunner.hasSchema(schema)
  if (hasSchema) {
    return
  }
  await queryRunner.createSchema(schema, true)
};

bootstrap();
