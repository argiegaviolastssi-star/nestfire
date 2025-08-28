import express from 'express';
import { Express } from 'express-serve-static-core';
import compression from 'compression';
import { HttpsFunction, Request, Response } from 'firebase-functions/v1';
import { createFunction } from '../create-function';
import { EndpointInfo } from '../scan-endpoints';
import { EnumFirebaseFunctionType } from '../../enums/firebase-function-type.enum';

/**
 * Creates individual Firebase functions for each endpoint in a module
 * @param module - The NestJS module
 * @param endpoints - Array of endpoint information
 * @param functionType - Type of Firebase function (HTTPS or Callable)
 * @param runtimeOptions - Runtime options for the functions
 * @returns Object mapping function names to Firebase functions
 */
export function createIndividualEndpointFunctionsV1(
  module: any,
  endpoints: EndpointInfo[],
  functionType: EnumFirebaseFunctionType,
  runtimeOptions: any,
  region?: string
): Record<string, any> {
  const functions: Record<string, any> = {};

  for (const endpoint of endpoints) {
    if (functionType === EnumFirebaseFunctionType.CALLABLE) {
      // For callable functions, we'll create a simplified handler
      functions[endpoint.functionName] = createCallableForEndpoint(module, endpoint, runtimeOptions, region);
    } else {
      // For HTTPS functions, create an express-based handler
      functions[endpoint.functionName] = createHttpsForEndpoint(module, endpoint, runtimeOptions, region);
    }
  }

  return functions;
}

function createHttpsForEndpoint(
  module: any,
  endpoint: EndpointInfo,
  runtimeOptions: any,
  region?: string
): HttpsFunction {
  const { runWith } = require('firebase-functions/v1');
  
  const run = runWith(runtimeOptions ?? {});
  const runRegion = region ? run.region(region) : run;

  return runRegion.https.onRequest(async (request: Request, response: Response) => {
    const expressServer: Express = express();
    expressServer.use(compression());
    
    // Create a focused route for this specific endpoint
    const method = endpoint.httpMethod.toString().toLowerCase();
    const path = endpoint.path || '/';
    
    await createFunction(module, expressServer);
    
    // Route the request to the specific path and method
    if (request.method?.toLowerCase() === method && request.path === path) {
      expressServer(request, response);
    } else {
      response.status(404).send('Endpoint not found');
    }
  });
}

function createCallableForEndpoint(
  module: any,
  endpoint: EndpointInfo,
  runtimeOptions: any,
  region?: string
): any {
  const { runWith } = require('firebase-functions/v1');
  
  const run = runWith(runtimeOptions ?? {});
  const runRegion = region ? run.region(region) : run;

  return runRegion.https.onCall(async (data: any, context: any) => {
    // Create NestJS application context
    const { NestFactory } = require('@nestjs/core');
    const app = await NestFactory.createApplicationContext(module);
    await app.init();
    
    try {
      // Get the controller instance and call the specific method
      const controllerInstance = app.get(endpoint.controllerClass);
      const result = await controllerInstance[endpoint.methodName](data, context);
      
      await app.close();
      return result;
    } catch (error) {
      await app.close();
      throw error;
    }
  });
}