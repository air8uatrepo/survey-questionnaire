import 'server-only';

import { Pool } from 'pg';
import { assertDatabaseTarget, type DatabaseTarget } from './target-schema';

export type QueryResult<Row> = { rows: Row[] };

export interface Queryable {
  query<Row>(text: string, values?: readonly unknown[]): Promise<QueryResult<Row>>;
}

export function createQuestionnairePool(target: DatabaseTarget): Queryable {
  assertDatabaseTarget(target);

  const connectionString = process.env.BUSINESS_DIRECT_DATABASE_URL;
  if (connectionString === undefined || connectionString === '') {
    throw new Error('Database target configuration is invalid.');
  }

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: true },
  });
}
