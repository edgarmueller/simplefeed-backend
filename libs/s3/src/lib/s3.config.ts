import Joi from 'joi'

export const S3Schema = {
	AWS_REGION: Joi.string().required(),
	AWS_ACCESS_KEY_ID: Joi.string().required(),
	AWS_SECRET_ACCESS_KEY: Joi.string().required(),
}