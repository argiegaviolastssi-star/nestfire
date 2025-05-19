import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { Type } from '@nestjs/common';
import { IFirebaseConfigDeployment } from '../interfaces/firebase-config-deployment.interface';
import { IFirebaseHttpsConfigurationV1 } from '../interfaces/firebase-https-configuration-v1.interface';
import { IFirebaseHttpsConfigurationV2 } from '../interfaces/firebase-https-configuration-v2.interface';
import { EnumFirebaseFunctionVersion } from '../enums/firebase-function-version.enum';

/**
 * Scans the module imports for Firebase modules and returns their options.
 * @param appModule - The module to scan.
 * @returns An array of objects containing the module and its Firebase options.
 */
export function scanFirebaseModules(appModule: Type<any>): { module: Type<any>; configuration: IFirebaseConfigDeployment }[] {
  const imports: Type<any>[] = Reflect.getMetadata(MODULE_METADATA.IMPORTS, appModule) || [];

  const found: { module: Type<any>; configuration: IFirebaseConfigDeployment }[] = [];

  for (const mod of imports) {
    const isFirebase = Reflect.getMetadata('firebase', mod);
    if (isFirebase) {
      const version: EnumFirebaseFunctionVersion = Reflect.getMetadata('firebaseConfigurationVersion', mod);
      const opts: IFirebaseHttpsConfigurationV1 | IFirebaseHttpsConfigurationV2 = Reflect.getMetadata('firebaseConfiguration', mod);

      if (version === EnumFirebaseFunctionVersion.V1) {
        const configV1 = opts as IFirebaseHttpsConfigurationV1;
        found.push({ module: mod, configuration: { version, configV1: configV1, configV2: undefined } });
      } else if (version === EnumFirebaseFunctionVersion.V2) {
        const configV2 = opts as IFirebaseHttpsConfigurationV2;
        found.push({ module: mod, configuration: { version, configV1: undefined, configV2: configV2 } });
      }
    }
  }

  return found;
}
