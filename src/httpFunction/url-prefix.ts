import { EnumFirebaseFunctionVersion } from '../enums/firebase-function-version.enum';
import { IFirebaseConfigDeployment } from '../interfaces/firebase-config-deployment.interface';

export function getUrlPrefix(module: any, moduleConfiguration: IFirebaseConfigDeployment): string {
  const moduleVersion = moduleConfiguration?.version;

  if (moduleVersion === EnumFirebaseFunctionVersion.V1 && moduleConfiguration?.configV1?.customUrlPrefix) {
    return moduleConfiguration?.configV1?.customUrlPrefix;
  }

  return module?.name;
}
