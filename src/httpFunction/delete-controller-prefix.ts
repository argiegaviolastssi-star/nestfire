import { MODULE_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import 'reflect-metadata';

export function deleteControllerPrefix(rootModule: any): void {
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
