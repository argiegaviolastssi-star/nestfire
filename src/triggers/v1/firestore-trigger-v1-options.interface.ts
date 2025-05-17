export interface FirestoreTriggerV1Options {
  memory?: '128MB' | '256MB' | '512MB' | '1GB' | '2GB' | '4GB' | '8GB';
  timeoutSeconds?: number;
  minInstances?: number;
  maxInstances?: number;
}
