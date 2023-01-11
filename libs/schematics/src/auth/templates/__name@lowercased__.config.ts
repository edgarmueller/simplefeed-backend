import { registerAs } from '@nestjs/config';
import Joi from 'joi';

export enum AuthConfigKeys {
  AccessTokenSecret = 'auth.accessToken.secret',
  AccessTokenExpirationInSeconds = 'auth.accessToken.expirationInSeconds',
  RefreshTokenSecret = 'auth.refreshToken.secret',
  RefreshTokenExpirationInSeconds = 'auth.refreshToken.expirationInSeconds',
  UseCookies = 'auth.useCookies'
}

const DEFAULT_ACCESS_TOKEN_EXPIRATION = 300
const DEFAULT_REFRESH_TOKEN_EXPIRATION = 3600

export const AuthConfigSchema = {
	USE_COOKIES: Joi.boolean().default(false),
	JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
	JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: Joi.number().default(DEFAULT_ACCESS_TOKEN_EXPIRATION),
	JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
	JWT_REFRESH_TOKEN_EXPIRATION_IN_SECONDS: Joi.number().default(DEFAULT_REFRESH_TOKEN_EXPIRATION),
};

export const authConfig = registerAs('auth', () => ({
	useCookies: process.env.USE_COOKIES === 'true',
	accessToken: {
		secret: process.env.JWT_ACCESS_TOKEN_SECRET,
		expirationInSeconds: process.env.JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS
	},	
	refreshToken: {
		secret: process.env.JWT_REFRESH_TOKEN_SECRET,
		expirationInSeconds: process.env.JWT_REFRESH_TOKEN_EXPIRATION_IN_SECONDS
	},	
}))