import { registerAs } from '@nestjs/config'
import Joi from 'joi'

export const S3Schema = {
	AWS_REGION: Joi.string().required(),
	AWS_ACCESS_KEY_ID: Joi.string().required(),
	AWS_SECRET_ACCESS_KEY: Joi.string().required(),
	S3_ENDPOINT: Joi.string().required(),
}

export const s3Config = registerAs('s3', () => ({
  enabled: process.env.S3_ENABLED === 'true',
  region: process.env.AWS_REGION,
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	endpoint: process.env.S3_ENDPOINT
}))
