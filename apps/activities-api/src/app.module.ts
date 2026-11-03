import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { QuizModule } from './quizzes/quiz.module';
import { SessionModule } from './sessions/session.module';
import { TelemetryModule } from './telemetry/telemetry.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    TelemetryModule,
    AuthModule,
    MediaModule,
    QuizModule,
    SessionModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
