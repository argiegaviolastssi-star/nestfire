/**
 * NestFire Test Setup
 *
 * This file provides the core testing infrastructure for NestFire.
 * It includes mocks for Firebase Functions, NestJS, and other dependencies
 * to enable comprehensive testing without external dependencies.
 *
 * Test Structure:
 * - setup.ts: This file (central configuration and mocks)
 * - final.test.ts: Comprehensive test suite covering all functionality
 *
 * Usage:
 * - npm test: Run all tests
 * - npm run test:coverage: Run with coverage
 * - npm run test:watch: Watch mode for development
 */

import 'reflect-metadata';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn(),
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
    })),
  })),
  auth: jest.fn(() => ({
    createUser: jest.fn(),
    getUser: jest.fn(),
  })),
  storage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      upload: jest.fn(),
    })),
  })),
}));

// Mock Firebase Functions
jest.mock('firebase-functions/v1', () => ({
  runWith: jest.fn(() => ({
    region: jest.fn(() => ({
      https: {
        onRequest: jest.fn(),
        onCall: jest.fn(),
      },
    })),
    https: {
      onRequest: jest.fn(),
      onCall: jest.fn(),
    },
  })),
  https: {
    onRequest: jest.fn(),
    onCall: jest.fn(),
  },
}));

jest.mock('firebase-functions/v2/https', () => ({
  onRequest: jest.fn(),
  onCall: jest.fn(),
}));

// Mock NestJS
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
    createApplicationContext: jest.fn(),
  },
}));

jest.mock('@nestjs/common', () => ({
  RequestMethod: {
    GET: 0,
    POST: 1,
    PUT: 2,
    PATCH: 3,
    DELETE: 4,
    HEAD: 5,
    OPTIONS: 6,
  },
  Controller: jest.fn(),
  Module: jest.fn(),
  Injectable: jest.fn(),
  Get: jest.fn(),
  Post: jest.fn(),
  Put: jest.fn(),
  Patch: jest.fn(),
  Delete: jest.fn(),
  Body: jest.fn(),
  Param: jest.fn(),
  Query: jest.fn(),
}));

// Export helper function for creating test modules
export function createTestModule() {
  return {
    mockApp: {
      get: jest.fn().mockReturnValue({
        findAll: jest.fn().mockReturnValue({ data: 'test' }),
        create: jest.fn().mockReturnValue({ id: 'test' }),
      }),
      close: jest.fn(),
      enableCors: jest.fn(),
    },
    mockModule: class TestModule {},
    mockController: {
      findAll: jest.fn().mockReturnValue({ data: 'test' }),
      create: jest.fn().mockReturnValue({ id: 'test' }),
    },
  };
}
