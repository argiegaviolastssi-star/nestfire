import { Change, CloudFunction, EventContext, RuntimeOptions, runWith } from 'firebase-functions';
import * as admin from 'firebase-admin';

export function eventTrigger(
  eventType: string,
  document: string,
  handler: (change: Change<any> | admin.firestore.QueryDocumentSnapshot, context: EventContext) => Promise<any> | any,
  options: RuntimeOptions = {}
): CloudFunction<Change<any>> {
  try {
    const configured = runWith({
      memory: options.memory ?? '1GB',
      timeoutSeconds: options.timeoutSeconds ?? 60,
      minInstances: options.minInstances ?? 0,
      ...options,
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
