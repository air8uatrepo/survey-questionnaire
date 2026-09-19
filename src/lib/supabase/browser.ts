'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getPublishableSupabaseConfiguration } from './publishable-config';

export function createBrowserSupabaseClient() {
  const { url, key } = getPublishableSupabaseConfiguration();

  return createBrowserClient(url, key);
}
