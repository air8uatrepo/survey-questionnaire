export const DEMO_PREFIX = 'DEMO-REQ-001-20260918-01' as const;

export const QUESTIONNAIRE_FIELDS = [
  'nickname',
  'organization',
  'profession',
  'jobTitle',
] as const;

export type QuestionnaireField = (typeof QUESTIONNAIRE_FIELDS)[number];

export type QuestionnaireSubmission = Record<QuestionnaireField, string>;

export type QuestionnaireResponse = QuestionnaireSubmission & {
  id: string;
  createdAt: string;
};

export type ParseResult =
  | { ok: true; value: QuestionnaireSubmission }
  | { ok: false; fieldErrors: Record<QuestionnaireField, string> };

const fieldLabels: Record<QuestionnaireField, string> = {
  nickname: 'Nickname',
  organization: 'Organization',
  profession: 'Profession',
  jobTitle: 'Job title',
};

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

export function parseQuestionnaireSubmission(input: unknown): ParseResult {
  const source = isRecord(input) ? input : {};
  const fieldErrors = {} as Record<QuestionnaireField, string>;
  const value = {} as QuestionnaireSubmission;

  for (const field of QUESTIONNAIRE_FIELDS) {
    const submittedValue = source[field];
    const trimmedValue = typeof submittedValue === 'string' ? submittedValue.trim() : '';

    if (trimmedValue === '') {
      fieldErrors[field] = `${fieldLabels[field]} is required.`;
      continue;
    }

    if (!trimmedValue.startsWith(DEMO_PREFIX)) {
      fieldErrors[field] = `${fieldLabels[field]} must start with ${DEMO_PREFIX}.`;
      continue;
    }

    fieldErrors[field] = '';
    value[field] = trimmedValue;
  }

  if (QUESTIONNAIRE_FIELDS.some((field) => fieldErrors[field] !== '')) {
    return { ok: false, fieldErrors };
  }

  return { ok: true, value };
}
