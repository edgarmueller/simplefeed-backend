import { registerAs } from '@nestjs/config'
import Joi from 'joi'

export const S3Schema = {
	AWS_REGION: Joi.string().required(),
	AWS_ACCESS_KEY_ID: Joi.string().required(),
	AWS_SECRET_ACCESS_KEY: Joi.string().required(),
	S3_HOST: Joi.string().required(),
  S3_HREF: Joi.string().required(),
  S3_PORT: Joi.number().required(),
  S3_HOSTNAME: Joi.string().required(),
  S3_PROTOCOL: Joi.string().required(),
}

export const s3Config = registerAs('s3', () => ({
  enabled: process.env.S3_ENABLED === 'true',
  region: process.env.AWS_REGION,
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	host: process.env.S3_HOST,
	href: process.env.S3_HREF,
	port: process.env.S3_PORT,
	hostname: process.env.S3_HOSTNAME,
	protocol: process.env.S3_PROTOCOL,
}))
