import { Change, CloudFunction, firestore } from 'firebase-functions';

export interface Trigger {
  [key: string]: CloudFunction<Change<firestore.DocumentSnapshot>>;
}
