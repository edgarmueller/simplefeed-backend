import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService, registerAs } from "@nestjs/config";
import Joi from "joi";
import { TypeOrmModule } from '@nestjs/typeorm';

export const databaseConfig = registerAs('database', () => ({
	host: process.env.POSTGRES_HOST,
	port: process.env.POSTGRES_PORT,
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
	db: process.env.POSTGRES_DB,
	type: 'postgres',
	schema: 'kittgen',
	ssl: process.env.DATABASE_SSL === 'true'
}))

@Module({
  imports:[
    ConfigModule.forRoot({
      envFilePath: [`.env.local`],
      load: [authConfig, databaseConfig],
      validationSchema: Joi.object().keys(
        DatabaseConfigSchema
      )
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.user'),
        password: configService.get('database.password'),
        database: configService.get('database.db'),
        schema: 'kittgen',
        ssl: configService.get('database.ssl'),
      })
    }),
  ],
})
export class ScriptModule {}
