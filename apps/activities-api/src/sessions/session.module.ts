import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionGateway } from './session.gateway';
import { SessionService } from './session.service';

@Module({
  controllers: [SessionController],
  providers: [SessionService, SessionGateway],
})
export class SessionModule {}
