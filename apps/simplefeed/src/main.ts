import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { initializeTransactionalContext } from 'typeorm-transactional'
import { AppModule } from './app/app.module'
import { configureApp, GLOBAL_PREFIX } from './app/app.setup'

async function bootstrap() {
  initializeTransactionalContext()
  const app = await NestFactory.create(AppModule, {
    abortOnError: true,
  })
  configureApp(app)

  const port = process.env.PORT || 3333
  await app.listen(port)
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${GLOBAL_PREFIX}`)
}

bootstrap()
