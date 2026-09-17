import { expect, it } from 'vitest';
import { toResponsesCsv } from '@/src/lib/responses';

it('serializes a response using RFC 4180 quoting and only demo values', () => {
  expect(toResponsesCsv([{
    id: '00000000-0000-4000-8000-000000000001',
    nickname: 'DEMO-REQ-001-20260918-01-nickname',
    organization: 'DEMO-REQ-001-20260918-01-organization, unit',
    profession: 'DEMO-REQ-001-20260918-01-profession',
    jobTitle: 'DEMO-REQ-001-20260918-01-"job-title"',
    createdAt: '2026-09-18T00:00:00.000Z',
  }])).toBe(
    'id,nickname,organization,profession,jobTitle,createdAt\r\n' +
    '00000000-0000-4000-8000-000000000001,DEMO-REQ-001-20260918-01-nickname,"DEMO-REQ-001-20260918-01-organization, unit",DEMO-REQ-001-20260918-01-profession,"DEMO-REQ-001-20260918-01-""job-title""",2026-09-18T00:00:00.000Z\r\n',
  );
});
