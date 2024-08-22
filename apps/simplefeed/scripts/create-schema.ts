import { isString } from 'lodash';
import { DataSource } from 'typeorm';
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { ScriptModule } from './script.module';

const createSchema = async () => {
  const app = await NestFactory.create<NestExpressApplication>(ScriptModule);
  const configService = app.get(ConfigService);
  const dataSource = new DataSource({
    name: 'script',
    type: 'postgres',
    url: configService.get('database.url'),
    ssl: configService.get('database.ssl') !== undefined ? configService.get('database.ssl') : true,
  })
  await dataSource.initialize();

  try {
    if (!isString(configService.get('database.schema')) || configService.get('database.schema') === '') {
      // tslint:disable-next-line:no-console
      console.error('`database.schema` has to be defined in your config!');
      process.exit(2);
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.createSchema(configService.get('database.schema'), true);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database schema could not be created!')
    throw error
  } finally {
    await dataSource.destroy();
  }
};

createSchema();