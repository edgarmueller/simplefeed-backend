import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './search.module-definition'

@Module({})
export class SearchModule extends ConfigurableModuleClass {}