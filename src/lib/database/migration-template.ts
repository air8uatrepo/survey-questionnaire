import { assertDatabaseTarget, type DatabaseTarget } from './target-schema';

const invalidTemplateMessage = 'Questionnaire migration template is invalid.';

export function renderQuestionnaireMigration(target: DatabaseTarget, template: string): string {
  assertDatabaseTarget(target);

  const token = '{{TARGET_SCHEMA}}';
  if (template.split(token).length - 1 < 1) {
    throw new Error(invalidTemplateMessage);
  }

  const rendered = template.replaceAll(token, target.schemaSql);
  if (
    /{{[^}]+}}/.test(rendered)
    || /\bpublic\s*\.\s*questionnaire_responses\b/i.test(rendered)
  ) {
    throw new Error(invalidTemplateMessage);
  }

  return rendered;
}
