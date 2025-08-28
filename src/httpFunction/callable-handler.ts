import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

const loadedCallableApps: { [key: string]: any } = {};

/**
 * Handles module execution for Firebase Callable functions.
 * Creates and caches NestJS applications for callable function execution.
 * @param module - The NestJS module to handle
 * @param data - The data payload from the callable function
 * @param context - The Firebase callable context (v1) or request (v2)
 * @returns The result from the callable function execution
 */
export async function handleModuleForCallable(
  module: any, 
  data: any, 
  context: any // Using any to avoid import issues - will be typed correctly at runtime
): Promise<any> {
  const moduleName = module?.constructor?.name;
  if (!moduleName) {
    throw new Error('Module name is not defined. Ensure the module is properly initialized.');
  }

  try {
    let app: INestApplication;
    
    if (loadedCallableApps[moduleName]) {
      app = loadedCallableApps[moduleName];
    } else {
      // Create a standalone NestJS application for callable functions
      app = await NestFactory.create(module);
      await app.init();
      loadedCallableApps[moduleName] = app;
    }

    // Get the first controller from the module
    const controllers = Reflect.getMetadata('controllers', module) || [];
    if (controllers.length === 0) {
      throw new Error('No controllers found in the module for callable function execution.');
    }

    const controllerClass = controllers[0];
    const controllerInstance = app.get(controllerClass);
    
    // Try to find a handleCall method first (for backward compatibility)
    if (typeof controllerInstance.handleCall === 'function') {
      return await controllerInstance.handleCall(data, context);
    }
    
    // If no handleCall method, look for the action specified in the data
    // This allows for more flexible callable function routing
    if (data && typeof data === 'object' && data.action && typeof data.action === 'string') {
      const methodName = data.action;
      if (typeof controllerInstance[methodName] === 'function') {
        return await controllerInstance[methodName](data, context);
      } else {
        throw new Error(
          `Controller ${controllerClass.name} does not have a method named '${methodName}' for callable function execution.`
        );
      }
    }
    
    // If there's only one method (excluding constructor), use that
    const prototype = controllerClass.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype)
      .filter(name => name !== 'constructor' && typeof prototype[name] === 'function');
    
    if (methodNames.length === 1) {
      const methodName = methodNames[0];
      return await controllerInstance[methodName](data, context);
    }
    
    // Fallback error message with helpful guidance
    throw new Error(
      `Controller ${controllerClass.name} does not have a handleCall method for callable function execution.\n` +
      `To resolve this, you can:\n` +
      `1. Implement a method named 'handleCall' in your controller with the signature:\n` +
      `   async handleCall(data: any, context: any): Promise<any> { /* your logic here */ }\n\n` +
      `2. Or pass an 'action' field in your data payload to specify which method to call:\n` +
      `   const result = await callable({ action: 'methodName', ...otherData });\n\n` +
      `3. Or use 'exportSeparately: true' to create individual callable functions for each method.\n\n` +
      `Available methods in controller: ${methodNames.join(', ')}`
    );
  } catch (error) {
    delete loadedCallableApps[moduleName];
    throw new Error(`Failed to handle callable function for module ${moduleName}: ${error}`);
  }
}