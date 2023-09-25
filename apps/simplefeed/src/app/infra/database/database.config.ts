import { registerAs } from '@nestjs/config'
import Joi from 'joi'

export const DatabaseConfigSchema = {
	DATABASE_URL: Joi.string().required(),
}

export const databaseConfig = registerAs('database', () => ({
	url: process.env.DATABASE_URL,
	type: 'postgres',
	schema: 'simplefeed',
	ssl: process.env.DATABASE_SSL === 'true'
}))