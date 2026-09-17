import { describe, expect, it } from 'vitest';
import { DEMO_PREFIX, parseQuestionnaireSubmission } from '@/src/lib/questionnaire';

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
