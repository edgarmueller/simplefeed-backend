import { registerAs } from '@nestjs/config'
import Joi from 'joi'

export const ElasticSchema = {
	ELASTICSEARCH_NODE: Joi.string().required(),
	ELASTICSEARCH_USERNAME: Joi.string().required(),
	ELASTICSEARCH_PASSWORD: Joi.string().required(),
}

export const elasticConfig = registerAs('elastic', () => ({
	node: process.env.ELASTICSEARCH_NODE,
	username: process.env.ELASTICSEARCH_USERNAME,
	password: process.env.ELASTICSEARCH_PASSWORD
}))