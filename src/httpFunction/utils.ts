import { MODULE_METADATA } from '@nestjs/common/constants';
import 'reflect-metadata';

export function deleteImportedControllers(root: any) {
  const visited = new Set<any>();
  recursiveDelete(root, visited);
}

function recursiveDelete(module: any, visited: Set<any>) {
  if (visited.has(module)){
    return;
  }

  visited.add(module);
  const imports: any[] = Reflect.getMetadata(MODULE_METADATA.IMPORTS, module) || [];

  for (const imp of imports) {
    Reflect.defineMetadata(MODULE_METADATA.CONTROLLERS, [], imp);
    recursiveDelete(imp, visited);
  }
}
