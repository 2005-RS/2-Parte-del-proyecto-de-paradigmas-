import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { DomainError } from '../common/domain-error';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/auth-user';
import { CreateQuestionDto, CreateQuizDto, MoveQuestionDto, UpdateQuestionDto, UpdateQuizDto } from './dto';
import { QuizService } from './quiz.service';

@ApiTags('cuestionarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizzes: QuizService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.quizzes.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateQuizDto) {
    return this.quizzes.create(dto, user);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.quizzes.get(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzes.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.quizzes.remove(id, user.id);
  }

  @Post(':id/questions')
  addQuestion(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.quizzes.addQuestion(id, user.id, dto);
  }

  @Patch(':id/questions/:questionId')
  updateQuestion(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.quizzes.updateQuestion(id, questionId, user.id, dto);
  }

  @Delete(':id/questions/:questionId')
  @HttpCode(204)
  removeQuestion(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ) {
    return this.quizzes.removeQuestion(id, questionId, user.id);
  }

  @Post(':id/questions/:questionId/move')
  move(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: MoveQuestionDto,
  ) {
    return this.quizzes.moveQuestion(id, questionId, user.id, dto.direction);
  }

  @Post(':id/questions/:questionId/image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2_097_152 },
    }),
  )
  saveImage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @UploadedFile() file?: { buffer: Buffer },
  ) {
    if (!file?.buffer) throw new DomainError('IMAGE_TYPE', 'Selecciona un archivo de imagen.', 400);
    return this.quizzes.saveImage(id, questionId, user.id, file.buffer);
  }
}
