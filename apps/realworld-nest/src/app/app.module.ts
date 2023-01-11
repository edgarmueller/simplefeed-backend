import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infra/database/database.module';
import { DatabaseConfigSchema } from './infra/database/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local'],
      load: [],
      validationSchema: Joi.object().keys(
        DatabaseConfigSchema
      )
    }),
    DatabaseModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
