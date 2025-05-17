import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { Auth, getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, App, AppOptions } from 'firebase-admin/app';
import { Injectable } from '@nestjs/common';
import { getStorage, Storage } from 'firebase-admin/storage';
import { ConfigService } from '@nestjs/config';
import { credential } from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class Firebase {
  private firestore: Firestore;
  private auth: Auth;
  private storage: Storage;
  private app: App;

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  get Firestore(): Firestore {
    return this.firestore;
  }

  get Auth(): Auth {
    return this.auth;
  }

  get Storage(): Storage {
    return this.storage;
  }

  get App(): App {
    return this.app;
  }

  /**
   * Initialize Firebase app
   * @returns {void}
   * @private
   * @memberof Firebase
   * @description
   * This method initializes the Firebase app with the provided configuration.
   * It checks if the app is already initialized and logs the name of the app.
   * If the app is not initialized, it creates a new app instance and sets up Firestore, Storage, and Auth services.
   * It also sets Firestore settings if provided in the configuration.
   */
  initializeFirebase(): void {
    this.checkFirebaseApp();
    const appName = `app-${Math.random().toString(36).substring(7)}`;
    const firebaseConfig: AppOptions = this.getFirebaseConfig();
    const app = initializeApp(firebaseConfig, appName);
    if (!this.app?.name || this.app?.name === '' || this.app?.name !== app?.name) {
      this.app = app;
      this.firestore = getFirestore(app);
      this.storage = getStorage(app);
      this.auth = getAuth(app);

      if (this.configService.get('FIRESTORE_SETTINGS')) {
        this.firestore.settings(JSON.parse(this.configService.get('FIRESTORE_SETTINGS')));
      }
    }
  }

  /**
   * @returns {void}
   * @private
   * @memberof Firebase
   * Check if Firebase app is already initialized and log the name of the app
   */
  private checkFirebaseApp(): void {
    const apps = getApps();
    if (apps.length > 0) {
      const appName = apps.filter((app) => app.name !== '[DEFAULT]');
      if (appName.length > 0) {
        const names = appName.map((app) => app?.name);
        console.error('Error, Firebase app already initialized: ', names.join(', '));
      }
    }
  }

  /**
   * Get Firebase configuration
   * @returns {AppOptions}
   * @private
   * @memberof Firebase
   * @description
   * This method retrieves the Firebase configuration from the environment variables or service account key path.
   * It returns an AppOptions object containing the credential information.
   */

  private getFirebaseConfig(): AppOptions {
    const firebaseConfig: AppOptions = {
      credential: credential.applicationDefault(),
    };

    if (this.configService.get('SERVICE_ACCOUNT_KEY')) {
      firebaseConfig.credential = credential.cert(JSON.parse(this.configService.get('SERVICE_ACCOUNT_KEY')));
    } else {
      firebaseConfig.credential = credential.cert(require(path.resolve(this.configService.get('SERVICE_ACCOUNT_KEY_PATH'))));
    }

    return firebaseConfig;
  }
}
