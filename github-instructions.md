# NestFire Development Guide

**GitHub Copilot Instructions for NestFire Development**

This document provides comprehensive instructions for GitHub Copilot to understand and develop new features for NestFire, a library that bridges NestJS applications with Firebase Functions.

## Project Overview

NestFire is a TypeScript library that enables seamless integration between NestJS applications and Firebase Functions, supporting both V1 and V2 Firebase Functions with HTTPS and CALLABLE types. It provides decorators, automatic endpoint scanning, and both individual and grouped function deployment strategies.

### Core Purpose

- Deploy NestJS controllers as Firebase Functions
- Support both Firebase Functions V1 and V2
- Handle HTTPS and CALLABLE function types
- Provide individual and grouped deployment options
- Maintain type safety and NestJS patterns

## Architecture Overview

### Project Structure

```
nestfire/
├── src/                                    # Source code
│   ├── index.ts                           # Main library exports
│   ├── decorators/                        # NestJS decorators
│   │   └── firebase-https.decorator.ts    # @FirebaseHttps decorator
│   ├── enums/                            # Type definitions
│   │   ├── firebase-function-type.enum.ts
│   │   └── firebase-function-version.enum.ts
│   ├── interfaces/                       # TypeScript interfaces
│   │   ├── firebase-config-deployment.interface.ts
│   │   ├── firebase-https-configuration-v1.interface.ts
│   │   ├── firebase-https-configuration-v2.interface.ts
│   │   └── trigger.interface.ts
│   ├── firebase/                         # Firebase integration
│   │   ├── firebase.module.ts
│   │   └── firebase.ts
│   ├── httpFunction/                     # Core function deployment logic
│   │   ├── function-deploy.ts            # Main deployment orchestrator
│   │   ├── scan-endpoints.ts             # Endpoint discovery
│   │   ├── scan-firebase-module.ts       # Module scanning
│   │   ├── callable-handler.ts           # Callable function handler
│   │   ├── create-function.ts            # Function creation utilities
│   │   ├── delete-imported-controllers.ts
│   │   ├── module-providers.ts           # Provider merging
│   │   ├── url-prefix.ts                 # URL generation
│   │   ├── v1/                          # Firebase Functions V1 implementations
│   │   │   ├── firebase-callable-function.v1.ts
│   │   │   ├── firebase-http-function.v1.ts
│   │   │   └── individual-endpoints.v1.ts
│   │   └── v2/                          # Firebase Functions V2 implementations
│   │       ├── firebase-callable-function.v2.ts
│   │       ├── firebase-http-function.v2.ts
│   │       └── individual-endpoints.v2.ts
│   ├── scripts/                         # Build and installation scripts
│   │   ├── generate-firebase-deployment.js
│   │   └── check-and-install-firebase.js
│   └── triggers/                        # Event trigger handling
│       ├── handle-module.ts
│       └── v1/
│           └── event-trigger.ts
├── test/                               # Test suite
│   ├── setup.ts                       # Test configuration and mocks
│   ├── final.test.ts                  # Comprehensive test suite
│   └── README.md                      # Testing documentation
├── examples/                          # Usage examples
├── assets/                           # Project assets (logos, etc.)
├── dist/                             # Compiled output
├── package.json                      # Package configuration
├── tsconfig.json                     # TypeScript configuration
├── jest.config.js                    # Jest test configuration
└── README.md                         # Main documentation
```

## Key Components

### 1. Firebase Functions Deployment (`function-deploy.ts`)

The main entry point for function deployment. It:

- Scans NestJS modules for @FirebaseHttps decorators
- Determines deployment strategy (individual vs grouped)
- Creates appropriate Firebase Functions based on version and type
- Handles error scenarios gracefully

**Key Function:**

```typescript
export function firebaseFunctionsHttpsDeployment(appModule: any): { [key: string]: any };
```

### 2. Endpoint Scanning (`scan-endpoints.ts`)

Discovers NestJS controller endpoints for Firebase deployment:

- Uses reflection to find decorated methods
- Generates Firebase-compatible function names (camelCase)
- Extracts HTTP method and path information
- Returns structured endpoint information

