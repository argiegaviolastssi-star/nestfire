import { Change, CloudFunction, firestore } from 'firebase-functions/v1';

export interface ITrigger {
  [key: string]: CloudFunction<Change<firestore.DocumentSnapshot>>;
}
