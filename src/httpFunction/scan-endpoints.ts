import 'reflect-metadata';
import { RequestMethod } from '@nestjs/common';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';

export interface EndpointInfo {
  controllerClass: any;
  methodName: string;
  path: string;
  httpMethod: RequestMethod;
  functionName: string;
}

/**
 * Scans a module's controllers and extracts individual endpoints/methods
 * for separate Firebase function deployment.
 * @param module - The NestJS module to scan
 * @returns Array of endpoint information
 */
export function scanModuleEndpoints(module: any): EndpointInfo[] {
  const controllers = Reflect.getMetadata('controllers', module) || [];
  const endpoints: EndpointInfo[] = [];

  for (const controllerClass of controllers) {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, controllerClass) || '';
    const prototype = controllerClass.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype);

    for (const methodName of methodNames) {
      if (methodName === 'constructor') continue;

      const method = prototype[methodName];
      if (typeof method !== 'function') continue;

      // Check if this method has HTTP metadata (is an endpoint)
      const httpMethod = Reflect.getMetadata(METHOD_METADATA, method);
      const methodPath = Reflect.getMetadata(PATH_METADATA, method) || '';

      if (httpMethod !== undefined) {
        const fullPath = `${controllerPath}${methodPath}`.replace(/\/+/g, '/');
        const functionName = generateFunctionName(controllerClass.name, methodName, httpMethod);

        endpoints.push({
          controllerClass,
          methodName,
          path: fullPath,
          httpMethod,
          functionName
        });
      }
    }
  }

  return endpoints;
}

/**
 * Generates a Firebase function name for an individual endpoint
 * @param controllerName - Name of the controller class
 * @param methodName - Name of the method
 * @param httpMethod - HTTP method type
 * @returns Generated function name in kebab-case format
 */
function generateFunctionName(controllerName: string, methodName: string, httpMethod: RequestMethod): string {
  // Remove 'Controller' suffix if present
  const cleanControllerName = controllerName.replace(/Controller$/, '');
  
  // Convert controller name to kebab-case
  const controllerKebab = cleanControllerName
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert dash between lowercase and uppercase
    .toLowerCase();
  
  // Convert method name to kebab-case
  const methodKebab = methodName
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert dash between lowercase and uppercase
    .toLowerCase();
  
  // Create kebab-case function name
  return `${controllerKebab}-${methodKebab}`;
}