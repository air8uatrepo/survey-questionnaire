import 'server-only';

import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from './supabase/server';

export async function requireBusinessAppOwner(): Promise<User> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user === null) {
    redirect('/admin/login');
  }

  const ownerId = process.env.BUSINESS_APP_OWNER_USER_ID;
  if (!ownerId || user.id !== ownerId) {
    throw new Error('Forbidden');
  }

  return user;
}
