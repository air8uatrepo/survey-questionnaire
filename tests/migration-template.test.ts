import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { renderQuestionnaireMigration } from '@/src/lib/database/migration-template';
import { resolveDatabaseTarget } from '@/src/lib/database/target-schema';

const projectRoot = resolve(import.meta.dirname, '..');
const templatePath = resolve(projectRoot, 'supabase/migrations/templates/001_create_questionnaire_responses.sql.tmpl');
const manifestPath = resolve(projectRoot, 'supabase/migrations/manifest.json');

function target(tier: 'preview' | 'production') {
  return resolveDatabaseTarget({
    BUSINESS_DIRECT_DATABASE_URL: 'postgresql://demo.invalid/questionnaire',
    BUSINESS_DIRECT_DEPLOYMENT_TIER: tier,
    BUSINESS_DIRECT_DATABASE_SCHEMA: tier === 'preview'
      ? 'proto_survey_questionnaire_poc'
      : 'app_survey_questionnaire_poc',
  });
}

it('renders the template into only the validated proto schema', async () => {
  const rendered = renderQuestionnaireMigration(target('preview'), await readFile(templatePath, 'utf8'));

  expect(rendered).toContain('"proto_survey_questionnaire_poc".questionnaire_responses');
  expect(rendered).not.toContain('"app_survey_questionnaire_poc"');
  expect(rendered).not.toContain('{{TARGET_SCHEMA}}');
  expect(rendered).not.toContain('public.questionnaire_responses');
});

it('renders the template into only the validated application schema', async () => {
  const rendered = renderQuestionnaireMigration(target('production'), await readFile(templatePath, 'utf8'));

  expect(rendered).toContain('"app_survey_questionnaire_poc".questionnaire_responses');
  expect(rendered).not.toContain('"proto_survey_questionnaire_poc"');
  expect(rendered).not.toContain('{{TARGET_SCHEMA}}');
  expect(rendered).not.toContain('public.questionnaire_responses');
});

it('rejects a template that would create a public response table', () => {
  expect(() => renderQuestionnaireMigration(
    target('preview'),
    'create table public.questionnaire_responses (id uuid); {{TARGET_SCHEMA}}',
  )).toThrow('Questionnaire migration template is invalid.');
});

it('matches the manifest hash to the committed template bytes', async () => {
  const [template, manifestSource] = await Promise.all([
    readFile(templatePath),
    readFile(manifestPath, 'utf8'),
  ]);
  const manifest = JSON.parse(manifestSource) as {
    migrations: Array<{ id: string; template: string; sha256: string }>;
  };

  expect(manifest.migrations).toEqual([{
    id: 'REQ-001/001',
    template: 'supabase/migrations/templates/001_create_questionnaire_responses.sql.tmpl',
    sha256: createHash('sha256').update(template).digest('hex'),
  }]);
});
