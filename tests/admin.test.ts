import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createExportGetHandler } from '@/app/api/admin/responses/export/route';

const ownerId = '00000000-0000-4000-8000-000000000002';
const demoResponse = {
  id: '00000000-0000-4000-8000-000000000001',
  nickname: 'DEMO-REQ-001-20260918-01-nickname',
  organization: 'DEMO-REQ-001-20260918-01-organization',
  profession: 'DEMO-REQ-001-20260918-01-profession',
  jobTitle: 'DEMO-REQ-001-20260918-01-job-title',
  createdAt: '2026-09-18T00:00:00.000Z',
};

const originalOwnerId = process.env.BUSINESS_APP_OWNER_USER_ID;

afterEach(() => {
  if (originalOwnerId === undefined) {
    delete process.env.BUSINESS_APP_OWNER_USER_ID;
    return;
  }

  process.env.BUSINESS_APP_OWNER_USER_ID = originalOwnerId;
});

describe('GET /api/admin/responses/export', () => {
  it('withholds response data when no authenticated user exists', async () => {
    process.env.BUSINESS_APP_OWNER_USER_ID = ownerId;
    const get = createExportGetHandler({
      getUser: async () => null,
      listResponses: async () => [demoResponse],
    });

    const response = await get();

    expect(response.status).toBe(401);
    expect(await response.text()).toBe('');
  });

  it('rejects an authenticated non-owner by immutable user ID', async () => {
    process.env.BUSINESS_APP_OWNER_USER_ID = ownerId;
    const get = createExportGetHandler({
      getUser: async () => ({ id: '00000000-0000-4000-8000-000000000003' }),
      listResponses: async () => [demoResponse],
    });

    const response = await get();

    expect(response.status).toBe(403);
    expect(await response.text()).toBe('');
  });

  it('returns a downloadable CSV for the configured owner', async () => {
    process.env.BUSINESS_APP_OWNER_USER_ID = ownerId;
    const get = createExportGetHandler({
      getUser: async () => ({ id: ownerId }),
      listResponses: async () => [demoResponse],
    });

    const response = await get();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="questionnaire-responses.csv"',
    );
    expect(await response.text()).toBe(
      'id,nickname,organization,profession,jobTitle,createdAt\r\n' +
      '00000000-0000-4000-8000-000000000001,DEMO-REQ-001-20260918-01-nickname,DEMO-REQ-001-20260918-01-organization,DEMO-REQ-001-20260918-01-profession,DEMO-REQ-001-20260918-01-job-title,2026-09-18T00:00:00.000Z\r\n',
    );
  });
});
