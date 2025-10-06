import { RuntimeOptions } from "firebase-functions/v1";
import { EnumFirebaseFunctionType } from '../enums/firebase-function-type.enum';

export interface IFirebaseHttpsConfigurationV1 extends RuntimeOptions {
  /**
   * The type of Firebase function to create.
   * @default EnumFirebaseFunctionType.HTTPS
   */
  functionType?: EnumFirebaseFunctionType;
  
  /**
   * Export each controller method as a separate Firebase function.
   * When enabled, each endpoint will be deployed as an individual function.
   * @default false
   */
  exportSeparately?: boolean;
}