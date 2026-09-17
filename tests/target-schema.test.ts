import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { resolveDatabaseTarget } from '@/src/lib/database/target-schema';

const validEnvironment = {
  BUSINESS_DIRECT_DATABASE_URL: 'postgresql://demo.invalid/questionnaire',
  BUSINESS_DIRECT_DEPLOYMENT_TIER: 'preview',
  BUSINESS_DIRECT_DATABASE_SCHEMA: 'proto_survey_questionnaire_poc',
};

function resolve(overrides: Record<string, string | undefined> = {}) {
  return resolveDatabaseTarget({ ...validEnvironment, ...overrides });
}

describe('resolveDatabaseTarget', () => {
  it('maps preview to the fixed proto questionnaire table', () => {
    expect(resolve()).toEqual({
      tier: 'preview',
      schema: 'proto_survey_questionnaire_poc',
      schemaSql: '"proto_survey_questionnaire_poc"',
      tableSql: '"proto_survey_questionnaire_poc"."questionnaire_responses"',
    });
  });

  it('maps production to the fixed application questionnaire table', () => {
    expect(resolve({
      BUSINESS_DIRECT_DEPLOYMENT_TIER: 'production',
      BUSINESS_DIRECT_DATABASE_SCHEMA: 'app_survey_questionnaire_poc',
    })).toEqual({
      tier: 'production',
      schema: 'app_survey_questionnaire_poc',
      schemaSql: '"app_survey_questionnaire_poc"',
      tableSql: '"app_survey_questionnaire_poc"."questionnaire_responses"',
    });
  });

  it.each([
    { BUSINESS_DIRECT_DATABASE_URL: undefined },
    { BUSINESS_DIRECT_DEPLOYMENT_TIER: undefined },
    { BUSINESS_DIRECT_DATABASE_SCHEMA: undefined },
    { BUSINESS_DIRECT_DEPLOYMENT_TIER: 'preview', BUSINESS_DIRECT_DATABASE_SCHEMA: 'app_survey_questionnaire_poc' },
    { BUSINESS_DIRECT_DEPLOYMENT_TIER: 'production', BUSINESS_DIRECT_DATABASE_SCHEMA: 'proto_survey_questionnaire_poc' },
    { BUSINESS_DIRECT_DATABASE_SCHEMA: 'public' },
  ])('fails closed for invalid database target configuration: %o', (overrides) => {
    expect(() => resolve(overrides)).toThrow('Database target configuration is invalid.');
  });
});
