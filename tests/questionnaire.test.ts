import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { DEMO_PREFIX, parseQuestionnaireSubmission } from '@/src/lib/questionnaire';
import { createResponsesPostHandler } from '@/app/api/responses/route';

const valid = {
  nickname: `${DEMO_PREFIX}-nickname`,
  organization: `${DEMO_PREFIX}-organization`,
  profession: `${DEMO_PREFIX}-profession`,
  jobTitle: `${DEMO_PREFIX}-job-title`,
};

describe('parseQuestionnaireSubmission', () => {
  it('returns trimmed compliant values for all four fields', () => {
    expect(parseQuestionnaireSubmission({
      nickname: ` ${valid.nickname} `,
      organization: valid.organization,
      profession: valid.profession,
      jobTitle: valid.jobTitle,
    })).toEqual({ ok: true, value: valid });
  });

  it('reports every missing field without accepting a partial submission', () => {
    expect(parseQuestionnaireSubmission({})).toEqual({
      ok: false,
      fieldErrors: {
        nickname: 'Nickname is required.',
        organization: 'Organization is required.',
        profession: 'Profession is required.',
        jobTitle: 'Job title is required.',
      },
    });
  });

  it('rejects a required field that lacks the demo prefix', () => {
    expect(parseQuestionnaireSubmission({ ...valid, profession: 'doctor' })).toEqual({
      ok: false,
      fieldErrors: {
        nickname: '',
        organization: '',
        profession: `Profession must start with ${DEMO_PREFIX}.`,
        jobTitle: '',
      },
    });
  });
});

describe('POST /api/responses', () => {
  it('rejects invalid input without calling persistence', async () => {
    let insertCalls = 0;
    const post = createResponsesPostHandler({
      insertResponse: async () => {
        insertCalls += 1;
        throw new Error('Persistence must not be called for invalid input.');
      },
    });

    const response = await post(new Request('http://localhost/api/responses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...valid, profession: 'not-a-demo-value' }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      fieldErrors: {
        nickname: '',
        organization: '',
        profession: `Profession must start with ${DEMO_PREFIX}.`,
        jobTitle: '',
      },
    });
    expect(insertCalls).toBe(0);
  });

  it('persists compliant input and returns the public success response', async () => {
    let persisted: unknown;
    const post = createResponsesPostHandler({
      insertResponse: async (submission) => {
        persisted = submission;
        return { ...submission, id: 'response-1', createdAt: '2026-09-18T00:00:00.000Z' };
      },
    });

    const response = await post(new Request('http://localhost/api/responses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(valid),
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
    expect(persisted).toEqual(valid);
  });

  it('returns a safe error when the request body or persistence operation fails', async () => {
    const post = createResponsesPostHandler({
      insertResponse: async () => {
        throw new Error(`${valid.nickname} must not be disclosed`);
      },
    });

    const malformedResponse = await post(new Request('http://localhost/api/responses', {
      method: 'POST',
      body: '{',
    }));
    const persistenceResponse = await post(new Request('http://localhost/api/responses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(valid),
    }));

    expect(malformedResponse.status).toBe(400);
    expect(await malformedResponse.json()).toEqual({ ok: false, error: 'Invalid request.' });
    expect(persistenceResponse.status).toBe(500);
    expect(await persistenceResponse.json()).toEqual({ ok: false, error: 'Unable to submit response.' });
  });
});
