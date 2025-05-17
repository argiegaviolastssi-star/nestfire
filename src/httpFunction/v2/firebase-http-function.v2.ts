import express from 'express';
import { Express } from 'express-serve-static-core';
import compression from 'compression';
import { HttpsFunction, onRequest } from 'firebase-functions/v2/https';
import { MemoryOption } from 'firebase-functions/v2/options';
import { createFunction } from '../create-function';

const expressServer: Express = express();
expressServer.use(compression());

/**
 * Creates a Firebase HTTPS function with the specified memory and region.
 * @param {MemoryOption} memory - The memory allocation for the function (e.g., '128MiB', '256MiB', etc.).
 * @param {any} module - The NestJS module to be used for the function.
 * @param {number} [instances=1] - The minimum number of instances for the function.
 * @returns {HttpsFunction} - The created Firebase HTTPS function.
 */
export function createHttpsFunction(memory: MemoryOption, module: any, instances: number = 0): HttpsFunction {
  return onRequest(
    {
      memory,
      minInstances: instances,
    },
    async (req, res) => {
      await createFunction(module, expressServer);
      expressServer(req, res);
    }
  );
}
