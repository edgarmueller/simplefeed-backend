import { registerAs } from '@nestjs/config'
import Joi from 'joi'

const requiredWhenEnabled = Joi.string().when('S3_ENABLED', {
  is: true,
  then: Joi.required(),
  otherwise: Joi.optional(),
})

export const S3Schema = {
  S3_ENABLED: Joi.boolean().default(false),
  AWS_REGION: requiredWhenEnabled,
  AWS_ACCESS_KEY_ID: requiredWhenEnabled,
  AWS_SECRET_ACCESS_KEY: requiredWhenEnabled,
  S3_ENDPOINT: requiredWhenEnabled,
  S3_BUCKET_NAME: requiredWhenEnabled,
}

export const s3Config = registerAs('s3', () => ({
  enabled: process.env.S3_ENABLED === 'true',
  region: process.env.AWS_REGION,
  endpoint: process.env.S3_ENDPOINT,
  bucketName: process.env.S3_BUCKET_NAME,
}))
