import 'reflect-metadata';
import { EnumFirebaseFunctionVersion } from '../enums/firebase-function-version.enum';
import { IFirebaseConfigDeployment } from '../interfaces/firebase-config-deployment.interface';

/**
 * Retrieves the URL prefix for a given module based on its configuration.
 * @param module - The module to retrieve the URL prefix from.
 * @param moduleConfiguration - The configuration of the module.
 * @returns The URL prefix for the module.
 */
export function getUrlPrefix(module: any, configuration: IFirebaseConfigDeployment): string {
  if (
    configuration.version === EnumFirebaseFunctionVersion.V1 ||
    (configuration.version === EnumFirebaseFunctionVersion.V2 && configuration?.configV2?.removeControllerPrefix)
  ) {
    const controllers = Reflect.getMetadata('controllers', module) || [];
    if (controllers.length === 1) {
      const controllerClass = controllers[0];
      const path = Reflect.getMetadata('path', controllerClass);

      if (Array.isArray(path) && path.length > 0) {
        return path[0];
      } else if (typeof path === 'string') {
        return path;
      }
    }
  }

  return module.name;
}

/**
 * If the module has only one controller, this function removes the path from that controller.
 * @param module - The module to remove the path from.
 */
export function removePathFromSingleController(module: any): void {
  const controllers = Reflect.getMetadata('controllers', module) || [];

  if (controllers.length === 1) {
    const controllerClass = controllers[0];
    const currentPath = Reflect.getMetadata('path', controllerClass);
    if (currentPath) {
      Reflect.defineMetadata('path', '', controllerClass);
    }
  }
}
