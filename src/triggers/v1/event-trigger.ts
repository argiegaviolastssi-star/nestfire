import { Change, CloudFunction, EventContext, runWith } from 'firebase-functions';
import { FirestoreTriggerV1Options } from './firestore-trigger-v1-options.interface';
import * as admin from 'firebase-admin';

export function eventTrigger(
  eventType: string,
  document: string,
  handler: (change: Change<any> | admin.firestore.QueryDocumentSnapshot, context: EventContext) => Promise<any> | any,
  options: FirestoreTriggerV1Options = {}
): CloudFunction<Change<any>> {
  try {
    const configured = runWith({
      memory: options.memory ?? '2GB',
      timeoutSeconds: options.timeoutSeconds ?? 60,
      minInstances: options.minInstances ?? 0,
      maxInstances: options.maxInstances,
    });

    return (configured.firestore.document(document) as any)[eventType]((snapshot: admin.firestore.QueryDocumentSnapshot, context: EventContext) =>
      handler(snapshot, context)
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error [eventTrigger] Path: ${document}. Message: ${error.message}. Stack: ${error.stack}`);
    }
    throw error;
  }
}
