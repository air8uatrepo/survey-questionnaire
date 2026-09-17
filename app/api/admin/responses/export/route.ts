import { createServerSupabaseClient } from '@/src/lib/supabase/server';
import { listResponses, toResponsesCsv } from '@/src/lib/responses';
import type { QuestionnaireResponse } from '@/src/lib/questionnaire';

type AuthenticatedUser = { id: string };

export type ExportDependencies = {
  getUser: () => Promise<AuthenticatedUser | null>;
  listResponses: () => Promise<QuestionnaireResponse[]>;
};

export function createExportGetHandler({ getUser, listResponses: getResponses }: ExportDependencies) {
  return async function GET(): Promise<Response> {
    const user = await getUser();
    if (user === null) {
      return new Response(null, { status: 401 });
    }

    if (user.id !== process.env.BUSINESS_APP_OWNER_USER_ID) {
      return new Response(null, { status: 403 });
    }

    return new Response(toResponsesCsv(await getResponses()), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="questionnaire-responses.csv"',
      },
    });
  };
}

export const GET = createExportGetHandler({
  async getUser() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  listResponses,
});
