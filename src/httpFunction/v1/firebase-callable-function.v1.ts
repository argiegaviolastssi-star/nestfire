import { runWith, SUPPORTED_REGIONS } from 'firebase-functions/v1';
import type { HttpsFunction } from 'firebase-functions/v1';
import { deleteImportedControllers } from '../delete-imported-controllers';
import { removePathFromSingleController } from '../url-prefix';
import { IFirebaseHttpsConfigurationV1 } from '../../interfaces/firebase-https-configuration-v1.interface';
import { handleModuleForCallable } from '../callable-handler';

/**
 * Creates a Firebase Callable function V1 with the specified memory and region.
 * @param {any} module - The NestJS module to be used for the function.
 * @param {IFirebaseHttpsConfigurationV1} [runtimeOptions] - The runtime options for the function.
 * @param {string} [region] - The region for the function.
 * @param {boolean} [isolateControllers=true] - Whether to remove controllers from imported modules.
 * @returns {HttpsFunction} - The created Firebase Callable function.
 */
export function createFirebaseCallableV1(
  module: any,
  runtimeOptions?: IFirebaseHttpsConfigurationV1,
  region?: string,
  isolateControllers: boolean = true
): HttpsFunction {
  validateRegion(region);

  const run = runWith(runtimeOptions ?? {});
  const runRegion = region ? run.region(region) : run;

  if (isolateControllers) {
    deleteImportedControllers(module);
  }

  removePathFromSingleController(module);

  return runRegion.https.onCall(async (data: any, context: any) => {
    return await handleModuleForCallable(module, data, context);
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