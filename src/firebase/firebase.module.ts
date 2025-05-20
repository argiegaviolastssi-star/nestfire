import { Global, Module } from '@nestjs/common';
import { Firebase } from './firebase';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  providers: [Firebase],
  imports: [ConfigModule.forRoot({ envFilePath: '.env' })],
  exports: [Firebase],
})
export class FirebaseModule {}
