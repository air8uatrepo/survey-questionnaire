import 'server-only';

import type { QuestionnaireResponse, QuestionnaireSubmission } from './questionnaire';
import { createQuestionnairePool, type Queryable } from './database/pool';
import { assertDatabaseTarget, resolveDatabaseTarget, type DatabaseTarget } from './database/target-schema';

export type { Queryable } from './database/pool';

type DatabaseQuestionnaireResponse = {
  id: string;
  nickname: string;
  organization: string;
  profession: string;
  job_title: string;
  created_at: string;
};

function toQuestionnaireResponse(row: DatabaseQuestionnaireResponse): QuestionnaireResponse {
  return {
    id: row.id,
    nickname: row.nickname,
    organization: row.organization,
    profession: row.profession,
    jobTitle: row.job_title,
    createdAt: row.created_at,
  };
}

function recordOperationFailure(operationId: string): void {
  console.error({ operationId });
}

export type QuestionnaireRepository = {
  insertResponse(submission: QuestionnaireSubmission): Promise<QuestionnaireResponse>;
  listResponses(): Promise<QuestionnaireResponse[]>;
};

export function createQuestionnaireRepository(
  queryable: Queryable,
  target: DatabaseTarget,
): QuestionnaireRepository {
  assertDatabaseTarget(target);

  return {
    async insertResponse(submission) {
      const operationId = crypto.randomUUID();
      try {
        const result = await queryable.query<DatabaseQuestionnaireResponse>(
          `insert into ${target.tableSql} (nickname, organization, profession, job_title) values ($1, $2, $3, $4) returning id, nickname, organization, profession, job_title, created_at`,
          [submission.nickname, submission.organization, submission.profession, submission.jobTitle],
        );
        const row = result.rows[0];
        if (row === undefined) {
          throw new Error('No response returned.');
        }
        return toQuestionnaireResponse(row);
      } catch {
        recordOperationFailure(operationId);
        throw new Error('Response persistence failed.');
      }
    },
    async listResponses() {
      const operationId = crypto.randomUUID();
      try {
        const result = await queryable.query<DatabaseQuestionnaireResponse>(
          `select id, nickname, organization, profession, job_title, created_at from ${target.tableSql} order by created_at desc`,
        );
        return result.rows.map(toQuestionnaireResponse);
      } catch {
        recordOperationFailure(operationId);
        throw new Error('Response retrieval failed.');
      }
    },
  };
}

function createEnvironmentRepository(): QuestionnaireRepository {
  const target = resolveDatabaseTarget(process.env);
  return createQuestionnaireRepository(createQuestionnairePool(target), target);
}

export async function insertResponse(submission: QuestionnaireSubmission): Promise<QuestionnaireResponse> {
  return createEnvironmentRepository().insertResponse(submission);
}

export async function listResponses(): Promise<QuestionnaireResponse[]> {
  return createEnvironmentRepository().listResponses();
}

export function toResponsesCsv(rows: QuestionnaireResponse[]): string {
  const quote = (value: string) =>
    /[\",\r\n]/.test(value) ? `\"${value.replaceAll('\"', '\"\"')}\"` : value;

  return [
    'id,nickname,organization,profession,jobTitle,createdAt',
    ...rows.map((row) => [
      row.id,
      row.nickname,
      row.organization,
      row.profession,
      row.jobTitle,
      row.createdAt,
    ].map(quote).join(',')),
  ].join('\r\n') + '\r\n';
}
