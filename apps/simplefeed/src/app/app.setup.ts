import { INestApplication, ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'

export const GLOBAL_PREFIX = 'api'

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

function corsOrigins(): string[] {
  const configured = process.env.CORS_ORIGINS
  if (!configured) {
    return DEFAULT_CORS_ORIGINS
  }
  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

/**
 * HTTP-level setup shared by the server entry point and the API tests,
 * so both exercise the same prefix, validation and middleware.
 */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix(GLOBAL_PREFIX)
  app.use(cookieParser())
  app.enableCors({
    origin: corsOrigins(),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
    exposedHeaders: [],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
  })
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      whitelist: true,
    })
  )
  return app
}
