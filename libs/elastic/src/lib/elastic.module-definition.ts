import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ElasticModuleOptions } from './elastic-options.interface';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ElasticModuleOptions>().build();