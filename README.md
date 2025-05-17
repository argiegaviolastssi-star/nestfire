# NestFire

NPM library to integrate Firebase with NestJS easily.

**Main features:**

- 🔌 **`FirebaseModule`**: Inject Firebase SDK services (Firestore, Auth, Storage, etc.) into your providers.  
- 🚀 **Cloud Functions HTTP**:  
  - **v1** with `createFirebaseHttpsV1`  
  - **v2** with `createFirebaseHttpsV2`  
- 🔔 **Firestore Triggers v1** using `eventTrigger`

---

## 📦 Installation

```bash
npm install nestfire firebase-admin firebase-functions dotenv
```

---

## ⚙️ Environment Variables

Put these in your `.env` file (at project root):

```bash
# Either embed the JSON key directly
SERVICE_ACCOUNT_KEY="{\
  \"type\": \"service_account\",\
  \"project_id\": \"my-project-id\",\
  \"private_key_id\": \"ABCD1234...\",\
  \"private_key\": \"-----BEGIN PRIVATE KEY-----\\nMIIEv...\\n-----END PRIVATE KEY-----\\n\",\
  \"client_email\": \"firebase-adminsdk@my-project.iam.gserviceaccount.com\",\
  \"client_id\": \"1234567890\",\
  \"auth_uri\": \"https://accounts.google.com/o/oauth2/auth\",\
  \"token_uri\": \"https://oauth2.googleapis.com/token\",\
  \"auth_provider_x509_cert_url\": \"https://www.googleapis.com/oauth2/v1/certs\",\
  \"client_x509_cert_url\": \"https://www.googleapis.com/robot/v1/metadata/x509/...\"\
}"

# Or point to a file path
SERVICE_ACCOUNT_KEY_PATH="./serviceAccountKey.json"

# Firebase project ID
FIREBASE_PROJECT_ID="my-project-id"
```

> **Note:** You must load `.env` in your code (e.g., using [dotenv](https://www.npmjs.com/package/dotenv)).

---

## ⚙️ Configuration in NestJS Modules

Import `FirebaseModule` into **any** module where you need Firebase, not just the root module.

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from 'nestfire';
import { UserService } from './user.service';

@Module({
  imports: [
    ConfigModule.forRoot(),   // loads .env
    FirebaseModule,           // makes Firebase available here
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

---

## 🚀 Usage

### 1. Injecting Firebase Services

```ts
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Firebase } from 'nestfire';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => Firebase))
    private readonly firebase: Firebase,
  ) {}

  async registerUser(dto: CreateUserDto) {
    const id = this.firebase.firestore.collection('users').doc().id;
    await this.firebase.firestore.collection('users').doc(id).set(dto);
  }

  async listUsers() {
    const snap = await this.firebase.firestore.collection('users').get();
    return snap.docs.map(d => d.data());
  }
}
```

---

### 2. Cloud Functions HTTP

Use these helpers to deploy Firebase Functions (v1 or v2 generational API).  
**Important:** the exported function name (e.g. `booksApi`) must match the controller name in that module. Only the controllers in the module you pass will be deployed.

#### v1

```ts
import { HttpsFunction, createFirebaseHttpsV1 } from 'nestfire';
import { BooksModule } from './modules/books/books.module';

// Deploys an HTTP function with 128MB memory.
// Endpoint path will be `/booksApi` by default.
export const booksApi: HttpsFunction =
  createFirebaseHttpsV1('128MB', BooksModule);
```

#### v2

```ts
import { HttpFunction, createFirebaseHttpsV2 } from 'nestfire';
import { CoursesModule } from './modules/courses/courses.module';

// Deploys a 2nd-gen function in us-central1 with 256MB memory and 120s timeout.
export const coursesApi: HttpFunction = createFirebaseHttpsV2({
  region: 'us-central1',    // region
  memory: '256MB',          // memory
  timeoutSeconds: 120,      // timeout
  module: CoursesModule,    // module with controllers
  fnName: 'coursesApi',     // exported name & endpoint path
});
```

---

### 3. Firestore Triggers v1

Register Firestore document triggers. Example for `onCreate` and `onUpdate`:

```ts
import { Trigger, eventTrigger } from 'nestfire';
import { EventContext, Change, DocumentSnapshot } from 'firebase-functions/v1';

export const enrollmentTrigger: Trigger = {
  onCreate: eventTrigger(
    'onCreate',
    'projects/{projectId}/courses/{courseId}/enrollments/{enrollmentId}',
    async function courseEnrollmentTriggerOnCreate(
      snapshot: DocumentSnapshot,
      context: EventContext
    ): Promise<void> {
      // your logic here
    },
    { memory: '512MB', minInstances: 1 },
  ),

  onUpdate: eventTrigger(
    'onUpdate',
    'projects/{projectId}/courses/{courseId}/enrollments/{enrollmentId}',
    async function courseEnrollmentTriggerOnUpdate(
      change: Change<DocumentSnapshot>,
      context: EventContext
    ): Promise<void> {
      const before = change.before.data();
      const after  = change.after.data();
      // your logic here
    },
    { memory: '512MB', minInstances: 1 },
  ),
};
```

Also an example for language courses:

```ts
import { DocumentSnapshot, EventContext } from 'firebase-functions/v1';
import { getModule } from 'nestfire';
import { LanguageCourseTriggerModule } from './language-course-trigger.module';
import { TranslateService } from 'src/modules/translate/translate.service';
import { CourseService } from 'src/modules/course/course.service';

export async function languageCourseTriggerOnCreate(
  snapshot: DocumentSnapshot,
  context: EventContext
): Promise<void> {
  const mod = await getModule(LanguageCourseTriggerModule);
  const translate = mod.get(TranslateService);
  const courseSvc  = mod.get(CourseService);

  const data = snapshot.data();
  await translate.autoTranslate(data.text);
  await courseSvc.updateCourse(context.params.courseId, { translated: true });
}
```

---

## 📁 Example NestJS Module

```ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService }    from './user.service';
import { FirebaseModule } from 'nestfire';
import { ConfigModule }   from 'src/config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot(),  // loads .env
    FirebaseModule,          // injects Firebase into this module
  ],
  controllers: [UserController],
  providers:   [UserService],
  exports:     [UserService],
})
export class UserModule {}
```

---

## 📖 API Reference

- **`FirebaseModule`**: injects `admin.auth()`, `admin.firestore()`, `admin.storage()`, etc.  
- **`createFirebaseHttpsV1(memory, module)`**: deploys v1 HTTP function.  
- **`createFirebaseHttpsV2(options)`**: deploys v2 HTTP function with `{ region, memory, timeoutSeconds, module, fnName }`.  
- **`eventTrigger(eventType, path, handler, options)`**: wraps Firestore triggers (`onCreate`, `onUpdate`, etc.).

See the `src/` folder for more examples and in-depth docs.

---

## 🤝 Contributing

PRs and issues are welcome! Please follow TypeScript style and add tests for new features.

---

## 📝 License

MIT © Felipe Osano