**Key Functions:**

```typescript
export function scanModuleEndpoints(module: any): EndpointInfo[];
function generateFunctionName(controllerName: string, methodName: string, httpMethod: RequestMethod): string;
```

### 3. Individual Endpoints (V1/V2)

Creates individual Firebase Functions for each controller method:

- V2: `individual-endpoints.v2.ts` - Modern Firebase Functions V2 with enhanced configuration
- V1: `individual-endpoints.v1.ts` - Legacy Firebase Functions V1 support

**Key Features:**

- HTTPS functions: Create Express-based wrappers
- CALLABLE functions: Create direct callable handlers
- Path parameter extraction and handling
- Request/response transformation

### 4. Callable Handler (`callable-handler.ts`)

Manages callable function execution:

- Creates and caches NestJS application instances
- Handles action-based method routing
- Supports multiple naming conventions (dots, dashes, camelCase)
- Provides fallback strategies for method resolution

**Key Function:**

```typescript
export async function handleModuleForCallable(module: any, data: any, context: any): Promise<any>;
```

### 5. Firebase Decorator (`firebase-https.decorator.ts`)

The main decorator for marking NestJS modules as Firebase deployable:

```typescript
export function FirebaseHttps(target: any, configuration: IFirebaseConfigurationDeployment);
```

## Development Patterns

### 1. Version Compatibility

Always maintain compatibility between Firebase Functions V1 and V2:

```typescript
// V2 Configuration
interface IFirebaseHttpsConfigurationV2 {
  functionType?: EnumFirebaseFunctionType;
  exportSeparately?: boolean;
  memory?: string;
  timeoutSeconds?: number;
  maxInstances?: number;
  minInstances?: number;
  concurrency?: number;
}

// V1 Configuration
interface IFirebaseHttpsConfigurationV1 {
  functionType?: EnumFirebaseFunctionType;
  exportSeparately?: boolean;
  memory?: string;
  timeout?: string;
}
```

### 2. Function Naming Strategy

Firebase CLI expects camelCase function names:

```typescript
// Controller: UserController, Method: createUser
// Result: userCreateUser

// Controller: User, Method: find-profile
// Result: userFindProfile
```

### 3. Parameter Handling

Different strategies for HTTPS vs CALLABLE functions:

**HTTPS Functions:**

- Extract from Express req.params, req.body, req.query
- Handle path parameters from URL parsing
- Support standard HTTP methods

**CALLABLE Functions:**

- Data passed directly in request.data
- Support action-based routing
- Handle method resolution with fallbacks

### 4. Error Handling

Always provide graceful error handling:

- Invalid modules → return empty object
- Missing methods → provide helpful error messages
- Network failures → cleanup and retry mechanisms

## Development Guidelines

### 1. Adding New Features

When adding new functionality:

1. **Create interfaces first** in `src/interfaces/`
2. **Add enums** if new types are needed in `src/enums/`
3. **Implement core logic** in appropriate `src/httpFunction/` files
4. **Add version support** for both V1 and V2 if applicable
5. **Write tests** in `test/final.test.ts`
6. **Update documentation** in README.md
7. **Add examples** in `examples/` directory

### 2. Code Style

- Use TypeScript with strict typing
- Follow NestJS patterns and conventions
- Use descriptive function and variable names
- Add JSDoc comments for public APIs
- Handle errors gracefully with meaningful messages

### 3. Testing Strategy

- All new features must have tests
- Use the existing test infrastructure in `test/setup.ts`
- Add test cases to `test/final.test.ts`
- Ensure tests pass: `npm test`
- Verify TypeScript compilation: `npm run build`

### 4. Firebase Functions Best Practices

- Support both V1 and V2 Firebase Functions
- Handle memory and timeout configurations
- Support both HTTPS and CALLABLE types
- Use proper Express middleware for HTTPS functions
- Implement proper error handling and logging

## Common Development Tasks

### Adding a New Firebase Function Type

1. **Add enum value:**

