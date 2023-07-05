import { registerAs } from '@nestjs/config'
import Joi from 'joi'

export const SearchSchema = {
	ELASTICSEARCH_NODE: Joi.string().required(),
	ELASTICSEARCH_USERNAME: Joi.string().required(),
	ELASTICSEARCH_PASSWORD: Joi.string().required(),
}

export const searchConfig = registerAs('search', () => ({
	enabled: process.env.ELASTICSEARCH_ENABLED === 'true',
	node: process.env.ELASTICSEARCH_NODE,
	username: process.env.ELASTICSEARCH_USERNAME,
	password: process.env.ELASTICSEARCH_PASSWORD
}))