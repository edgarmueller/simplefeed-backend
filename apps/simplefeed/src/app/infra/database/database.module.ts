import { Logger, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { addTransactionalDataSource } from 'typeorm-transactional'
import { migrations } from '../../../migrations'
import { DATABASE_SCHEMA } from './database.config'
import { entities } from './entities'

const logger = new Logger('DatabaseModule')

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('database.url'),
        schema: DATABASE_SCHEMA,
        ssl: configService.get('database.ssl'),
        entities,
        migrations,
        synchronize: false,
      }),
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed')
        }
        const dataSource = addTransactionalDataSource(new DataSource(options))
        await dataSource.initialize()
        // the migrations table lives in the app's schema, so the schema has
        // to exist before migrations can run
        await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${DATABASE_SCHEMA}"`)
        const applied = await dataSource.runMigrations({ transaction: 'each' })
        applied.forEach((migration) => logger.log(`Applied migration ${migration.name}`))
        return dataSource
      },
    }),
  ],
})
export class DatabaseModule {}
