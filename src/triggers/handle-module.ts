import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

const appCache = new Map<string, INestApplication>();
export async function getModule(module: any): Promise<INestApplication> {
  const moduleName = module?.name;
  try {
    if (!appCache.has(moduleName)) {
      const app = await NestFactory.create(module);
      appCache.set(moduleName, app);
    }

    return appCache.get(moduleName)!;
  } catch (error) {
    appCache.delete(moduleName);
  }
}
