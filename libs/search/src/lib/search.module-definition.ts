import { ConfigurableModuleBuilder } from '@nestjs/common';
import { SearchModuleOptions } from './search-options.interface';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<SearchModuleOptions>().build();