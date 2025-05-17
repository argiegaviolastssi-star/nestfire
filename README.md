# NestFire

NPM library to integrate Firebase with NestJS easily.

**Main features:**

- 🔌 **`FirebaseModule`**: Inject Firebase SDK services (Firestore, Auth, Storage, etc.) into your providers.

- 🚀 **Cloud Functions HTTP**: 
  - **v1** with `createFirebaseHttpsV1`  

  - **v2** with `createFirebaseHttpsV2`

- 🔔 **Firestore Triggers v1** using `eventTrigger`


## 📦 Installation

```bash
npm install nestfire firebase-admin firebase-functions dotenv
```
<br>


## ⚙️ Environment Variables

Put these in your `.env` file (at project root):

```bash
# Either embed the JSON key directly
SERVICE_ACCOUNT_KEY='{
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
}'

# Or point to a file path
SERVICE_ACCOUNT_KEY_PATH="./serviceAccountKey.json"

# Firebase project ID
FIREBASE_PROJECT_ID="my-project-id"
```

> **Note:** You must load `.env` in your code (e.g., using [dotenv](https://www.npmjs.com/package/dotenv)).

<br>


## ⚙️ Configuration in NestJS Modules

Import `FirebaseModule` into **any** module where you need Firebase.

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
})
export class BooksModule {}
```
<br>


## 🚀 Usage

### 1. Injecting Firebase Services

```ts
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Firebase } from 'nestfire';
import { CreateBookDto } from './dto/create-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @Inject(forwardRef(() => Firebase))
    private readonly firebase: Firebase,
  ) {}

  async addBook(dto: CreateBookDto) {
    const id = this.firebase.firestore.collection('books').doc().id;
    await this.firebase.firestore.collection('books').doc(id).set(dto);
  }

  async findAllBooks() {
    const snapshot = await this.firebase.firestore.collection('books').get();
    return snapshot.docs.map(doc => doc.data());
  }
}
```
<br>


### 2. Cloud Functions HTTP

Use helpers to deploy Firebase HTTP Functions v1 or v2.  
**Important:** the exported function name must match the controller name in that module.

#### v1

```ts
import { HttpsFunction, createFirebaseHttpsV1 } from 'nestfire';
import { BooksModule } from './modules/books/books.module';

// Deploys an HTTP function with 128MB memory.
// Endpoint path will be `/booksApi`.
export const booksApi: HttpsFunction =
  createFirebaseHttpsV1('128MB', BooksModule);
```

#### v2

```ts
import { HttpFunction, createFirebaseHttpsV2 } from 'nestfire';
import { OrdersModule } from './modules/orders/orders.module';

// Deploys a 2nd-gen function in europe-west1 with 256MB memory and 60s timeout.
export const ordersApi: HttpFunction = createFirebaseHttpsV2({
  region: 'europe-west1',
  memory: '256MB',
  timeoutSeconds: 60,
  module: OrdersModule,
  fnName: 'ordersApi',
});
```
<br>


### 3. Firestore Triggers v1

Register Firestore triggers. Example for order creations and updates:

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
- **`eventTrigger(eventType, path, handler, options)`**: wraps Firestore triggers (`onCreate`, `onUpdate`, etc.).  <br><br>

See the `src/` folder for more examples and detailed docs.
<br>


## 🤝 Contributing

PRs and issues are welcome! Please follow TypeScript style and add tests for new features.
<br>


## 📝 License

MIT © Felipe Osano