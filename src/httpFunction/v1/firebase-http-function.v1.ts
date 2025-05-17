import express from 'express';
import { Express } from 'express-serve-static-core';
import compression from 'compression';
import { HttpsFunction, Request, Response, runWith } from 'firebase-functions/v1';
import { createFunction } from '../create-function';

const expressServer: Express = express();
expressServer.use(compression());

/**
 * Creates a Firebase HTTPS function V1 with the specified memory and region.
 * @param {string} memory - The memory allocation for the function (e.g., '128MB', '256MB', etc.).
 * @param {any} module - The NestJS module to be used for the function.
 * @param {string} [region='us-central1'] - The region where the function will be deployed.
 * @param {number} [instances=0] - The minimum number of instances for the function.
 * @returns {HttpsFunction} - The created Firebase HTTPS function.
 */
export function createFirebaseHttpsV1(
  memory: '128MB' | '256MB' | '512MB' | '1GB' | '2GB' | '4GB' | '8GB',
  module: any,
  region: string = 'us-central1',
  instances: number = 0
): HttpsFunction {
  const totalInstances = instances;
  return runWith({ memory, minInstances: totalInstances })
    .region(region)
    .https.onRequest(async (request: Request, response: Response) => {
      await createFunction(module, expressServer);
      expressServer(request, response);
    });
}
