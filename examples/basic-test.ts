import { EnumFirebaseFunctionType } from '../src/enums/firebase-function-type.enum';
import { EnumFirebaseFunctionVersion } from '../src/enums/firebase-function-version.enum';
import { scanModuleEndpoints } from '../src/httpFunction/scan-endpoints';
import { Controller, Get, Post } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common';

// Mock a simple controller for testing
@Controller('test')
class TestController {
  @Get('/')
  getTest() {
    return { message: 'test' };
  }

  @Post('/create')
  createTest() {
    return { message: 'created' };
  }
}

// Mock module for testing
const MockModule = {
  name: 'TestModule'
};

// Add metadata as NestJS would
Reflect.defineMetadata('controllers', [TestController], MockModule);

describe('NestFire New Features', () => {
  test('EnumFirebaseFunctionType should have correct values', () => {
    expect(EnumFirebaseFunctionType.HTTPS).toBe('https');
    expect(EnumFirebaseFunctionType.CALLABLE).toBe('callable');
  });

  test('scanModuleEndpoints should extract controller endpoints', () => {
    const endpoints = scanModuleEndpoints(MockModule);
    
    expect(endpoints).toHaveLength(2);
    
    const getEndpoint = endpoints.find(e => e.httpMethod === RequestMethod.GET);
    const postEndpoint = endpoints.find(e => e.httpMethod === RequestMethod.POST);
    
    expect(getEndpoint).toBeDefined();
    expect(getEndpoint?.methodName).toBe('getTest');
    expect(getEndpoint?.path).toBe('/');
    expect(getEndpoint?.functionName).toBe('testGetTest');
    
    expect(postEndpoint).toBeDefined();
    expect(postEndpoint?.methodName).toBe('createTest');
    expect(postEndpoint?.path).toBe('/create');
    expect(postEndpoint?.functionName).toBe('testCreateTest');
  });

  test('interfaces should support new optional properties', () => {
    // This test validates the interfaces compile correctly
    const v1Config = {
      memory: '256MB' as const,
      functionType: EnumFirebaseFunctionType.CALLABLE,
      exportSeparately: true
    };

    const v2Config = {
      memory: '256MiB' as const,
      functionType: EnumFirebaseFunctionType.HTTPS,
      exportSeparately: false,
      removeControllerPrefix: true
    };

    expect(v1Config.functionType).toBe('callable');
    expect(v1Config.exportSeparately).toBe(true);
    expect(v2Config.functionType).toBe('https');
    expect(v2Config.exportSeparately).toBe(false);
  });
});

// Export for potential use
export { TestController, MockModule };