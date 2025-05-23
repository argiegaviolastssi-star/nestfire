import { IFirebaseHttpsConfigurationV1 } from "../interfaces/firebase-https-configuration-v1.interface";

export function getFunctionV1Config(module: any): IFirebaseHttpsConfigurationV1 {
    const moduleConfiguration: IFirebaseHttpsConfigurationV1 = (module as any)?.firebaseConfiguration;
    return moduleConfiguration;
}