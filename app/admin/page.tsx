import { requireBusinessAppOwner } from '@/src/lib/admin';
import { listResponses } from '@/src/lib/responses';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requireBusinessAppOwner();
  const responses = await listResponses();

  return (
    <main>
      <h1>Questionnaire responses</h1>
      <p><a href="/api/admin/responses/export">Download CSV</a></p>
      {responses.length === 0 ? <p>No responses yet.</p> : (
        <ul>
          {responses.map((response) => (
            <li key={response.id}>
              <dl>
                <dt>Nickname</dt>
                <dd>{response.nickname}</dd>
                <dt>Organization</dt>
                <dd>{response.organization}</dd>
                <dt>Profession</dt>
                <dd>{response.profession}</dd>
                <dt>Job title</dt>
                <dd>{response.jobTitle}</dd>
                <dt>Submitted at</dt>
                <dd>{response.createdAt}</dd>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
