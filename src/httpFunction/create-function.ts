import { Express } from 'express-serve-static-core';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';

const loadedFunctions: { [key: string]: any } = {};

export async function createFunction(module: any, expressServer: Express): Promise<INestApplication> {
  const moduleName = module?.constructor?.name;
  if (!moduleName) {
    throw new Error('Module name is not defined. Ensure the module is properly initialized.');
  }

  try {
    if (loadedFunctions[moduleName]) {
      return loadedFunctions[moduleName];
    }

    const app: INestApplication = await NestFactory.create(module, new ExpressAdapter(expressServer));
    app.enableCors({
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      maxAge: 86400 * 30 * 12,
    });
    const appInit = await app.init();
    loadedFunctions[moduleName] = appInit;

    return appInit;
  } catch (error) {
    loadedFunctions[moduleName] = null;
    throw new Error(`Failed to create function for module ${moduleName}: ${error}`);
  }
}
