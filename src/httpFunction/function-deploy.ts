import { EnumFirebaseFunctionVersion } from '../enums/firebase-function-version.enum';
import { mergeAppProvidersIntoModule } from './module-providers';
import { scanFirebaseModules } from './scan-firebase-module';
import { createFirebaseHttpsV1 } from './v1/firebase-http-function.v1';
import { createFirebaseHttpsV2 } from './v2/firebase-http-function.v2';
import type { HttpsFunction } from 'firebase-functions/v1';

/**
 * Creates Firebase HTTPS functions for deployment.
 * @param appModule - The NestJS module to scan for Firebase modules.
 * @returns An object mapping function names to their corresponding Firebase HTTPS functions.
 **/
export function firebaseFunctionsHttpsDeployment(appModule: any): Record<string, HttpsFunction> {
  const firebaseModules = scanFirebaseModules(appModule);
  const functions: Record<string, any> = {};

  console.log('holaaaaaaaaaa')
  for (const module of firebaseModules) {
    mergeAppProvidersIntoModule(appModule, module.module);
    const name = module.module.name;
    const func =
      module.configuration.version === EnumFirebaseFunctionVersion.V2
        ? createFirebaseHttpsV2(module.module, module.configuration.configV2)
        : createFirebaseHttpsV1(module.module, module.configuration.configV1);
    functions[name] = func;
  }

  return functions;
}
