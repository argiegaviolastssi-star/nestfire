import express from 'express';
import { Express } from 'express-serve-static-core';
import compression from 'compression';
import { HttpsFunction, onRequest } from 'firebase-functions/v2/https';
import { createFunction } from '../create-function';
import { EndpointInfo } from '../scan-endpoints';
import { EnumFirebaseFunctionType } from '../../enums/firebase-function-type.enum';

/**
 * Creates individual Firebase functions for each endpoint in a module (V2)
 * @param module - The NestJS module
 * @param endpoints - Array of endpoint information
 * @param functionType - Type of Firebase function (HTTPS or Callable)
 * @param httpsOptions - HTTPS options for the functions
 * @returns Object mapping function names to Firebase functions
 */
export function createIndividualEndpointFunctionsV2(
  module: any,
  endpoints: EndpointInfo[],
  functionType: EnumFirebaseFunctionType,
  httpsOptions: any
): Record<string, any> {
  const functions: Record<string, any> = {};

  for (const endpoint of endpoints) {
    if (functionType === EnumFirebaseFunctionType.CALLABLE) {
      // For callable functions, we'll create a simplified handler
      functions[endpoint.functionName] = createCallableForEndpoint(module, endpoint, httpsOptions);
    } else {
      // For HTTPS functions, create an express-based handler
      functions[endpoint.functionName] = createHttpsForEndpoint(module, endpoint, httpsOptions);
    }
  }

  return functions;
}

function createHttpsForEndpoint(
  module: any,
  endpoint: EndpointInfo,
  httpsOptions: any
): HttpsFunction {
  return onRequest(httpsOptions ?? {}, async (req, res) => {
    const expressServer: Express = express();
    expressServer.use(compression());
    
    // Create a focused route for this specific endpoint
    const method = endpoint.httpMethod.toString().toLowerCase();
    const path = endpoint.path || '/';
    
    await createFunction(module, expressServer);
    
    // Route the request to the specific path and method
    if (req.method?.toLowerCase() === method && req.path === path) {
      expressServer(req, res);
    } else {
      res.status(404).send('Endpoint not found');
    }
  });
}

function createCallableForEndpoint(
  module: any,
  endpoint: EndpointInfo,
  httpsOptions: any
): any {
  const { onCall } = require('firebase-functions/v2/https');
  
  return onCall(httpsOptions ?? {}, async (request: any) => {
    // Create NestJS application context
    const { NestFactory } = require('@nestjs/core');
    const app = await NestFactory.createApplicationContext(module);
    await app.init();
    
    try {
      // Get the controller instance and call the specific method
      const controllerInstance = app.get(endpoint.controllerClass);
      const result = await controllerInstance[endpoint.methodName](request.data, request);
      
      await app.close();
      return result;
    } catch (error) {
      await app.close();
      throw error;
    }
  });
}