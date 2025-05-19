import { EnumFirebaseFunctionVersion } from '../enums/firebase-function-version.enum';
import { IFirebaseHttpsConfigurationV1 } from './firebase-https-configuration-v1.interface';
import { IFirebaseHttpsConfigurationV2 } from './firebase-https-configuration-v2.interface';

export interface IFirebaseConfigDeployment {
  version: EnumFirebaseFunctionVersion;
  configV1: IFirebaseHttpsConfigurationV1;
  configV2: IFirebaseHttpsConfigurationV2;
}
