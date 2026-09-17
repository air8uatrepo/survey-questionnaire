import 'server-only';

import { createClient } from '@supabase/supabase-js';

function requiredServerEnvironment(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
  const value = process.env[name];

  if (value === undefined || value === '') {
    throw new Error(`Missing required server configuration: ${name}.`);
  }

  return value;
}

export function createServiceClient() {
  return createClient(
    requiredServerEnvironment('NEXT_PUBLIC_SUPABASE_URL'),
    requiredServerEnvironment('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
