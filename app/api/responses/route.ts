import { parseQuestionnaireSubmission, type QuestionnaireResponse, type QuestionnaireSubmission } from '@/src/lib/questionnaire';
import { insertResponse } from '@/src/lib/responses';

export type ResponseDependencies = {
  insertResponse: (submission: QuestionnaireSubmission) => Promise<QuestionnaireResponse>;
};

export function createResponsesPostHandler({ insertResponse: persistResponse }: ResponseDependencies) {
  return async function POST(request: Request): Promise<Response> {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
    }

    const parsed = parseQuestionnaireSubmission(body);
    if (!parsed.ok) {
      return Response.json({ ok: false, fieldErrors: parsed.fieldErrors }, { status: 400 });
    }

    try {
      await persistResponse(parsed.value);
    } catch {
      return Response.json({ ok: false, error: 'Unable to submit response.' }, { status: 500 });
    }

    return Response.json({ ok: true }, { status: 201 });
  };
}

export const POST = createResponsesPostHandler({ insertResponse });
