import { expect, test } from '@playwright/test';

test('la cuenta demo entra y ve el cuestionario de clase', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('Correo').fill('demo@profelink.dev');
  await page.getByLabel('Contraseña').fill('Demo1234!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Paradigmas en el aula' })).toBeVisible();
});

test('un código de sala inválido se explica en pantalla', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('Correo').fill('demo@profelink.dev');
  await page.getByLabel('Contraseña').fill('Demo1234!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('link', { name: 'Unirme' }).click();
  await page.getByLabel('Código').fill('ZZZZZZ');
  await page.getByRole('button', { name: 'Unirme' }).click();
  await expect(page.getByText(/sala|código/i)).toBeVisible();
});
