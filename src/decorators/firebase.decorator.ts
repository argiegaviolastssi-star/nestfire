import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { FirebaseModule } from '../firebase/firebase.module';
import { EnumFirebaseFunctionVersion } from '../enums/firebase-function-version.enum';
import { IFirebaseHttpsConfigurationV1 } from '../interfaces/firebase-https-configuration-v1.interface';
import { IFirebaseHttpsConfigurationV2 } from '../interfaces/firebase-https-configuration-v2.interface';

/**
 * Decorator to register FirebaseModule in the module imports
 * @param opts - Firebase options
 * @returns ClassDecorator
 */
export function FirebaseHttps(version: EnumFirebaseFunctionVersion.V1, configuration: IFirebaseHttpsConfigurationV1): ClassDecorator;
export function FirebaseHttps(version: EnumFirebaseFunctionVersion.V2, configuration: IFirebaseHttpsConfigurationV2): ClassDecorator;
export function FirebaseHttps(version: EnumFirebaseFunctionVersion = EnumFirebaseFunctionVersion.V1, configuration: IFirebaseHttpsConfigurationV1 | IFirebaseHttpsConfigurationV2): ClassDecorator {
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

    Reflect.defineMetadata('firebase', true, target);
    Reflect.defineMetadata('firebaseConfiguration', configuration, target);

    const existingImports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, target) || [];
    Reflect.defineMetadata(MODULE_METADATA.IMPORTS, [...existingImports, FirebaseModule], target);
  };
}
