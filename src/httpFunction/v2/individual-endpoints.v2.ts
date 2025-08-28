import express from 'express';
import { Express, Request, Response } from 'express-serve-static-core';
import compression from 'compression';
import { HttpsFunction, onRequest } from 'firebase-functions/v2/https';
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
  const expressServer: Express = express();
  expressServer.use(compression());

  // Register the route for this specific endpoint
  const method = endpoint.httpMethod.toString().toLowerCase();
  const path = endpoint.path || '/';

  // Register only the specific route handler for this endpoint
  // This ensures only the intended route is exposed
  const { NestFactory } = require('@nestjs/core');
  (expressServer as any)[method](path, async (req: Request, res: Response) => {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(module);
    await app.init();
    try {
      // Get the controller instance and call the specific method
      const controllerInstance = app.get(endpoint.controllerClass);
      // Pass req and res, or map req to method arguments as needed
      const result = await controllerInstance[endpoint.methodName](req, res);
      // If the controller method does not handle res, send result
      if (!res.headersSent) {
        res.json(result);
      }
      await app.close();
    } catch (error: any) {
      await app.close();
      res.status(500).json({ error: error?.message || 'Internal server error' });
    }
  });
  return onRequest(httpsOptions ?? {}, (req: Request, res: Response) => {
    expressServer(req, res);
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
      // For callable functions, pass the data directly and the request context
      // Callable functions don't follow HTTP semantics, so we treat all as equivalent to POST
      const result = await controllerInstance[endpoint.methodName](request.data, request);
      
      await app.close();
      return result;
    } catch (error) {
      await app.close();
      throw error;
    }
  });
}