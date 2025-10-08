<p align="center">
  <img src="https://github.com/felipeosano/nestfire/blob/develop/assets/nestfire_logo.png?raw=true" alt="NestFire Logo" width="190" />
</p>

<h1 align="center">NestFire</h1>

<p align="center">Library to integrate Firebase with NestJS, allowing each module to be deployed as an individual Firebase Function.</p>

Example and step by step guide: [nestfire-example](https://github.com/felipeosano/nestfire-example)

- [⚙️ Configuration](#️-configuration)
- [🔥 Firebase Usage](#-firebase-usage)
  - [Modules](#modules)
  - [Firestore](#firestore)
  - [Auth](#auth)
  - [Storage](#storage)
- [🚀 Deploy NestJS on Firebase Functions](#-deploy-nestjs-on-firebase-functions)
  - [index.ts](#indexts)
  - [HTTPS](#https)
  - [Firestore Trigger](#firestore-trigger)
  - [Function Naming & Callable Actions](#function-naming--callable-actions)

<br>

# ⚙️ Configuration

## 📦 Installation

```bash
npm install nestfire
```

> **Steps:**
>
> 1. Run `firebase init` to set up Firebase in your project.
> 2. Delete the `functions` folder created by firebase init.
> 3. Add in package.json `"main": "dist/index.js"`.
> 4. Configure the `firebase.json` file to use the `index.ts` file created by nestfire. [See below](#indexts).

## ⚙️ Environment Variables

Add the private key in your `.env` file as`SERVICE_ACCOUNT_KEY` or `SERVICE_ACCOUNT_KEY_PATH`

> **To generate a private key file for your service account:**
>
> 1. In the Firebase console, open Settings > [Service Accounts](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk?fb_utm_source=chatgpt.com&_gl=1*bcauiw*_ga*NDkyNDQxNTI4LjE3NDI1MDc1ODA.*_ga_CW55HF8NVT*czE3NDc2ODU0MDUkbzUwJGcxJHQxNzQ3Njg1OTAyJGo1MSRsMCRoMCRkZS1xTjE2TUlaRU9UMG9QaFQteFFJeFhPV1o5SEhCSkcxZw..)
> 2. Click Generate New Private Key, then confirm by clicking Generate Key.
> 3. Securely store the JSON file containing the key.

<br>

`.env` file, add the path to the service account key file:

```bash
SERVICE_ACCOUNT_KEY_PATH=./serviceAccountKey.json
```

<br>

# 🔥 Firebase Usage

Import `FirebaseModule` into **any** module where you need Firebase.

## Modules

Import FirebaseModule and ConfigModule. Use FirebaseModule from nestfire.

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from 'nestfire';
import { BooksService } from './books.service';

@Module({
  imports: [ConfigModule.forRoot(), FirebaseModule],
  providers: [BooksService],
  exports: [BooksService],
  controllers: [BooksController],
})
export class BooksModule {}
```

## Firestore

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

## Auth

Use `this.firebase.auth()` to access Firebase Auth instance.  
Optionally, provide a `tenantId` to use multi-tenancy.

```ts
const auth = this.firebase.auth(); // default auth
const tenantAuth = this.firebase.auth('tenant-id'); // tenant-aware auth
await auth.createUser({ email: 'user@example.com', password: 'secret' });
```

## Storage

Use `this.firebase.storage()` to access Firebase Cloud Storage.

```ts
const bucket = this.firebase.storage().bucket();
await bucket.upload('local-file.txt', { destination: 'uploads/file.txt' });
```

<br>

# 🚀 Deploy NestJS on Firebase Functions

## index.ts

When you install `nestfire`, it will create an `index.ts` file in the root of your project. This file is used to deploy your functions.  
The `firebase.json` file has to be configured to use this file.

In addition to exporting the `firebaseFunctionsHttpsDeployment(AppModule)`, you should also export any Firestore triggers you want to deploy.  
👉 See the [Firestore Trigger](#firestore-trigger) section for examples.

In your `firebase.json` file, add the following:

```json
{
  "functions": {
    "source": ".",
    "runtime": "nodejs22"
  }
}
```

## HTTPS

Add the `@FirebaseHttps` decorator in the modules you want to deploy.
The first argument is the version of the function you want to deploy. The second argument is an object with the options for the function.

### V1

Version: EnumFirebaseFunctionVersion.V1
Options: [RuntimeOptions](https://firebase.google.com/docs/reference/functions/firebase-functions.runtimeoptions)

```ts
@FirebaseHttps(EnumFirebaseFunctionVersion.V1, { memory: '256MB' })
```

### V2

Version: EnumFirebaseFunctionVersion.V2
Options: [HttpsOptions](https://firebase.google.com/docs/reference/functions/2nd-gen/node/firebase-functions.https.httpsoptions)

```ts
@FirebaseHttps(EnumFirebaseFunctionVersion.V2, { memory: '256MiB' })
```

### Function Types (NEW!)

You can now specify the type of Firebase function to create:

- **HTTPS Functions** (default): Traditional HTTP endpoints accessible via REST API
- **Callable Functions**: Functions that can be called directly from Firebase SDK clients

```ts
import { EnumFirebaseFunctionType } from 'nestfire';

// Callable Function - called from Firebase SDK
@FirebaseHttps(EnumFirebaseFunctionVersion.V2, {
  functionType: EnumFirebaseFunctionType.CALLABLE,
  memory: '256MiB'
})

// HTTPS Function - traditional REST API (default behavior)
@FirebaseHttps(EnumFirebaseFunctionVersion.V2, {
  functionType: EnumFirebaseFunctionType.HTTPS,
  memory: '256MiB'
})
```

### Individual Endpoint Export (NEW!)

Export each controller method as a separate Firebase function:

```ts
// Instead of one function for the entire module, create one function per endpoint
@FirebaseHttps(EnumFirebaseFunctionVersion.V2, {
  exportSeparately: true,
  functionType: EnumFirebaseFunctionType.HTTPS, // or CALLABLE
  memory: '256MiB'
})
```

This will create individual functions like:

- `userGetUsers` for `GET /users`
- `userCreateUser` for `POST /users`
- `userGetUserById` for `GET /users/:id`

### Example

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

#### Callable Function Controller Setup

For callable functions, your controller should have a `handleCall` method:

```ts
@Controller('calculator')
class CalculatorController {
  async handleCall(data: { operation: string; a: number; b: number }, context: any) {
    const { operation, a, b } = data;
    switch (operation) {
      case 'add':
        return { result: a + b };
      case 'subtract':
        return { result: a - b };
      default:
        throw new Error('Unsupported operation');
    }
  }
}

@FirebaseHttps(EnumFirebaseFunctionVersion.V2, {
  functionType: EnumFirebaseFunctionType.CALLABLE,
  memory: '256MiB',
})
@Module({
  controllers: [CalculatorController],
})
export class CalculatorModule {}
```

#### Client-Side Usage

**Calling Callable Functions from Firebase SDK:**

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const calculator = httpsCallable(functions, 'calculator');

const result = await calculator({
  operation: 'add',
  a: 5,
  b: 3,
});
console.log(result.data); // { result: 8 }
```

**Calling Individual HTTPS Functions:**

```javascript
// Individual endpoints are accessible as separate functions
fetch('https://region-project.cloudfunctions.net/usersGetUsers');
fetch('https://region-project.cloudfunctions.net/usersCreateUser', {
  method: 'POST',
  body: JSON.stringify({ name: 'John' }),
  headers: { 'Content-Type': 'application/json' },
});
```

> **Note:** You can deploy with the command: `firebase deploy --only functions`
> Before deploying you have to build your project. `npm run build`.

<br>

## Firestore Trigger

You can register Firestore triggers that automatically run when a document is created or updated in Firestore.

### Example: Order triggers

Define your triggers using `eventTrigger` from `nestfire`:

```ts
import { Trigger, eventTrigger } from 'nestfire';
import { EventContext, Change, DocumentSnapshot } from 'firebase-functions/v1';

export const orderTrigger: Trigger = {
  // Trigger when a new order document is created
  onCreate: eventTrigger(
    'onCreate',
    'projects/{projectId}/orders/{orderId}',
    async function orderCreatedTriggerOnCreate(snapshot: DocumentSnapshot, context: EventContext): Promise<void> {
      // Example: send confirmation email
    },
    { memory: '256MB', minInstances: 1 }
  ),

  // Trigger when an existing order document is updated
  onUpdate: eventTrigger(
    'onUpdate',
    'projects/{projectId}/orders/{orderId}',
    async function orderUpdatedTriggerOnUpdate(change: Change<DocumentSnapshot>, context: EventContext): Promise<void> {
      const before = change.before.data();
      const after = change.after.data();
      // Example: notify if status changed
    },
    { memory: '256MB', minInstances: 1 }
  ),
};
```

### Example: Inventory restock

Use `getModule` to retrieve a NestJS service within the trigger context:

```ts
import { DocumentSnapshot, EventContext } from 'firebase-functions/v1';
import { getModule } from 'nestfire';
import { InventoryTriggerModule } from './inventory-trigger.module';
import { InventoryService } from 'src/modules/inventory/inventory.service';

export async function inventoryRestockTriggerOnCreate(snapshot: DocumentSnapshot, context: EventContext): Promise<void> {
  const mod = await getModule(InventoryTriggerModule);
  const inventoryService = mod.get(InventoryService);

  const item = snapshot.data();
  await inventoryService.notifyRestock(item.productId, item.quantity);
}
```

### Deploying Firestore triggers

To deploy the triggers, export them in your `index.ts` file:

```ts
export { orderTrigger } from './src/triggers/order/order.trigger';
```

> This will create a Firebase Function named `orderTrigger`. It will be deployed when you run:
>
> ```bash
> firebase deploy --only functions
> ```

### Recommended Folder Structure

It is recommended to place your Firestore triggers inside a `src/triggers` directory.  
Each trigger should have its own subfolder with a `.trigger.ts` and `.trigger.module.ts` file.

#### Example Structure:

```
src/
└── triggers/
    └── order/
        ├── order.trigger.ts
        └── order.trigger.module.ts
```

In `order.trigger.module.ts`, import all the modules that the trigger needs.  
Then use `await getModule(OrderTriggerModule)` to get access to the services required by your trigger logic.

#### Example: order.trigger.ts

```ts
import { Trigger, eventTrigger } from 'nestfire';
import { EventContext, Change, DocumentSnapshot } from 'firebase-functions/v1';

export const orderTrigger: Trigger = {
  // Trigger when a new order document is created
  onCreate: eventTrigger(
    'onCreate',
    'projects/{projectId}/orders/{orderId}',
    async function orderCreatedTriggerOnCreate(snapshot: DocumentSnapshot, context: EventContext): Promise<void> {
      // Example: send confirmation email
    },
    { memory: '256MB', minInstances: 1 }
  ),

  // Trigger when an existing order document is updated
  onUpdate: eventTrigger(
    'onUpdate',
    'projects/{projectId}/orders/{orderId}',
    async function orderUpdatedTriggerOnUpdate(change: Change<DocumentSnapshot>, context: EventContext): Promise<void> {
      const before = change.before.data();
      const after = change.after.data();
      // Example: notify if status changed
    },
    { memory: '256MB', minInstances: 1 }
  ),
};
```

## Function Naming & Callable Actions

All automatically generated function names use camelCase naming to be compatible with Firebase CLI expectations.

Example:

- Controller: `UserController`, method: `create` -> function id: `userCreate`

### Individual HTTPS Functions

When using `functionType: HTTPS` with `exportSeparately: true`, each method becomes a separate HTTP function that accepts the appropriate HTTP method:

```ts
// Configuration
@FirebaseHttps(EnumFirebaseFunctionVersion.V2, {
  functionType: EnumFirebaseFunctionType.HTTPS,
  exportSeparately: true,
  memory: '256MiB'
})
```

**Invocation examples:**

```http
# userCreate (POST /user)
POST http://127.0.0.1:5001/project/us-central1/userCreate
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}

# userFindAll (GET /user)
GET http://127.0.0.1:5001/project/us-central1/userFindAll

# userFindOne (GET /user/:id)
GET http://127.0.0.1:5001/project/us-central1/userFindOne/123

# userUpdate (PATCH /user/:id)
PATCH http://127.0.0.1:5001/project/us-central1/userUpdate/123
Content-Type: application/json

{
  "name": "Updated Name"
}

# userRemove (DELETE /user/:id)
DELETE http://127.0.0.1:5001/project/us-central1/userRemove/123
```

**Note for HTTPS functions:** Path parameters (like `:id`) are included in the URL path as standard REST endpoints.

### Individual Callable Functions

When using `functionType: CALLABLE` with `exportSeparately: true`, each method becomes a separate callable function accessible via POST:

```ts
// Configuration
@FirebaseHttps(EnumFirebaseFunctionVersion.V2, {
  functionType: EnumFirebaseFunctionType.CALLABLE,
  exportSeparately: true,
  memory: '256MiB'
})
```

**Invocation examples:**

```http
# userCreate
POST http://127.0.0.1:5001/project/us-central1/userCreate
Content-Type: application/json

{
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}

# userFindOne
POST http://127.0.0.1:5001/project/us-central1/userFindOne
Content-Type: application/json

{
  "data": {
    "id": "123"
  }
}

# userUpdate
POST http://127.0.0.1:5001/project/us-central1/userUpdate
Content-Type: application/json

{
  "data": {
    "id": "123",
    "name": "Updated Name",
    "email": "updated@example.com"
  }
}
```

**Note for Callable functions:** All invocations use POST method. Path parameters (like `:id`) should be included in the `data` payload.

### Client SDK Usage

**For Callable functions:**

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const userCreate = httpsCallable(functions, 'userCreate');
const result = await userCreate({ name: 'John', email: 'john@example.com' });

// For methods with path parameters
const userUpdate = httpsCallable(functions, 'userUpdate');
const updateResult = await userUpdate({
  id: '123',
  name: 'Updated Name',
  email: 'updated@example.com',
});
```

### Flexible action routing inside callable functions

If you use a controller with a `handleCall` method, that method is called directly.

If you send a payload with an `action` field, NestFire will attempt to resolve the target method using these rules (in order):

1. Exact `action` string.
2. Last segment after splitting `action` by `.` or `-`.
3. CamelCase variant of the last segment (turning `my-method` into `myMethod`).

So any of these payloads will reach the controller method `create`:

```jsonc
{ "action": "create", ... }
{ "action": "user.create", ... }
{ "action": "user-create", ... }
```

If no method is found, an error lists all checked variants to aid debugging.

> Dots in the callable ID itself are NOT supported; only use them inside the `action` field of the payload.

---

Finally, export your trigger in `index.ts` to enable deployment.

<br>

## 📖 API Reference

- **index.ts**  
  Auto-generated entry point used by Firebase to detect and deploy NestJS modules decorated with `@FirebaseHttps`. This file is created when you install `nestfire` and must not be deleted. It calls `firebaseFunctionsHttpsDeployment(AppModule)` to expose decorated modules.

- **@FirebaseHttps**  
  Decorator to mark NestJS modules for deployment as Firebase Functions.  
  Usage:

  ```ts
  @FirebaseHttps(EnumFirebaseFunctionVersion.V1, { memory: '256MB' })
  ```

  First argument: function version (`V1` or `V2`).  
  Second argument: configuration object (its structure depends on the version).  
  👉 See [HTTPS](#https) section for more details.

- **FirebaseModule**  
  NestJS global module that provides the `Firebase` injectable. It automatically initializes Firebase using credentials from `.env`. Import it to use Firebase services (Auth, Firestore, Storage).

- **Firebase**  
  Injectable service wrapping Firebase Admin SDK.  
  Provides:

  - `firestore(databaseId?: string)` – Access Firestore (default or specific DB).
  - `auth(tenantId?: string)` – Access Auth service (supports multi-tenancy).
  - `storage()` – Access Cloud Storage.
  - `app()` – Access the initialized Firebase App.

- **EnumFirebaseFunctionVersion**  
  Enum to choose between Firebase Functions v1 or v2. Used in the `@FirebaseHttps` decorator.

  ```ts
  export enum EnumFirebaseFunctionVersion {
    V1 = 'V1',
    V2 = 'V2',
  }
  ```

- **firebaseFunctionsHttpsDeployment(appModule: any): Record&lt;string, HttpsFunction&gt;**  
  Function that scans the provided NestJS module for any submodules decorated with `@FirebaseHttps`, and generates Firebase HTTPS functions for each.  
  ⚠️ **Important:** This function is automatically included in the generated `index.ts` file when you install `nestfire`. You should not create it manually.

- **eventTrigger**  
  Utility function to create Firestore triggers like `onCreate`, `onUpdate`, `onDelete`, or `onWrite` as properties.

- **Trigger**  
  Interface used to define Firestore triggers using `onCreate`, `onUpdate`, `onDelete`, or `onWrite` as properties.

- **getModule**  
  Utility function that retrieves a NestJS module instance inside a trigger context.  
  Useful to inject services into your Firestore functions, for example:
  ```ts
  const mod = await getModule(SomeModule);
  const service = mod.get(SomeService);
  ```

<br>

## � Testing

NestFire includes a comprehensive test suite to ensure reliability and prevent regressions:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The test suite covers:

- ✅ **Core Functionality**: Function deployment, endpoint scanning, parameter handling
- ✅ **Firebase Integration**: V1/V2 compatibility, HTTPS/CALLABLE function types
- ✅ **NestJS Integration**: Decorators, dependency injection, module scanning
- ✅ **Configuration**: All interface types, enum values, TypeScript compilation
- ✅ **Error Handling**: Edge cases, invalid inputs, graceful failures
- ✅ **Package Structure**: Build system, documentation, examples

### Test Results

```
✅ All core enums and interfaces validated
📦 Package structure and configuration verified
🔧 TypeScript compilation settings confirmed
🚀 Firebase Functions V1/V2 compatibility ensured
🏗️ NestJS integration requirements met
📚 Documentation and examples structure validated

🎉 NestFire is ready for production deployment!

Key Features Tested:
- ✅ HTTPS and CALLABLE function types
- ✅ Firebase Functions V1 and V2 support
- ✅ Individual and grouped function deployment
- ✅ NestJS decorator integration
- ✅ TypeScript type safety
- ✅ Configuration interfaces
- ✅ Package structure and build system
```

<br>

## �🤝 Contributing

PRs and issues are welcome! Please follow TypeScript style and add tests for new features.

**Before submitting a PR:**

```bash
npm test        # Ensure all tests pass
npm run build   # Verify TypeScript compilation
```

<br>

## 🚀 Release Instructions

To create a new release of NestFire:

1. Create and push a git tag:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Create the package:
   ```bash
   npm pack
   ```

4. Create a new release in GitHub:
   - Go to the GitHub repository
   - Click "Releases" → "Create a new release"
   - Select the tag created (e.g., v1.0.1)
   - Upload the generated `.tgz` file from the `dist` folder

<br>

## 📝 License

MIT © Felipe Osano
