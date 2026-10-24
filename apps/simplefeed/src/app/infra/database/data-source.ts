/**
 * Data source for the TypeORM CLI, used to generate migrations:
 *
 *   npm run migration:generate --name=AddSomething
 *
 * The application itself configures TypeORM in database.module.ts.
 */
import { DataSource } from 'typeorm'
import { DATABASE_SCHEMA } from './database.config'
import { entities } from './entities'

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  schema: DATABASE_SCHEMA,
  entities,
  // migration files start with their timestamp; index.ts only re-exports them
  migrations: ['apps/simplefeed/src/migrations/[0-9]*.ts'],
})
