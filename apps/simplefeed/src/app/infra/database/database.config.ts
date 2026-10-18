import { registerAs } from '@nestjs/config'
import Joi from 'joi'

export const DATABASE_SCHEMA = 'simplefeed'

export const DatabaseConfigSchema = {
  DATABASE_URL: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().default(false),
}

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  schema: DATABASE_SCHEMA,
  ssl: process.env.DATABASE_SSL === 'true',
}))
