import { ConfigModule, ConfigService } from '@nestjs/config'
import { SearchService } from './search.service'
import { Module, ModuleMetadata } from '@nestjs/common'
import { ConfigurableModuleClass } from './search.module-definition'
import { ElasticsearchModule } from '@nestjs/elasticsearch'
import { SearchUsecases } from './search.usecases'
import { UserCreatedEventHandler } from './user-created.event-handler'

function guardedModuleMetadata(): ModuleMetadata {
  const imports = []
  let providers = []
  let exports = []
  if (process.env.ELASTICSEARCH_ENABLED === 'true') {
    imports.push(
      ElasticsearchModule.registerAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => {
          return {
            node: configService.get('search.node'),
            auth: {
              username: configService.get('search.username'),
              password: configService.get('search.password'),
            },
          }
        },
        inject: [ConfigService],
      })
    )
    providers = [SearchService, SearchUsecases, UserCreatedEventHandler]
    exports = [SearchService, SearchUsecases]
  }
  return {
    imports,
    providers,
    exports,
  }
}

@Module({
	...guardedModuleMetadata(),
})
export class SearchModule extends ConfigurableModuleClass {}
