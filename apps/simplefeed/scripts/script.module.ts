import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService, registerAs } from "@nestjs/config";
import { TypeOrmModule } from '@nestjs/typeorm';

export const databaseConfig = registerAs('database', () => ({
	url: process.env.DATABASE_URL,
	type: 'postgres',
	schema: 'simplefeed',
	ssl: process.env.DATABASE_SSL === 'true'
}))

@Module({
  imports:[
    ConfigModule.forRoot({
      envFilePath: [`.env.local`],
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('database.url'),
        schema: configService.get('database.schema'),
        ssl: configService.get('database.ssl'),
      })
    }),
  ],
})
export class ScriptModule {}
