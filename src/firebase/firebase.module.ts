import { Global, Module } from '@nestjs/common';
import { Firebase } from './firebase';

@Global()
@Module({
  providers: [Firebase],
  exports: [Firebase],
})
export class FirebaseModule {}
