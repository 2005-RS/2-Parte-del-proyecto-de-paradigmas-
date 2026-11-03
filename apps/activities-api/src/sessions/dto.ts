import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  quizId!: string;
}

export class AnswerDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  questionId!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  value!: boolean;
}
