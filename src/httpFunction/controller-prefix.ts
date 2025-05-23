import { MODULE_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import 'reflect-metadata';

/**
 * Returns the first controller path prefix found in the module,
 * without modifying any metadata.
 */
export function getFirstControllerPrefix(rootModule: any): string | undefined {
  const controllers: Function[] = Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, rootModule) ?? [];

  const getFirst = (path: string): string => path.split('/').filter(Boolean).slice(0, 1).join('/');

  for (const controller of controllers) {
    const current = Reflect.getMetadata(PATH_METADATA, controller);
    if (typeof current === 'string' && current.length > 0) {
      return getFirst(current);
    }
    if (Array.isArray(current) && current.length > 0) {
      const firstPath = current.find((p) => typeof p === 'string' && p.length > 0);
      if (firstPath) {
        return getFirst(firstPath);
      }
    }
  }

  return undefined;
}

/**
 * Removes the first path segment from each controller in the module.
 * Returns true if at least one prefix was removed.
 */
export function removeControllerPrefix(rootModule: any): void {
  const controllers: any[] = Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, rootModule) ?? [];

  const removeFirst = (p: string): string => p.split('/').filter(Boolean).slice(1).join('/');

  for (const controller of controllers) {
    const current = Reflect.getMetadata(PATH_METADATA, controller);

    if (typeof current === 'string') {
      Reflect.defineMetadata(PATH_METADATA, removeFirst(current), controller);
    } else if (Array.isArray(current)) {
      Reflect.defineMetadata(PATH_METADATA, current.map(removeFirst), controller);
    }
  }
}

