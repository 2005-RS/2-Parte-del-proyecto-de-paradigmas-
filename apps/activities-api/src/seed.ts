import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { PrismaClient } from '@prisma/client';
import { PNG } from 'pngjs';

const DEMO_USER_ID = '11111111-1111-4111-8111-111111111111';
const DEMO_QUIZ_ID = '22222222-2222-4222-8222-222222222222';
const prisma = new PrismaClient();

function paint(png: PNG, x: number, y: number, width: number, height: number, color: number[]) {
  for (let row = y; row < y + height; row += 1) {
    for (let col = x; col < x + width; col += 1) {
      if (col < 0 || row < 0 || col >= png.width || row >= png.height) continue;
      const index = (png.width * row + col) << 2;
      png.data[index] = color[0];
      png.data[index + 1] = color[1];
      png.data[index + 2] = color[2];
      png.data[index + 3] = 255;
    }
  }
}

async function writeDemoImage(file: string): Promise<void> {
  const png = new PNG({ width: 640, height: 360 });
  paint(png, 0, 0, 640, 360, [18, 48, 40]);
  paint(png, 48, 40, 544, 280, [246, 241, 231]);
  paint(png, 96, 150, 70, 120, [15, 122, 98]);
  paint(png, 196, 110, 70, 160, [227, 155, 18]);
  paint(png, 296, 80, 70, 190, [197, 55, 47]);
  paint(png, 396, 130, 70, 140, [23, 33, 27]);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, PNG.sync.write(png));
}

async function main(): Promise<void> {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  await writeDemoImage(join(uploadDir, 'demo-paradigmas.png'));
  if (process.env.SEED !== 'true') {
    console.log('Semilla de actividades omitida. La imagen de demostración quedó en el volumen.');
    return;
  }
  const exists = await prisma.quiz.findUnique({ where: { id: DEMO_QUIZ_ID } });
  if (exists) {
    console.log('Cuestionario demo ya existe.');
    return;
  }

  await prisma.quiz.create({
    data: {
      id: DEMO_QUIZ_ID,
      ownerId: DEMO_USER_ID,
      ownerName: 'Ronny Salas',
      title: 'Paradigmas en el aula',
      description: 'Evaluación corta de verdadero o falso para abrir la clase.',
      questions: {
        create: [
          {
            id: '33333333-3333-4333-8333-333333333331',
            prompt: 'En la programación orientada a objetos, el comportamiento se organiza alrededor de objetos.',
            correctAnswer: true,
            timeLimitSeconds: 20,
            orderIndex: 0,
          },
          {
            id: '33333333-3333-4333-8333-333333333332',
            prompt: 'Un arreglo y una lista ocupan siempre el mismo modelo de memoria en todos los lenguajes.',
            correctAnswer: false,
            timeLimitSeconds: 20,
            orderIndex: 1,
          },
          {
            id: '33333333-3333-4333-8333-333333333333',
            prompt: 'Docker Compose sirve para describir varios servicios y levantarlos juntos.',
            correctAnswer: true,
            imagePath: '/media/demo-paradigmas.png',
            timeLimitSeconds: 25,
            orderIndex: 2,
          },
          {
            id: '33333333-3333-4333-8333-333333333334',
            prompt: 'La respuesta correcta debe enviarse al celular antes de que la persona conteste.',
            correctAnswer: false,
            timeLimitSeconds: 20,
            orderIndex: 3,
          },
          {
            id: '33333333-3333-4333-8333-333333333335',
            prompt: 'Una variable guarda un valor que el programa puede leer o cambiar más adelante.',
            correctAnswer: true,
            timeLimitSeconds: 20,
            orderIndex: 4,
          },
          {
            id: '33333333-3333-4333-8333-333333333336',
            prompt: 'Un bucle for sirve para repetir instrucciones un número de veces.',
            correctAnswer: true,
            timeLimitSeconds: 20,
            orderIndex: 5,
          },
          {
            id: '33333333-3333-4333-8333-333333333337',
            prompt: 'Un programa compilado se interpreta línea por línea cada vez que se ejecuta.',
            correctAnswer: false,
            timeLimitSeconds: 20,
            orderIndex: 6,
          },
          {
            id: '33333333-3333-4333-8333-333333333338',
            prompt: 'Una función puede recibir datos, trabajar con ellos y devolver un resultado.',
            correctAnswer: true,
            timeLimitSeconds: 20,
            orderIndex: 7,
          },
          {
            id: '33333333-3333-4333-8333-333333333339',
            prompt: 'En todos los lenguajes, el primer elemento de un arreglo está en la posición 1.',
            correctAnswer: false,
            timeLimitSeconds: 20,
            orderIndex: 8,
          },
          {
            id: '33333333-3333-4333-8333-33333333333a',
            prompt: 'Un comentario modifica el resultado del programa cuando este se ejecuta.',
            correctAnswer: false,
            timeLimitSeconds: 20,
            orderIndex: 9,
          },
          {
            id: '33333333-3333-4333-8333-33333333333b',
            prompt: 'La programación funcional prefiere no cambiar los datos que ya fueron creados.',
            correctAnswer: true,
            timeLimitSeconds: 20,
            orderIndex: 10,
          },
          {
            id: '33333333-3333-4333-8333-33333333333c',
            prompt: 'HTML es un lenguaje de programación de propósito general, igual que Python o Java.',
            correctAnswer: false,
            timeLimitSeconds: 20,
            orderIndex: 11,
          },
        ],
      },
    },
  });
  console.log('Cuestionario demo listo: Paradigmas en el aula');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
