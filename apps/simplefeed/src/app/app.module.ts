import { S3Schema, s3Config } from '@simplefeed/s3';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthConfigSchema, authConfig } from '@simplefeed/auth';
import Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { DatabaseConfigSchema, databaseConfig } from './infra/database/database.config';
import { DatabaseModule } from './infra/database/database.module';
import { ReaderModule } from './reader/reader.module';
import { UserModule } from './user/user.module';
import { APP_FILTER } from '@nestjs/core';
import { EntityNotFoundFilter } from './infra/not-found.exception-filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      // Nx loads the .env files in development and tests; deployments set real env vars
      ignoreEnvFile: true,
      load: [authConfig, s3Config, databaseConfig],
      validationSchema: Joi.object()
        .keys(DatabaseConfigSchema)
        .keys(AuthConfigSchema)
        .keys(S3Schema)
        .keys({ WORKER_API_KEY: Joi.string().min(16).optional() })
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
    ReaderModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: EntityNotFoundFilter,
    },
  ]
})
export class AppModule { }
