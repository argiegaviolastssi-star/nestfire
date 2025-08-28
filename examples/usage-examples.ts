import { Module, Controller, Get, Post, Body } from '@nestjs/common';
import { FirebaseHttps } from '../src/decorators/firebase-https.decorator';
import { EnumFirebaseFunctionVersion, EnumFirebaseFunctionType } from '../src/index';

// Example 1: Callable Function Module
@Controller('calculator')
class CalculatorController {
  // This method will be called for callable functions
  // Convention: handleCall method for callable function execution
  async handleCall(data: { operation: string; a: number; b: number }, context: any) {
    const { operation, a, b } = data;
    
    switch (operation) {
      case 'add':
        return { result: a + b };
      case 'subtract':
        return { result: a - b };
      case 'multiply':
        return { result: a * b };
      case 'divide':
        if (b === 0) throw new Error('Division by zero');
        return { result: a / b };
      default:
        throw new Error('Unsupported operation');
    }
  }
}

@FirebaseHttps(EnumFirebaseFunctionVersion.V2, {
  functionType: EnumFirebaseFunctionType.CALLABLE,
  memory: '256MB',
  region: 'us-central1'
})
@Module({
  controllers: [CalculatorController],
})
export class CalculatorCallableModule {}

// Example 2: Individual HTTPS Endpoints Module
@Controller('users')
class UsersController {
  @Get('/')
  async getUsers() {
    return { users: ['John', 'Jane', 'Bob'] };
  }

  @Post('/')
  async createUser(@Body() userData: { name: string }) {
    return { message: `User ${userData.name} created`, id: Math.random() };
  }

  @Get('/:id')
  async getUserById() {
    return { user: { id: 1, name: 'John Doe' } };
  }
}

@FirebaseHttps(EnumFirebaseFunctionVersion.V2, {
  exportSeparately: true,
  functionType: EnumFirebaseFunctionType.HTTPS,
  memory: '512MB'
})
@Module({
  controllers: [UsersController],
})
export class UsersIndividualModule {}

// Example 3: Individual Callable Endpoints Module
@Controller('notifications')
class NotificationsController {
  async sendNotification(data: { message: string; userId: string }, context: any) {
    // This would be called as an individual callable function
    return { 
      status: 'sent', 
      message: `Notification "${data.message}" sent to user ${data.userId}`,
      timestamp: new Date().toISOString()
    };
  }

  async scheduleNotification(data: { message: string; userId: string; scheduleTime: string }, context: any) {
    // Another individual callable function
    return {
      status: 'scheduled',
      message: `Notification scheduled for ${data.scheduleTime}`,
      notificationId: Math.random().toString(36)
    };
  }
}

@FirebaseHttps(EnumFirebaseFunctionVersion.V2, {
  exportSeparately: true,
  functionType: EnumFirebaseFunctionType.CALLABLE,
  memory: '256MB'
})
@Module({
  controllers: [NotificationsController],
})
export class NotificationsCallableIndividualModule {}

// Main App Module
@Module({
  imports: [
    CalculatorCallableModule,
    UsersIndividualModule,
    NotificationsCallableIndividualModule
  ],
})
export class AppModule {}