import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateQuizDto {
  @ApiProperty({ example: 'Paradigmas en el aula' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateQuizDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'Un paradigma define un estilo para resolver problemas.' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  prompt!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  correctAnswer!: boolean;

  @ApiPropertyOptional({ minimum: 5, maximum: 60, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(60)
  timeLimitSeconds?: number;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  prompt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  correctAnswer?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(60)
  timeLimitSeconds?: number;
}

export class MoveQuestionDto {
  @ApiProperty({ enum: ['up', 'down'] })
  @IsIn(['up', 'down'])
  direction!: 'up' | 'down';
}
