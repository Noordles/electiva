import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { apiFixture } from '../../server/tests/api-helpers.js';
import { HttpError } from '../../server/src/errors.js';

test('production browser: sign in, enroll, waitlist, cancel, promote and reload at three widths', { timeout: 60000 }, async t => {
  const { running, accounts } = await apiFixture(t, { staticDirectory: path.resolve('client/dist') });
  const browser = await chromium.launch(); t.after(() => browser.close());
  const first = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const second = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await first.newPage(), other = await second.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message)); other.on('pageerror', error => errors.push(error.message));
  const signIn = async (target, email) => {
    await target.goto(running.url + '/login');
    await target.getByLabel('Account email').fill(email);
    await target.getByLabel('Password', { exact: true }).fill(accounts.password);
    await target.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(target.locator('.course-card')).toHaveCount(6);
  };
  await page.goto(running.url + '/courses');
  await expect(page.getByRole('heading', { name: 'Your workspace starts here.' })).toBeVisible();
  await signIn(page, 'student1@example.test');
  await mkdir('artifacts/m3', { recursive: true });
  for (const width of [1280, 768, 360]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `horizontal overflow at ${width}`);
    await page.screenshot({ path: `artifacts/m3/student-catalog-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  const choose = async target => {
    await target.getByRole('textbox', { name: 'Search courses' }).fill('Data Visualization');
    await expect(target.locator('.course-card')).toHaveCount(1);
    const opener = target.getByRole('button', { name: 'Explore course' });
    await opener.focus(); await target.keyboard.press('Enter');
    await expect(target.getByRole('dialog')).toBeVisible();
    await target.keyboard.press('Escape'); await expect(target.getByRole('dialog')).toHaveCount(0);
    await expect(opener).toBeFocused(); await target.keyboard.press('Enter');
  };
  await choose(page); await page.getByRole('button', { name: 'Enroll in this course' }).click();
  await expect(page.getByText('You’re enrolled. Your place is saved.')).toBeVisible();
  await signIn(other, 'student2@example.test'); await choose(other);
  await other.getByRole('button', { name: 'Join the waitlist' }).click();
  await expect(other.getByText('You’re on the waitlist.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'See my enrollments' }).click();
  await expect(page.locator('.status-active')).toHaveText('Enrolled');
  await page.getByRole('button', { name: 'Cancel enrollment', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel enrollment', exact: true }).click();
  await expect(page.locator('.status-cancelled')).toHaveText('Cancelled');
  await page.reload(); await expect(page.locator('.status-cancelled')).toHaveText('Cancelled');
  await other.getByRole('link', { name: 'See my enrollments' }).click();
  await expect(other.locator('.status-active')).toHaveText('Enrolled');
  await other.reload(); await expect(other.locator('.status-active')).toHaveText('Enrolled');
  await page.goto(running.url + '/admin');
  await expect(page.getByRole('heading', { name: 'A different workspace.' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.goto(running.url + '/my-enrollments');
  await expect(page.getByRole('heading', { name: 'Your workspace starts here.' })).toBeVisible();
  assert.deepEqual(errors, []);
});

test('catalog shows a real API failure and Retry recovers without a page reload', { timeout: 30000 }, async t => {
  const { db, running, accounts } = await apiFixture(t, { staticDirectory: path.resolve('client/dist') });
  const all = db.all; let unavailable = true;
  db.all = (sql, ...args) => {
    if (unavailable && sql.includes('count(*) AS total FROM offerings o JOIN')) throw new HttpError(503, 'temporarily_busy', 'Please try again shortly');
    return all(sql, ...args);
  };
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.goto(running.url + '/login');
  await page.getByLabel('Account email').fill('student1@example.test');
  await page.getByLabel('Password', { exact: true }).fill(accounts.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Please try again shortly');
  unavailable = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('.course-card')).toHaveCount(6);
  await expect(page.getByRole('alert')).toHaveCount(0);
});
