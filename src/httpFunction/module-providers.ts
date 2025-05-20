import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { Type } from '@nestjs/common';

/**
 * Merges the providers from the app module into the target module.
 * @param appModule - The app module to merge providers from.
 * @param targetModule - The target module to merge providers into.
 */
export function mergeAppProvidersIntoModule(appModule: Type<any>, targetModule: Type<any>): void {
  const appProviders: any[] = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, appModule) || [];
  const existing: any[] = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, targetModule) || [];
  Reflect.defineMetadata(MODULE_METADATA.PROVIDERS, [...existing, ...appProviders], targetModule);
}
