import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ana Rojas' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  displayName!: string;

  @ApiProperty({ example: 'ana@correo.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'clave-segura', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'ronny.salas@profelink.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Demo1234!' })
  @IsString()
  password!: string;
}
