import { expect, test, type Page } from '@playwright/test';

const DEMO_PREFIX = 'DEMO-REQ-001-20260918-01';
const response = {
  nickname: `${DEMO_PREFIX}-nickname`,
  organization: `${DEMO_PREFIX}-organization`,
  profession: `${DEMO_PREFIX}-profession`,
  jobTitle: `${DEMO_PREFIX}-job-title`,
};

// This rejected value is intentionally ephemeral: it is never persisted,
// exported, logged, or retained as browser evidence.
const rejectedProfession = `INVALID-${DEMO_PREFIX}-profession`;

// A `status` role takes its accessible name from the author (aria-label or
// aria-labelledby), never from its content, so a `{ name: ... }` filter can
// never match this element. Match the status region and assert its exact
// visible text instead. Using the name filter here silently degraded the
// negative assertions below to a vacuous `toHaveCount(0)`.
const successStatus = (page: Page) =>
  page.getByRole('status').filter({ hasText: /^Submission successful$/ });

function requiredOwnerEnvironment(name: 'BUSINESS_DIRECT_E2E_OWNER_EMAIL' | 'BUSINESS_DIRECT_E2E_OWNER_PASSWORD'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required synthetic owner environment variable: ${name}`);
  }
  return value;
}

test('E2E-KP-REQ-001-001 retains the public submission through owner CSV export', async ({ page }) => {
  const ownerEmail = requiredOwnerEnvironment('BUSINESS_DIRECT_E2E_OWNER_EMAIL');
  const ownerPassword = requiredOwnerEnvironment('BUSINESS_DIRECT_E2E_OWNER_PASSWORD');

  await page.goto('/');
  await expect(page.getByRole('note')).toContainText('do not enter real personal or business information');

  for (const label of ['Nickname', 'Organization', 'Profession', 'Job title']) {
    const field = page.getByLabel(label, { exact: true });
    await expect(field).toBeVisible();
    await expect(field).toHaveAttribute('required', '');
  }

  await page.getByLabel('Nickname', { exact: true }).fill(response.nickname);
  await page.getByLabel('Organization', { exact: true }).fill(response.organization);
  await page.getByLabel('Profession', { exact: true }).fill(response.profession);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Job title is required.' })).toBeVisible();
  await expect(successStatus(page)).toHaveCount(0);

  await page.getByLabel('Job title', { exact: true }).fill(response.jobTitle);
  await page.getByLabel('Profession', { exact: true }).fill(rejectedProfession);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: `Profession must start with ${DEMO_PREFIX}.` })).toBeVisible();
  await expect(successStatus(page)).toHaveCount(0);

  await page.reload();
  await expect(page.getByLabel('Nickname', { exact: true })).toHaveValue('');
  await expect(page.getByText(response.nickname, { exact: true })).toHaveCount(0);

  await page.getByLabel('Nickname', { exact: true }).fill(response.nickname);
  await page.getByLabel('Organization', { exact: true }).fill(response.organization);
  await page.getByLabel('Profession', { exact: true }).fill(response.profession);
  await page.getByLabel('Job title', { exact: true }).fill(response.jobTitle);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(successStatus(page)).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Nickname', { exact: true })).toHaveValue('');
  await expect(page.getByText(response.nickname, { exact: true })).toHaveCount(0);

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login(?:\?.*)?$/);
  await page.getByLabel('Email', { exact: true }).fill(ownerEmail);
  await page.getByLabel('Password', { exact: true }).fill(ownerPassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/admin(?:\?.*)?$/);

  for (const value of Object.values(response)) {
    await expect(page.getByText(value, { exact: true })).toBeVisible();
  }

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download CSV', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('questionnaire-responses.csv');

  const stream = await download.createReadStream();
  if (stream === null) {
    throw new Error('CSV download stream was unavailable.');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const csv = Buffer.concat(chunks).toString('utf8');
  expect(csv).toContain('id,nickname,organization,profession,jobTitle,createdAt\r\n');
  expect(csv).not.toContain(rejectedProfession);
  for (const value of Object.values(response)) {
    expect(csv.match(new RegExp(value, 'g'))).toHaveLength(1);
  }
});
