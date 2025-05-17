import express from 'express';
import { Express } from 'express-serve-static-core';
import compression from 'compression';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { HttpsFunction, Request, Response, runWith } from 'firebase-functions/v1';
import { deleteImportedControllers } from '../utils';

const expressServer: Express = express();
expressServer.use(compression());

const loadedFunctionsV1: { [key: string]: any } = {};
async function createFunctionV1(module: any): Promise<INestApplication> {
  const moduleName = module.constructor.name;
  if (loadedFunctionsV1[moduleName]) {
    return loadedFunctionsV1[moduleName];
  }

  deleteImportedControllers(module);
  const app: INestApplication = await NestFactory.create(module, new ExpressAdapter(expressServer));

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    maxAge: 86400 * 30 * 12,
  });
  const appInit = await app.init();
  loadedFunctionsV1[moduleName] = appInit;
  return appInit;
}

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
      await createFunctionV1(module);
      expressServer(request, response);
    });
}
