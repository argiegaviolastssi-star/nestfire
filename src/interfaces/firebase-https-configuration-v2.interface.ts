import { HttpsOptions } from 'firebase-functions/v2/https';
import { EnumFirebaseFunctionType } from '../enums/firebase-function-type.enum';

export interface IFirebaseHttpsConfigurationV2 extends HttpsOptions {
    /**
     * Remove the prefix from the controller name.
     * Change the functions name and put the controller name as the function name.
     * It only works if the module has only one controller.
     */
    removeControllerPrefix?: boolean;
    
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