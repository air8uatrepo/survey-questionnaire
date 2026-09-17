'use client';

import { createBrowserClient } from '@supabase/ssr';

function getPublishableEnvironmentValue(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error('Supabase Auth configuration is unavailable.');
  }

  return value;
}

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    getPublishableEnvironmentValue('NEXT_PUBLIC_SUPABASE_URL'),
    getPublishableEnvironmentValue('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
  );
}
