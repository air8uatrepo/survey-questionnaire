import 'server-only';

export type DatabaseTarget =
  | {
    tier: 'proto' | 'preview';
    schema: 'proto_survey_questionnaire_poc';
    schemaSql: '"proto_survey_questionnaire_poc"';
    tableSql: '"proto_survey_questionnaire_poc"."questionnaire_responses"';
  }
  | {
    tier: 'production';
    schema: 'app_survey_questionnaire_poc';
    schemaSql: '"app_survey_questionnaire_poc"';
    tableSql: '"app_survey_questionnaire_poc"."questionnaire_responses"';
  };

const invalidTargetMessage = 'Database target configuration is invalid.';

function invalidTarget(): never {
  throw new Error(invalidTargetMessage);
}

export function assertDatabaseTarget(target: unknown): asserts target is DatabaseTarget {
  const candidate = target as Partial<DatabaseTarget>;
  if (
    typeof target !== 'object'
    || target === null
    || !(
      (candidate.tier === 'proto' || candidate.tier === 'preview')
      && candidate.schema === 'proto_survey_questionnaire_poc'
      && candidate.schemaSql === '"proto_survey_questionnaire_poc"'
      && candidate.tableSql === '"proto_survey_questionnaire_poc"."questionnaire_responses"'
    )
    && !(
      candidate.tier === 'production'
      && candidate.schema === 'app_survey_questionnaire_poc'
      && candidate.schemaSql === '"app_survey_questionnaire_poc"'
      && candidate.tableSql === '"app_survey_questionnaire_poc"."questionnaire_responses"'
    )
  ) {
    invalidTarget();
  }
}

export function resolveDatabaseTarget(env: Readonly<Record<string, string | undefined>>): DatabaseTarget {
  const databaseUrl = env.BUSINESS_DIRECT_DATABASE_URL;
  const tier = env.BUSINESS_DIRECT_DEPLOYMENT_TIER;
  const schema = env.BUSINESS_DIRECT_DATABASE_SCHEMA;

  if (databaseUrl === undefined || databaseUrl === '') {
    return invalidTarget();
  }

  if ((tier === 'proto' || tier === 'preview') && schema === 'proto_survey_questionnaire_poc') {
    return {
      tier,
      schema,
      schemaSql: '"proto_survey_questionnaire_poc"',
      tableSql: '"proto_survey_questionnaire_poc"."questionnaire_responses"',
    };
  }

  if (tier === 'production' && schema === 'app_survey_questionnaire_poc') {
    return {
      tier,
      schema,
      schemaSql: '"app_survey_questionnaire_poc"',
      tableSql: '"app_survey_questionnaire_poc"."questionnaire_responses"',
    };
  }

  return invalidTarget();
}
