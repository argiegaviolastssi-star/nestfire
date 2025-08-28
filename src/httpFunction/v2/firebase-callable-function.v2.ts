import { onCall } from 'firebase-functions/v2/https';
import { deleteImportedControllers } from '../delete-imported-controllers';
import { IFirebaseHttpsConfigurationV2 } from '../../interfaces/firebase-https-configuration-v2.interface';
import { removePathFromSingleController } from '../url-prefix';
import { handleModuleForCallable } from '../callable-handler';

/**
 * Creates a Firebase Callable function V2 with the specified options.
 * @param {any} module - The NestJS module to be used for the function.
 * @param {IFirebaseHttpsConfigurationV2} callableOptions - The options for the Callable function.
 * @param {boolean} [isolateControllers=true] - Whether to remove controllers from imported modules.
 * @returns {any} - The created Firebase Callable function.
 */
export function createFirebaseCallableV2(module: any, callableOptions?: IFirebaseHttpsConfigurationV2, isolateControllers: boolean = true): any {
  if (isolateControllers) {
    deleteImportedControllers(module);
  }

  // Always remove path from single controller for V2 (equivalent to removeControllerPrefix: true)
  removePathFromSingleController(module);

  return onCall(callableOptions ?? {}, async (request: any) => {
    return await handleModuleForCallable(module, request.data, request);
  });
}