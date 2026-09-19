import { expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createQuestionnaireRepository, toResponsesCsv, type Queryable } from '@/src/lib/responses';
import { resolveDatabaseTarget } from '@/src/lib/database/target-schema';

const demoSubmission = {
  nickname: 'DEMO-REQ-001-20260918-01-nickname',
  organization: 'DEMO-REQ-001-20260918-01-organization',
  profession: 'DEMO-REQ-001-20260918-01-profession',
  jobTitle: 'DEMO-REQ-001-20260918-01-job-title',
};

function createTarget(tier: 'preview' | 'production') {
  return resolveDatabaseTarget({
    BUSINESS_DIRECT_DATABASE_URL: 'postgresql://demo.invalid/questionnaire',
    BUSINESS_DIRECT_DEPLOYMENT_TIER: tier,
    BUSINESS_DIRECT_DATABASE_SCHEMA: tier === 'preview'
      ? 'proto_survey_questionnaire_poc'
      : 'app_survey_questionnaire_poc',
  });
}

function createQueryable(): { queryable: Queryable; calls: Array<{ text: string; values?: readonly unknown[] }> } {
  const calls: Array<{ text: string; values?: readonly unknown[] }> = [];
  const response = {
    id: '00000000-0000-4000-8000-000000000001',
    nickname: demoSubmission.nickname,
    organization: demoSubmission.organization,
    profession: demoSubmission.profession,
    job_title: demoSubmission.jobTitle,
    created_at: '2026-09-18T00:00:00.000Z',
  };

  return {
    calls,
    queryable: {
      async query<Row>(text: string, values?: readonly unknown[]) {
        calls.push({ text, values });
        return { rows: [response] as unknown as Row[] };
      },
    },
  };
}

it('uses the validated proto table and bound values when inserting a response', async () => {
  const { calls, queryable } = createQueryable();
  const repository = createQuestionnaireRepository(queryable, createTarget('preview'));

  await repository.insertResponse(demoSubmission);

  expect(calls).toEqual([{
    text: 'insert into "proto_survey_questionnaire_poc"."questionnaire_responses" (nickname, organization, profession, job_title) values ($1, $2, $3, $4) returning id, nickname, organization, profession, job_title, created_at',
    values: [
      'DEMO-REQ-001-20260918-01-nickname',
      'DEMO-REQ-001-20260918-01-organization',
      'DEMO-REQ-001-20260918-01-profession',
      'DEMO-REQ-001-20260918-01-job-title',
    ],
  }]);
  expect(calls[0]?.text).not.toContain(demoSubmission.nickname);
});

it('uses the validated production table when listing responses', async () => {
  const { calls, queryable } = createQueryable();
  const repository = createQuestionnaireRepository(queryable, createTarget('production'));

  await repository.listResponses();

  expect(calls).toEqual([{
    text: 'select id, nickname, organization, profession, job_title, created_at from "app_survey_questionnaire_poc"."questionnaire_responses" order by created_at desc',
    values: undefined,
  }]);
});

// The `pg` driver returns a `Date` for `timestamptz`. A string-only double hid
// a real production crash, because React cannot render a raw `Date` as a child.
it('normalizes a driver-returned Date into an ISO timestamp string', async () => {
  const createdAt = new Date('2026-09-18T00:00:00.000Z');
  const queryable: Queryable = {
    async query<Row>() {
      return {
        rows: [{
          id: '00000000-0000-4000-8000-000000000001',
          nickname: demoSubmission.nickname,
          organization: demoSubmission.organization,
          profession: demoSubmission.profession,
          job_title: demoSubmission.jobTitle,
          created_at: createdAt,
        }] as unknown as Row[],
      };
    },
  };

  const [listed] = await createQuestionnaireRepository(queryable, createTarget('preview')).listResponses();
  expect(listed?.createdAt).toBe('2026-09-18T00:00:00.000Z');

  const inserted = await createQuestionnaireRepository(queryable, createTarget('preview')).insertResponse(demoSubmission);
  expect(inserted.createdAt).toBe('2026-09-18T00:00:00.000Z');
});

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
