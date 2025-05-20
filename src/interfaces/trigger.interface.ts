import { Change, CloudFunction, firestore } from 'firebase-functions';

export interface ITrigger {
  [key: string]: CloudFunction<Change<firestore.DocumentSnapshot>>;
}