```typescript
// src/enums/firebase-function-type.enum.ts
export enum EnumFirebaseFunctionType {
  HTTPS = 'https',
  CALLABLE = 'callable',
  NEW_TYPE = 'new_type', // Add here
}
```

2. **Update interfaces:**

```typescript
// Update configuration interfaces to support new type
```

3. **Implement handlers:**

```typescript
// Add handlers in v1/ and v2/ directories
```

4. **Update deployment logic:**

```typescript
// Modify function-deploy.ts to handle new type
```

### Adding New Configuration Options

1. **Update interface:**

```typescript
// src/interfaces/firebase-https-configuration-v2.interface.ts
export interface IFirebaseHttpsConfigurationV2 {
  // existing properties...
  newOption?: string; // Add here
}
```

2. **Handle in deployment:**

```typescript
// Use the new option in individual-endpoints files
```

3. **Add tests:**

```typescript
// Test the new configuration option
```

### Debugging Common Issues

1. **Module Not Found Errors:**

   - Check import paths
   - Verify exports in index.ts
   - Ensure proper TypeScript compilation

2. **Firebase Function Deployment Issues:**

   - Verify function name format (camelCase)
   - Check Firebase Functions SDK version compatibility
   - Ensure proper configuration structure

3. **NestJS Integration Problems:**
   - Check decorator usage
   - Verify module structure
   - Ensure proper dependency injection

## Testing Instructions

### Running Tests

```bash
npm test                # Run all tests
npm run test:coverage   # Run with coverage
npm run test:watch     # Watch mode for development
```

### Test Structure

- `test/setup.ts`: Central configuration with mocks
- `test/final.test.ts`: Comprehensive test suite (19 tests)
- Tests cover: enums, interfaces, exports, build system, Firebase integration

### Adding New Tests

Add test cases to the appropriate section in `test/final.test.ts`:

```typescript
describe('New Feature', () => {
  it('should handle new functionality', () => {
    // Test implementation
    expect(newFeature()).toBeDefined();
  });
});
```

## Build and Deployment

### Local Development

```bash
npm install           # Install dependencies
npm run build        # Compile TypeScript
npm test             # Run tests
```

### Publishing

```bash
npm run build        # Compile
npm test             # Verify tests pass
npm version patch    # Increment version
npm publish          # Publish to npm
```

## Dependencies

### Runtime Dependencies

- `firebase-functions`: Firebase Functions SDK (≥5.1.1)
- `firebase-admin`: Firebase Admin SDK (≥12.7.0)
- `compression`: HTTP compression middleware
- `class-transformer`: Object transformation
- `class-validator`: Validation decorators

### Peer Dependencies

- `@nestjs/common`: NestJS common utilities (≥10.0.0)
- `@nestjs/core`: NestJS core functionality (≥10.0.0)

### Development Dependencies

- `typescript`: TypeScript compiler (5.8.3)
- `jest`: Testing framework
- `ts-jest`: TypeScript Jest preprocessor
- Various @types packages

## Important Notes for Future Development

1. **Maintain Backward Compatibility**: Always support existing APIs when adding new features
2. **Version Support**: Continue supporting both Firebase Functions V1 and V2
3. **Type Safety**: Maintain strict TypeScript typing throughout
4. **Documentation**: Update README.md and examples when adding features
5. **Testing**: Ensure comprehensive test coverage for all new functionality
6. **Error Handling**: Provide helpful error messages and graceful degradation
7. **Performance**: Consider function cold start times and memory usage
8. **Security**: Follow Firebase and NestJS security best practices

## Troubleshooting

### Common Issues and Solutions

1. **Build Errors**: Check TypeScript configuration and import paths
2. **Test Failures**: Verify mock configurations in `test/setup.ts`
3. **Runtime Errors**: Check Firebase Functions logs and error handling
4. **Deployment Issues**: Verify function naming and configuration structure

### Debug Mode

Enable debug logging by setting environment variables or adding console.log statements in key functions like `function-deploy.ts`.

---

This document should be updated whenever significant changes are made to the codebase. It serves as the primary reference for understanding and extending NestFire functionality.
