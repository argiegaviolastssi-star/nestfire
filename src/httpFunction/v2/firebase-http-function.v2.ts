import express from 'express';
import { Express } from 'express-serve-static-core';
import compression from 'compression';
import { HttpsFunction, HttpsOptions, onRequest } from 'firebase-functions/v2/https';
import { createFunction } from '../create-function';
import { deleteImportedControllers } from '../delete-imported-controllers';

const expressServer: Express = express();
expressServer.use(compression());

/**
 * Creates a Firebase HTTPS function with the specified memory and region.
 * @param {any} module - The NestJS module to be used for the function.
 * @param {HttpsOptions} httpsOptions - The options for the HTTPS function.
 * @param {boolean} [isolateControllers=true] - Whether to remove controllers from imported modules.
 * @returns {HttpsFunction} - The created Firebase HTTPS function.
 */
export function createFirebaseHttpsV2(module: any, httpsOptions?: HttpsOptions, isolateControllers: boolean = true): HttpsFunction {
  if (isolateControllers) {
    deleteImportedControllers(module);
  }

  return onRequest(httpsOptions ?? {}, async (req, res) => {
    await createFunction(module, expressServer);
    expressServer(req, res);
  });
}
