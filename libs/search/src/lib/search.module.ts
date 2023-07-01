import { ConfigModule, ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';
import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './search.module-definition'
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { SearchUsecases } from './search.usecases';
import { UserCreatedEventHandler } from './user-created.event-handler';

@Module({
	imports: [
		ElasticsearchModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				node: configService.get('search.node'),
				auth: {
					username: configService.get('search.username'),
					password: configService.get('search.password')
				}
			}),
			inject: [ConfigService]
		})
	],
	providers: [SearchService, SearchUsecases, UserCreatedEventHandler],
	exports: [SearchService, SearchUsecases]
})
export class SearchModule extends ConfigurableModuleClass {}