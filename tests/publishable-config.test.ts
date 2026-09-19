import { afterEach, describe, expect, it } from 'vitest';

import { getPublishableSupabaseConfiguration } from '@/src/lib/supabase/publishable-config';

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

afterEach(() => {
  if (originalUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  }

  if (originalKey === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});

describe('getPublishableSupabaseConfiguration', () => {
  it('returns the configured publishable pair', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_example';

    expect(getPublishableSupabaseConfiguration()).toEqual({
      url: 'https://project.supabase.co',
      key: 'sb_publishable_example',
    });
  });

  it('reports unavailable configuration when the key is absent', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(() => getPublishableSupabaseConfiguration()).toThrow(
      'Supabase Auth configuration is unavailable.',
    );
  });

  it('reports unavailable configuration when the url is absent', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_example';

    expect(() => getPublishableSupabaseConfiguration()).toThrow(
      'Supabase Auth configuration is unavailable.',
    );
  });
});
