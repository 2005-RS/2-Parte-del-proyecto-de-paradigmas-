import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/auth-user';
import { AnswerDto, CreateSessionDto } from './dto';
import { SessionService } from './session.service';

@ApiTags('sesiones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessions: SessionService) {}

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.sessions.listMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSessionDto) {
    return this.sessions.create(dto.quizId, user);
  }

  @Get(':code')
  state(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.sessions.present(code, user.id);
  }

  @Get(':code/results')
  results(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.sessions.results(code, user.id);
  }

  @Post(':code/join')
  join(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.sessions.join(code, user);
  }

  @Post(':code/start')
  start(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.sessions.start(code, user.id);
  }

  @Post(':code/close')
  close(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.sessions.close(code, user.id);
  }

  @Post(':code/next')
  next(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.sessions.next(code, user.id);
  }

  @Post(':code/finish')
  finish(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.sessions.finish(code, user.id);
  }

  @Post(':code/answers')
  answer(@CurrentUser() user: AuthUser, @Param('code') code: string, @Body() dto: AnswerDto) {
    return this.sessions.answer(code, user.id, dto.questionId, dto.value);
  }

  @Delete(':code')
  @HttpCode(204)
  cancel(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.sessions.cancel(code, user.id);
  }
}
