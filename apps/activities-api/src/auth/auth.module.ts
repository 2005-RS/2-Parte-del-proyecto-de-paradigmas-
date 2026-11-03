import { Global, Module } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenVerifier } from './token-verifier';

@Global()
@Module({
  providers: [TokenVerifier, JwtAuthGuard],
  exports: [TokenVerifier, JwtAuthGuard],
})
export class AuthModule {}
