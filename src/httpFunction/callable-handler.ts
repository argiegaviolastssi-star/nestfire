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

    // For callable functions, we need to find and execute the appropriate service method
    // This is a simplified implementation - in practice, you might want to use a more
    // sophisticated routing mechanism based on the data payload
    
    // Get the first controller from the module
    const controllers = Reflect.getMetadata('controllers', module) || [];
    if (controllers.length === 0) {
      throw new Error('No controllers found in the module for callable function execution.');
    }

    // For now, we'll assume the controller has a method that handles callable requests
    // This could be enhanced to support routing based on data payload
    const controllerClass = controllers[0];
    const controllerInstance = app.get(controllerClass);
    
    // Look for a method named 'handleCall' or similar
    // This is a convention that could be enhanced with decorators
    if (typeof controllerInstance.handleCall === 'function') {
      return await controllerInstance.handleCall(data, context);
    } else {
      throw new Error(
        `Controller ${controllerClass.name} does not have a handleCall method for callable function execution.\n` +
        `To resolve this, implement a method named 'handleCall' in your controller with the following signature:\n\n` +
        `  async handleCall(data: any, context: any): Promise<any> {\n    // your logic here\n  }\n\n` +
        `See documentation: https://example.com/docs/callable-functions#handleCall`
      );
    }
  } catch (error) {
    delete loadedCallableApps[moduleName];
    throw new Error(`Failed to handle callable function for module ${moduleName}: ${error}`);
  }
}