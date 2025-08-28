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
      functions[endpoint.functionName] = createCallableHttpWrapperForEndpoint(module, endpoint, runtimeOptions, region, functionType);
    } else {
      functions[endpoint.functionName] = createHttpsForEndpoint(module, endpoint, runtimeOptions, region, functionType);
    }
  }

  return functions;
}

function createHttpsForEndpoint(
  module: any,
  endpoint: EndpointInfo,
  runtimeOptions: any,
  region?: string,
  functionType?: EnumFirebaseFunctionType
): HttpsFunction {
  const { runWith } = require('firebase-functions/v1');

  const run = runWith(runtimeOptions ?? {});
  const runRegion = region ? run.region(region) : run;

  // Set up the Express server once, outside the request handler
  const expressServer: Express = express();
  expressServer.use(compression());
  expressServer.use(express.json()); // Add JSON parsing

  // Create a focused route for this specific endpoint
  // Convert RequestMethod enum to string properly
  const RequestMethod = require('@nestjs/common').RequestMethod;
  let method: string;
  switch (endpoint.httpMethod) {
    case RequestMethod.GET:
      method = 'get';
      break;
    case RequestMethod.POST:
      method = 'post';
      break;
    case RequestMethod.PUT:
      method = 'put';
      break;
    case RequestMethod.PATCH:
      method = 'patch';
      break;
    case RequestMethod.DELETE:
      method = 'delete';
      break;
    case RequestMethod.HEAD:
      method = 'head';
      break;
    case RequestMethod.OPTIONS:
      method = 'options';
      break;
    default:
      method = 'all';
  }

  const path = endpoint.path || '/';

  // Register the route for this endpoint using Express routing
  (expressServer as any)[method](path, async (req: Request, res: Response) => {
    // Delegate to NestJS handler via createFunction
    await createFunction(module, expressServer);
  });

  // Call createFunction once during setup (not per request)
  createFunction(module, expressServer);

  // Pass all requests to Express for routing
  return runRegion.https.onRequest(expressServer);
}

function createCallableHttpWrapperForEndpoint(
  module: any,
  endpoint: EndpointInfo,
  runtimeOptions: any,
  region?: string,
  functionType?: EnumFirebaseFunctionType
): any {
  const { runWith } = require('firebase-functions/v1');
  const run = runWith(runtimeOptions ?? {});
  const runRegion = region ? run.region(region) : run;

  const expressServer: Express = express();
  expressServer.use(express.json());
  expressServer.use(compression());

  expressServer.post('*', async (req: any, res: any) => {
    const { NestFactory } = require('@nestjs/core');
    const app = await NestFactory.createApplicationContext(module);
    await app.init();
    try {
      const controllerInstance = app.get(endpoint.controllerClass);
      const body: any = (req as any).body;
      const payload = body && typeof body === 'object' && 'data' in body ? body.data : body;

      // Handle path parameters extraction based on function type
      if (endpoint.path && endpoint.path.includes(':')) {
        const paramMatches = endpoint.path.match(/:(\w+)/g);
        if (paramMatches) {
          const paramNames = paramMatches.map((match) => match.substring(1));

          if (functionType === EnumFirebaseFunctionType.CALLABLE) {
            // For CALLABLE: extract parameters from payload
            const paramValues: any[] = [];
            const bodyData = { ...payload };

            paramNames.forEach((paramName) => {
              if (payload && typeof payload === 'object' && paramName in payload) {
                paramValues.push(payload[paramName]);
                delete bodyData[paramName];
              } else {
                throw new Error(`Missing required parameter '${paramName}' in payload`);
              }
            });

            const result = await controllerInstance[endpoint.methodName](...paramValues, bodyData);
            if (!res.headersSent) {
              res.json({ result });
            }
          } else {
            // For HTTPS: use standard parameter handling
            const result = await controllerInstance[endpoint.methodName](payload, req);
            if (!res.headersSent) {
              res.json({ result });
            }
          }
        } else {
          const result = await controllerInstance[endpoint.methodName](payload, req);
          if (!res.headersSent) {
            res.json({ result });
          }
        }
      } else {
        const result = await controllerInstance[endpoint.methodName](payload, req);
        if (!res.headersSent) {
          res.json({ result });
        }
      }

      await app.close();
    } catch (error: any) {
      await app.close();
      res.status(500).json({ error: error?.message || 'Internal server error' });
    }
  });

  return runRegion.https.onRequest(expressServer);
}
