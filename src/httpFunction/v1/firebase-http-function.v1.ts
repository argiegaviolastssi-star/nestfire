import express from 'express';
import { Express } from 'express-serve-static-core';
import compression from 'compression';
import { HttpsFunction, Request, Response, RuntimeOptions, runWith, SUPPORTED_REGIONS } from 'firebase-functions/v1';
import { createFunction } from '../create-function';
import { getFunctionV1Config } from '../get-function-v1-config';
import { removeControllerPrefix } from '../controller-prefix';

const expressServer: Express = express();
expressServer.use(compression());

/**
 * Creates a Firebase HTTPS function V1 with the specified memory and region.
 * @param {any} module - The NestJS module to be used for the function.
 * @param {RuntimeOptions} [runtimeOptions] - The runtime options for the function.
 * @param {string} [region] - The region for the function.
 * @param {boolean} [isolateControllers=true] - Whether to remove controllers from imported modules.
 * @returns {HttpsFunction} - The created Firebase HTTPS function.
 */
export function createFirebaseHttpsV1(module: any, runtimeOptions?: RuntimeOptions, region?: string, isolateControllers: boolean = true): HttpsFunction {
  validateRegion(region);

  const run = runWith(runtimeOptions ?? {});
  const runRegion = region ? run.region(region) : run;

  const config = getFunctionV1Config(module);
  const moduleNameInPrefixURL = config?.moduleNameInPrefixURL === true || config?.moduleNameInPrefixURL === undefined || config?.moduleNameInPrefixURL === null;
  if (!moduleNameInPrefixURL) {
    removeControllerPrefix(module);
  }

  return runRegion.https.onRequest(async (request: Request, response: Response) => {
    await createFunction(module, expressServer, isolateControllers);
    expressServer(request, response);
  });
}

function validateRegion(region: string): void {
  if (!region) {
    return;
  }
  if (!Array < (typeof SUPPORTED_REGIONS).includes(region)) {
    throw new Error(`Unsupported region: ${region}.`);
  }
}
