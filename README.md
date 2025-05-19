
<p align="center">
  <img src="./assets/nestfire_logo.png" alt="NestFire Logo" width="190" />
</p>

<h1 align="center">NestFire</h1>

<p align="center">Library to use Firebase and host a NestJS backend on Firebase Functions.</p>


- [⚙️ Configuration](#️-configuration)
- [🔥 Firebase Usage](#-firebase-usage)
  - [Modules](#modules)
  - [Firestore](#firestore)
  - [Auth](#auth)
  - [Storage](#storage)
- [🚀 Deploy Firebase Functions](#-deploy-firebase-functions)
  - [HTTPS](#https)
  - [Firestore Trigger](#firestore-trigger)

<br>

# ⚙️ Configuration

## 📦 Installation

```bash
npm install nestfire
```

## ⚙️ Environment Variables

Add the private key in your `.env` file as`SERVICE_ACCOUNT_KEY` or `SERVICE_ACCOUNT_KEY_PATH`
> **To generate a private key file for your service account:**
> 1. In the Firebase console, open Settings > [Service Accounts](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk?fb_utm_source=chatgpt.com&_gl=1*bcauiw*_ga*NDkyNDQxNTI4LjE3NDI1MDc1ODA.*_ga_CW55HF8NVT*czE3NDc2ODU0MDUkbzUwJGcxJHQxNzQ3Njg1OTAyJGo1MSRsMCRoMCRkZS1xTjE2TUlaRU9UMG9QaFQteFFJeFhPV1o5SEhCSkcxZw..)
> 2. Click Generate New Private Key, then confirm by clicking Generate Key.
> 3. Securely store the JSON file containing the key.

<br>

`.env` file:
```bash
# Either embed the JSON key directly
SERVICE_ACCOUNT_KEY={
  "type": "service_account",
  "project_id": "my-project-id",
  "private_key_id": "ABCD1234...",
  "private_key": "-----BEGIN PRIVATE KEY-----
MIIEv...
-----END PRIVATE KEY-----",
  "client_email": "firebase-adminsdk@my-project.iam.gserviceaccount.com",
  "client_id": "1234567890",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}

# Or point to a file path
SERVICE_ACCOUNT_KEY_PATH="./serviceAccountKey.json"
```

> **Note:** You must load `.env` in your code (e.g., using [dotenv](https://www.npmjs.com/package/dotenv)).

<br>

# 🔥 Firebase Usage

Import `FirebaseModule` into **any** module where you need Firebase.

### Modules
Import FirebaseModule and ConfigModule. Use FirebaseModule from nestfire.
```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from 'nestfire';
import { BooksService } from './books.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    FirebaseModule,
  ],
  providers: [BooksService],
  exports: [BooksService],
  controllers: [BooksController],
})
export class BooksModule {}
```

### Firestore
Injecting Firebase. Use Firebase from nestfire.

```ts
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { Firebase } from 'nestfire';

@Injectable()
export class BookService {
  constructor(private readonly firebase: Firebase) {}

  async createBook(book: CreateBookDto) {
    //This use the default database
    await this.firebase.firestore().collection('books').add(book);
  }

  async createBookInSpecificDatabase(book: CreateBookDto) {
    //This use a specific database
    await this.firebase.firestore('specific-database').collection('books').add(book);
  }
}

```

### Auth

### Storage

<br>

## 🚀 Deploy Firebase Functions 
When you install nestfire it will create a `index.ts` file in the root of your project. This file will be used to deploy your functions.
The `firebase.json` file have to be configured to use the `index.ts` file.

In your `firebase.json` file, add the following:

```json
{
  "functions": {
    "source": ".",
    "runtime": "nodejs22",
  }
}
```

### HTTPS
Add the `@FirebaseHttps` decorator in the modules you want to deploy.
The first argument is the version of the function you want to deploy. The second argument is an object with the options for the function.

##### V1
Version: EnumFirebaseFunctionVersion.V1
Data: [RuntimeOptions](https://firebase.google.com/docs/reference/functions/firebase-functions.runtimeoptions)

```ts
@FirebaseHttps(EnumFirebaseFunctionVersion.V1, { memory: '256MB' })
```
<br>

##### V2
Version: EnumFirebaseFunctionVersion.V2
Data: [HttpsOptions](https://firebase.google.com/docs/reference/functions/2nd-gen/node/firebase-functions.https.httpsoptions)

```ts
@FirebaseHttps(EnumFirebaseFunctionVersion.V1, { memory: '256MiB' })
```
<br>

##### Example
```ts
import { Module } from '@nestjs/common';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { EnumFirebaseFunctionVersion, FirebaseHttps } from 'nestfire';

@FirebaseHttps(EnumFirebaseFunctionVersion.V2, { memory: '256MiB' })
@Module({
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class BookModule {}
```

> **Note:** You can deploy with the command:  firebase deploy --only function

<br>

### Firestore Trigger

Register Firestore triggers that will be executed when a document is created or updated in Firestore.
Example for order creations and updates:

```ts
import { Trigger, eventTrigger } from 'nestfire';
import { EventContext, Change, DocumentSnapshot } from 'firebase-functions/v1';

export const orderTrigger: Trigger = {
  onCreate: eventTrigger(
    'onCreate',
    'projects/{projectId}/orders/{orderId}',
    async function orderCreatedTriggerOnCreate(
      snapshot: DocumentSnapshot,
      context: EventContext
    ): Promise<void> {
      // e.g., send order confirmation email
    },
    { memory: '256MB', minInstances: 1 },
  ),
  

  onUpdate: eventTrigger(
    'onUpdate',
    'projects/{projectId}/orders/{orderId}',
    async function orderUpdatedTriggerOnUpdate(
      change: Change<DocumentSnapshot>,
      context: EventContext
    ): Promise<void> {
      const before = change.before.data();
      const after = change.after.data();
      // e.g., notify if status changed
    },
    { memory: '256MB', minInstances: 1 },
  ),
};
```

And example for inventory restocks:
`order.trigger.ts`

```ts
import { DocumentSnapshot, EventContext } from 'firebase-functions/v1';
import { getModule } from 'nestfire';
import { InventoryTriggerModule } from './inventory-trigger.module';
import { InventoryService } from 'src/modules/inventory/inventory.service';

export async function inventoryRestockTriggerOnCreate(
  snapshot: DocumentSnapshot,
  context: EventContext
): Promise<void> {
  const mod = await getModule(InventoryTriggerModule);
  const inventoryService = mod.get(InventoryService);

  const item = snapshot.data();
  await inventoryService.notifyRestock(item.productId, item.quantity);
}
```

Now you can use `orderTrigger` in your `index.ts` file to deploy the triggers:

```ts
export { orderTrigger } from './src/triggers/order/order.trigger';
```

With this export Firebase will create a function called `orderTrigger` in your Firebase project. When you run the command `firebase deploy --only functions`.
<br>


## 📁 Example NestJS Module

```ts
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { FirebaseModule } from 'nestfire';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    FirebaseModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
```
<br>


## 📖 API Reference

- **`FirebaseModule`**: injects `admin.auth()`, `admin.firestore()`, `admin.storage()`, etc.  <br><br>
- **`createFirebaseHttpsV1(memory, module)`**: deploys v1 HTTP function.  <br><br>
- **`createFirebaseHttpsV2(options)`**: deploys v2 HTTP function with `{ region, memory, timeoutSeconds, module, fnName }`.  <br><br>
- **`eventTrigger(eventType, path, handler, options)`**: wraps Firestore triggers (`onCreate`, `onUpdate`, etc.).

<br>


## 🤝 Contributing

PRs and issues are welcome! Please follow TypeScript style and add tests for new features.

<br>

## 📝 License

MIT © Felipe Osano