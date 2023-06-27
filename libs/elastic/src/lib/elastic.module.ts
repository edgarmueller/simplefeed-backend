import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './elastic.module-definition'
@Module({})
export class ElasticModule extends ConfigurableModuleClass {}