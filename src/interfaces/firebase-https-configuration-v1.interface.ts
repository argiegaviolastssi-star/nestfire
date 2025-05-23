import { RuntimeOptions } from "firebase-functions/v1";

export interface IFirebaseHttpsConfigurationV1 extends RuntimeOptions {
    /**
     * !important: Do not use false when you have mora than one controller in the module.
     * @default true
     */
    moduleNameInPrefixURL?: boolean;
}