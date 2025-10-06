import express, { Express } from 'express';
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
      // Expose separated callable endpoints as HTTP POST handlers (uniform interface via POST { data: ... })
      functions[endpoint.functionName] = createCallableHttpWrapperForEndpoint(module, endpoint, httpsOptions, functionType);
    } else {
      functions[endpoint.functionName] = createHttpsForEndpoint(module, endpoint, httpsOptions, functionType);
    }
  }

  return functions;
}

function createHttpsForEndpoint(module: any, endpoint: EndpointInfo, httpsOptions: any, functionType: EnumFirebaseFunctionType): HttpsFunction {
  const expressServer: Express = express();
  expressServer.use(compression());
  expressServer.use(express.json()); // Add JSON parsing

  // Register the route for this specific endpoint
  // Convert RequestMethod enum to string - RequestMethod is numeric
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

  // For individual HTTPS functions, we register root path and extract parameters from the URL
  // Firebase Functions have fixed URLs, so we can't use dynamic routing like /userUpdate/:id
  const routePath = '/*'; // Catch all paths

  // Register only the specific route handler for this endpoint
  // This ensures only the intended route is exposed
  const { NestFactory } = require('@nestjs/core');
  (expressServer as any)[method](routePath, async (req: any, res: any) => {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(module);
    await app.init();
    try {
      // Get the controller instance and call the specific method
      const controllerInstance = app.get(endpoint.controllerClass);

      // For HTTPS functions, extract path parameters from the URL path
      // Firebase Functions have fixed URLs, so we parse the path manually
      let result;
      if (endpoint.path && endpoint.path.includes(':')) {
        // Method expects path parameters - extract them from req.path
        const paramMatches = endpoint.path.match(/:(\w+)/g);
        if (paramMatches) {
          const paramNames = paramMatches.map((match) => match.substring(1));

          // Parse the path to extract parameters
          // req.path will be something like "/123" for userUpdate/123
          const pathSegments = req.path.split('/').filter((segment: string) => segment.length > 0);

          if (pathSegments.length !== paramNames.length) {
            throw new Error(`Expected ${paramNames.length} path parameters, got ${pathSegments.length}. Path: ${req.path}`);
          }

          const paramValues = pathSegments;

          // Call with path params first, then body
          result = await controllerInstance[endpoint.methodName](...paramValues, req.body);
        } else {
          result = await controllerInstance[endpoint.methodName](req.body, req);
        }
      } else {
        // Pass req.body for methods without path parameters
        result = await controllerInstance[endpoint.methodName](req.body || {}, req);
      }

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
  // Avoid explicit Express Request/Response typings here to prevent version mismatches
  return onRequest(httpsOptions ?? {}, (req, res) => {
    expressServer(req as any, res as any);
  });
}

function createCallableHttpWrapperForEndpoint(module: any, endpoint: EndpointInfo, httpsOptions: any, functionType: EnumFirebaseFunctionType): any {
  const app = express();
  app.use(express.json());
  app.use(compression());

  app.post('*', async (req: any, res: any) => {
    const { NestFactory } = require('@nestjs/core');
    const appCtx = await NestFactory.createApplicationContext(module);
    await appCtx.init();
    try {
      const controllerInstance = appCtx.get(endpoint.controllerClass);
      const body = req.body;
      const payload = body && typeof body === 'object' && 'data' in body ? body.data : body;

      // For methods that expect path parameters, handle differently based on function type
      if (endpoint.path && endpoint.path.includes(':')) {
        // Extract parameter names from path (e.g., '/user/:id' -> ['id'])
        const paramMatches = endpoint.path.match(/:(\w+)/g);
        if (paramMatches) {
          const paramNames = paramMatches.map((match) => match.substring(1)); // Remove ':'

          if (functionType === EnumFirebaseFunctionType.CALLABLE) {
            // For CALLABLE functions: parameters come from payload
            const paramValues: any[] = [];
            const bodyData = { ...payload };

            // Extract each parameter from payload
            paramNames.forEach((paramName) => {
              if (payload && typeof payload === 'object' && paramName in payload) {
                paramValues.push(payload[paramName]);
                delete bodyData[paramName]; // Remove from body data
              } else {
                throw new Error(`Missing required parameter '${paramName}' in payload`);
              }
            });

            // Call method with parameters and body separately
            const result = await controllerInstance[endpoint.methodName](...paramValues, bodyData);
            if (!res.headersSent) {
              res.json({ result });
            }
          } else {
            // For HTTPS functions: parameters should come from URL path (normal REST behavior)
            // Since we're creating individual endpoints, we expect the full payload as body
            // and path parameters would be handled by the original HTTP routing
            const result = await controllerInstance[endpoint.methodName](payload, req);
            if (!res.headersSent) {
              res.json({ result });
            }
          }
        } else {
          // No parameters, call with payload only
          const result = await controllerInstance[endpoint.methodName](payload, req);
          if (!res.headersSent) {
            res.json({ result });
          }
        }
      } else {
        // No path parameters, call with payload only
        const result = await controllerInstance[endpoint.methodName](payload, req);
        if (!res.headersSent) {
          res.json({ result });
        }
      }

      await appCtx.close();
    } catch (error: any) {
      await appCtx.close();
      res.status(500).json({ error: error?.message || 'Internal server error' });
    }
  });

  return onRequest(httpsOptions ?? {}, (req, res) => app(req as any, res as any));
}
