import type { QuestionnaireResponse, QuestionnaireSubmission } from './questionnaire';

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

async function responseTable() {
  const { createServiceClient } = await import('./supabase/service');

  return createServiceClient().from('questionnaire_responses');
}

export async function insertResponse(
  submission: QuestionnaireSubmission,
): Promise<QuestionnaireResponse> {
  const operationId = crypto.randomUUID();
  const { data, error } = await (await responseTable())
    .insert({
      nickname: submission.nickname,
      organization: submission.organization,
      profession: submission.profession,
      job_title: submission.jobTitle,
    })
    .select('id,nickname,organization,profession,job_title,created_at')
    .single();

  if (error !== null || data === null) {
    recordOperationFailure(operationId);
    throw new Error('Response persistence failed.');
  }

  return toQuestionnaireResponse(data as DatabaseQuestionnaireResponse);
}

export async function listResponses(): Promise<QuestionnaireResponse[]> {
  const operationId = crypto.randomUUID();
  const { data, error } = await (await responseTable())
    .select('id,nickname,organization,profession,job_title,created_at')
    .order('created_at', { ascending: false });

  if (error !== null || data === null) {
    recordOperationFailure(operationId);
    throw new Error('Response retrieval failed.');
  }

  return (data as DatabaseQuestionnaireResponse[]).map(toQuestionnaireResponse);
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
