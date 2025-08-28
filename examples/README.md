# NestFire Examples

This directory contains examples demonstrating the new features in NestFire.

## New Features

### 1. Firebase Callable Functions

Instead of creating HTTPS endpoints, you can now create Firebase Callable Functions that work with Firebase SDK clients.

```typescript
import { FirebaseHttps, EnumFirebaseFunctionVersion, EnumFirebaseFunctionType } from 'nestfire';

@FirebaseHttps(EnumFirebaseFunctionVersion.V2, {
  functionType: EnumFirebaseFunctionType.CALLABLE,
  memory: '256MB'
})
@Module({
  controllers: [MyController],
})
export class MyCallableModule {}
```

### 2. Individual Endpoint Export

Export each controller method as a separate Firebase function instead of bundling them into one.

```typescript
@FirebaseHttps(EnumFirebaseFunctionVersion.V2, {
  exportSeparately: true,
  functionType: EnumFirebaseFunctionType.HTTPS, // or CALLABLE
  memory: '512MB'
})
@Module({
  controllers: [MyController],
})
export class MyIndividualModule {}
```

## Usage with Firebase SDK (Client Side)

### Calling Callable Functions

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Call the calculator function
const calculator = httpsCallable(functions, 'calculator');
const result = await calculator({ 
  operation: 'add', 
  a: 5, 
  b: 3 
});
console.log(result.data); // { result: 8 }

// Call individual notification functions
const sendNotification = httpsCallable(functions, 'notificationsSendNotification');
const response = await sendNotification({
  message: 'Hello!',
  userId: 'user123'
});
```

### Calling HTTPS Functions

Individual HTTPS endpoints work as regular REST APIs:

```javascript
// GET /users
fetch('https://your-region-your-project.cloudfunctions.net/usersGetUsers')

// POST /users  
fetch('https://your-region-your-project.cloudfunctions.net/usersCreateUser', {
  method: 'POST',
  body: JSON.stringify({ name: 'John' }),
  headers: { 'Content-Type': 'application/json' }
})
```

## Deployment

The deployment process remains the same:

```bash
firebase deploy --only functions
```

The new features will automatically generate the appropriate Firebase functions based on your configuration.