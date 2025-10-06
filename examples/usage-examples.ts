import { Module, Controller, Get, Post, Body } from '@nestjs/common';
import { FirebaseHttps } from '../src/decorators/firebase-https.decorator';
import { EnumFirebaseFunctionVersion, EnumFirebaseFunctionType } from '../src/index';

// Example 1: Callable Function Module (Single handleCall method)
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
// This will create functions: user-get-users, user-create-user, user-get-user-by-id
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
// This will create functions: notification-send-notification, notification-schedule-notification
@Controller('notifications')
class NotificationsController {
  // For individual callable functions, each method receives data and context directly
  // All callable functions behave as POST-equivalent regardless of HTTP decorators
  async sendNotification(data: { message: string; userId: string }, context: any) {
    return { 
      status: 'sent', 
      message: `Notification "${data.message}" sent to user ${data.userId}`,
      timestamp: new Date().toISOString()
    };
  }

  async scheduleNotification(data: { message: string; userId: string; scheduleTime: string }, context: any) {
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

// Example 4: Callable Function with action-based routing
@Controller('tasks')
class TasksController {
  async createTask(data: { title: string; description: string }, context: any) {
    return { id: Math.random(), title: data.title, status: 'pending' };
  }

  async updateTask(data: { id: string; status: string }, context: any) {
    return { id: data.id, status: data.status, updated: true };
  }

  async deleteTask(data: { id: string }, context: any) {
    return { id: data.id, deleted: true };
  }
}

@FirebaseHttps(EnumFirebaseFunctionVersion.V2, {
  functionType: EnumFirebaseFunctionType.CALLABLE,
  memory: '256MB'
})
@Module({
  controllers: [TasksController],
})
export class TasksCallableModule {}

// Usage on client side:
// const tasks = httpsCallable(functions, 'tasks');
// 
// // Using action-based routing:
// const createResult = await tasks({ action: 'createTask', title: 'New Task', description: 'Task description' });
// const updateResult = await tasks({ action: 'updateTask', id: '123', status: 'completed' });
// 
// // Individual callable functions:
// const sendNotification = httpsCallable(functions, 'notification-send-notification');
// const result = await sendNotification({ message: 'Hello', userId: 'user123' });

// Main App Module
@Module({
  imports: [
    CalculatorCallableModule,
    UsersIndividualModule,
    NotificationsCallableIndividualModule,
    TasksCallableModule
  ],
})
export class AppModule {}