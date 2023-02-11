import { authConfig } from './../../../../libs/schematics/src/auth/templates/lib/auth.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infra/database/database.module';
import { DatabaseConfigSchema } from './infra/database/database.config';
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local'],
      load: [authConfig],
      validationSchema: Joi.object().keys(
        DatabaseConfigSchema
      )
    }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
