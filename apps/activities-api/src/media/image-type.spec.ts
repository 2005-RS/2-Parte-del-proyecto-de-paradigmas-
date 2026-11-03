import { detectImage } from './image-type';

describe('validación de imágenes', () => {
  it('reconoce PNG, JPEG y WebP por su contenido', () => {
    expect(detectImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
    expect(detectImage(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe('jpeg');
    const webp = Buffer.alloc(12);
    webp.write('RIFF', 0);
    webp.write('WEBP', 8);
    expect(detectImage(webp)).toBe('webp');
  });

  it('rechaza un archivo que no es imagen o un SVG renombrado', () => {
    expect(detectImage(Buffer.from('<svg></svg>'))).toBeNull();
    expect(detectImage(Buffer.from('not-an-image'))).toBeNull();
  });
});
