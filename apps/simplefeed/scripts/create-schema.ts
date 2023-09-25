import { isString } from 'lodash';
import { createConnection } from 'typeorm';
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { ScriptModule } from './script.module';

// The first thing that happens is to create the migration table.
// Since we configure a schema TypeORM creates the migration table under the configured schema.
// This doesn't make it possible to have the schema creation as a migration step.
// Therefore we need a pre script that generates for us the migration if it's not already existing.
const createSchema = async () => {
  const app = await NestFactory.create<NestExpressApplication>(ScriptModule);
  const configService = app.get(ConfigService);
  const connection = await createConnection({
    name: 'script',
    type: configService.get('database.type'),
    url: configService.get('database.url'),
    ssl: configService.get('database.ssl') !== undefined ? configService.get('database.ssl') : true,
  });

  try {
    if (!isString(configService.get('database.schema')) || configService.get('database.schema') === '') {
      // tslint:disable-next-line:no-console
      console.error('`database.schema` has to be defined in your config!');
      process.exit(2);
    }

    const queryRunner = connection.createQueryRunner();
    // TODO: schema name
    await queryRunner.createSchema(configService.get('database.schema'), true);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database schema could not be created!')
    throw error
  } finally {
    await connection.close();
  }
};

createSchema();