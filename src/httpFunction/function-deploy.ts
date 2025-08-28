import { EnumFirebaseFunctionVersion } from '../enums/firebase-function-version.enum';
import { EnumFirebaseFunctionType } from '../enums/firebase-function-type.enum';
import { getUrlPrefix } from './url-prefix';
import { mergeAppProvidersIntoModule } from './module-providers';
import { scanFirebaseModules } from './scan-firebase-module';
import { scanModuleEndpoints } from './scan-endpoints';
import { createFirebaseHttpsV1 } from './v1/firebase-http-function.v1';
import { createFirebaseHttpsV2 } from './v2/firebase-http-function.v2';
import { createFirebaseCallableV1 } from './v1/firebase-callable-function.v1';
import { createFirebaseCallableV2 } from './v2/firebase-callable-function.v2';
import { createIndividualEndpointFunctionsV1 } from './v1/individual-endpoints.v1';
import { createIndividualEndpointFunctionsV2 } from './v2/individual-endpoints.v2';
import type { HttpsFunction } from 'firebase-functions/v1';

/**
 * Creates Firebase HTTPS functions for deployment.
 * @param appModule - The NestJS module to scan for Firebase modules.
 * @returns An object mapping function names to their corresponding Firebase HTTPS functions.
 **/
export function firebaseFunctionsHttpsDeployment(appModule: any): Record<string, HttpsFunction> {
  const firebaseModules = scanFirebaseModules(appModule);
  const functions: Record<string, any> = {};

  for (const module of firebaseModules) {
    mergeAppProvidersIntoModule(appModule, module.module);
    
    const config = module.configuration;
    const isV2 = config.version === EnumFirebaseFunctionVersion.V2;
    const moduleConfig = isV2 ? config.configV2 : config.configV1;
    
    // Determine function type (default to HTTPS for backward compatibility)
    const functionType = moduleConfig?.functionType || EnumFirebaseFunctionType.HTTPS;
    
    // Check if individual endpoint export is enabled
    const exportSeparately = moduleConfig?.exportSeparately || false;
    
    if (exportSeparately) {
      // Create individual functions for each endpoint
      const endpoints = scanModuleEndpoints(module.module);
      
      const individualFunctions = isV2
        ? createIndividualEndpointFunctionsV2(module.module, endpoints, functionType, moduleConfig)
        : createIndividualEndpointFunctionsV1(module.module, endpoints, functionType, moduleConfig);
      
      // Add all individual functions to the result
      Object.assign(functions, individualFunctions);
    } else {
      // Create a single function for the entire module (original behavior)
      const name = getUrlPrefix(module.module, module.configuration);
      
      let func;
      if (functionType === EnumFirebaseFunctionType.CALLABLE) {
        // Create callable function
        func = isV2
          ? createFirebaseCallableV2(module.module, config.configV2)
          : createFirebaseCallableV1(module.module, config.configV1);
      } else {
        // Create HTTPS function (original behavior)
        func = isV2
          ? createFirebaseHttpsV2(module.module, config.configV2)
          : createFirebaseHttpsV1(module.module, config.configV1);
      }
      
      functions[name] = func;
    }
  }

  return functions;
}
