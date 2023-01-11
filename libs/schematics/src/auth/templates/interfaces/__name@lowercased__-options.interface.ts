import { ModuleMetadata, Type } from "@nestjs/common";

export interface AuthModuleOptions {
  accessTokenSecret: string
  accessTokenExpirationInSeconds: number
	refreshTokenSecret: string
  refreshTokenExpirationInSeconds: number
  useCookies?: boolean
}

export interface AuthOptionsFactory {
  createAuthOptions(): Promise<AuthModuleOptions> | AuthModuleOptions;
}

export interface AuthModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<AuthOptionsFactory>
  useClass?: Type<AuthOptionsFactory>
  useFactory?: (...args: any[]) => Promise<AuthModuleOptions> | AuthModuleOptions
  inject?: any[]
}
