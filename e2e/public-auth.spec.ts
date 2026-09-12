import { expect, test } from '@playwright/test'

test('public navigation reaches login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/HealthVault/i)
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: /sign in to your vault/i })).toBeVisible()
  await expect(page.getByLabel('Email address')).toBeVisible()
})

test('login switches between signup and recovery', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: /create an account/i }).click()
  await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible()
  await expect(page.getByLabel('Date of birth')).toBeVisible()
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.getByRole('button', { name: /forgot password/i }).click()
  await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible()
  await expect(page.getByLabel('Password')).toHaveCount(0)
})

test('login theme follows the device and persists an override', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/login')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: 'System theme' })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Light theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.getByRole('button', { name: 'Light theme' })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'System theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('authentication layout adapts to the viewport', async ({ page }, testInfo) => {
  await page.goto('/login')
  const artwork = page.getByTestId('auth-artwork')
  if (testInfo.project.name === 'mobile') {
    await expect(artwork).toBeHidden()
  } else {
    await expect(artwork).toBeVisible()
  }
  await expect(page.getByRole('group', { name: 'Color theme' })).toBeVisible()
})

test('protected tool deep link preserves its destination', async ({ page }) => {
  await page.goto('/dashboard?tab=bill')
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%3Ftab%3Dbill/)
  await expect(page.getByRole('heading', { name: /sign in to your vault/i })).toBeVisible()
})

test('tools expose dashboard deep links', async ({ page }) => {
  await page.goto('/tools')
  await expect(page.locator('a[href="/dashboard?tab=bill"]')).toHaveCount(1)
  await expect(page.locator('a[href="/dashboard?tab=family"]')).toHaveCount(1)
})
