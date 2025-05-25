import { HttpsOptions } from 'firebase-functions/v2/https';

export interface IFirebaseHttpsConfigurationV2 extends HttpsOptions {
    /**
     * Remove the prefix from the controller name.
     * Change the functions name and put the controller name as the function name.
     * It only works if the module has only one controller.
     */
    removeControllerPrefix?: boolean;
}