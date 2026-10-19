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
  migrations: ['apps/simplefeed/src/migrations/*.ts'],
})
