import { EnumFirebaseFunctionVersion } from '../enums/firebase-function-version.enum';
import { IFirebaseHttpsConfigurationV1 } from '../interfaces/firebase-https-configuration-v1.interface';
import { getFirstControllerPrefix } from './controller-prefix';

export function getModuleName(module: any): string {
  const moduleVersion: EnumFirebaseFunctionVersion = (module as any)?.firebaseConfigurationVersion;
  if (moduleVersion === EnumFirebaseFunctionVersion.V2) {
    return module.name;
  }

  const moduleConfiguration: IFirebaseHttpsConfigurationV1 = (module as any)?.firebaseConfiguration;
  const moduleName =
    moduleConfiguration?.moduleNameInPrefixURL == true ||
    moduleConfiguration?.moduleNameInPrefixURL == undefined ||
    moduleConfiguration?.moduleNameInPrefixURL == null;

  return moduleName ? module.name : getFirstControllerPrefix(module);
}
