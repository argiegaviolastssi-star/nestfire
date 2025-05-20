import 'reflect-metadata';
import { EnumFirebaseFunctionVersion } from '../enums/firebase-function-version.enum';
import { IFirebaseHttpsConfigurationV1 } from '../interfaces/firebase-https-configuration-v1.interface';
import { IFirebaseHttpsConfigurationV2 } from '../interfaces/firebase-https-configuration-v2.interface';

/**
 * Decorator to register FirebaseModule in the module imports
 * @param configuration - Firebase function configuration
 * @returns ClassDecorator
 */
export function FirebaseHttps(version: EnumFirebaseFunctionVersion.V1, configuration: IFirebaseHttpsConfigurationV1): ClassDecorator;
export function FirebaseHttps(version: EnumFirebaseFunctionVersion.V2, configuration: IFirebaseHttpsConfigurationV2): ClassDecorator;
export function FirebaseHttps(
  version: EnumFirebaseFunctionVersion = EnumFirebaseFunctionVersion.V1,
  configuration: IFirebaseHttpsConfigurationV1 | IFirebaseHttpsConfigurationV2
): ClassDecorator {
  return (target: any) => {
    Object.defineProperty(target, 'firebaseConfigurationVersion', {
      value: version,
      enumerable: true,
      writable: false,
    });
    Object.defineProperty(target, 'firebaseConfiguration', {
      value: configuration,
      writable: false,
    });
  };
}
